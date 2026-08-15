'use strict';

/**
 * mlService.js
 * Drive Decay scoring engine.
 *
 * Previously this module was an HTTP client for a Python Flask microservice
 * at ML_SERVICE_URL (localhost:8000). That service was never built, so every
 * scan returned decayScore: null / isJunk: false for all files, which the
 * frontend rendered as 0% for every file.
 *
 * This module now contains a fully deterministic, local scoring engine that
 * derives decay scores exclusively from the metadata already returned by the
 * Google Drive API — no extra API calls, no random values, no hardcoded junk.
 *
 * If ML_SERVICE_URL is set AND the remote service is reachable, the remote
 * service is used instead (forward-compatible). The local engine is the
 * authoritative fallback and is used whenever the remote service is absent.
 *
 * Public interface (unchanged):
 *   scoreFiles(files)         → Promise<{ files: Array, mlServiceAvailable: boolean }>
 *   isMLServiceHealthy()      → Promise<boolean>
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SCORING MODEL  (all scores are 0–1 floats; final score clamped to [0, 1])
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * decay = w_mod  * modificationStaleness   (how long since last edit)
 *       + w_view * viewStaleness            (how long since last open)
 *       + w_age  * ageStaleness             (absolute file age)
 *       + w_size * sizeSignal               (large unused files score higher)
 *       + w_type * typeDecayRate            (media/archives decay faster)
 *       + w_dup  * duplicateSignal          (exact-content duplicate)
 *       - w_shared * sharedBonus            (shared files are more likely active)
 *
 * Weights sum to 1.0 (bonus is a reduction, not additive):
 *   w_mod    = 0.30
 *   w_view   = 0.20
 *   w_age    = 0.15
 *   w_size   = 0.10
 *   w_type   = 0.15
 *   w_dup    = 0.10
 *   w_shared = 0.05  (subtracted when file.shared === true)
 *
 * isJunk threshold: decayScore >= 0.55
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * FEATURE DERIVATION
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * modificationStaleness
 *   Source: modifiedTime (RFC3339 from Drive API)
 *   Signal: files not modified in a long time are more likely stale.
 *   Curve:  sigmoid-like ramp:
 *             0 days  → 0.0
 *             90 days → ~0.3
 *             365 days → ~0.7
 *             730 days → ~0.9
 *             null    → 0.5 (neutral / unknown)
 *
 * viewStaleness
 *   Source: lastViewedTime (viewedByMeTime from Drive API)
 *   Signal: files never opened or not opened recently decay faster.
 *   Curve:  same ramp as modification but with shorter half-life (180 d):
 *             0 days  → 0.0
 *             60 days → ~0.3
 *             180 days → ~0.7
 *             365 days → ~0.9
 *             null    → 0.6 (never viewed = more stale than neutral)
 *
 * ageStaleness
 *   Source: createdTime
 *   Signal: very old files that have never been touched.
 *   Curve:  ramp over 3 years:
 *             < 1 year  → 0.0–0.3
 *             2 years   → ~0.5
 *             3+ years  → ~0.8
 *             null      → 0.3
 *
 * sizeSignal
 *   Source: sizeBytes
 *   Signal: a large file that is also stale wastes more storage.
 *   Curve:  log-scaled:
 *             0 bytes     → 0.0
 *             1 MB        → ~0.2
 *             100 MB      → ~0.5
 *             1 GB        → ~0.7
 *             10 GB+      → ~1.0
 *   Google Docs/Sheets/Slides report sizeBytes = 0; they score 0 here.
 *
 * typeDecayRate
 *   Source: category (from driveService.classifyMimeType)
 *   Signal: videos and archives are high-storage and often forgotten;
 *           active Google Workspace docs are less likely junk.
 *   Values:
 *             Media     → 0.7  (video/audio/images — often large & forgotten)
 *             Archives  → 0.6  (zip/tar etc — often one-time downloads)
 *             Other     → 0.5  (unknown mime types)
 *             Documents → 0.3  (PDFs, Word docs — more likely intentional)
 *             Folders   → 0.1  (folders are rarely junk by themselves)
 *   Note: Google Docs/Sheets/Slides also land in "Documents" (low rate).
 *
 * duplicateSignal
 *   Source: md5Checksum — compared across the entire file list
 *   Signal: files sharing an md5 checksum with another file are exact duplicates.
 *           Duplicates waste storage regardless of staleness.
 *   Value:  1.0 if duplicate, 0.0 otherwise.
 *   Note:   Google-native files (Docs, Sheets, Slides, Folders) have no
 *           md5Checksum and always score 0 here.
 *
 * sharedBonus (reduction)
 *   Source: shared (boolean from Drive API)
 *   Signal: shared files are more likely actively used by collaborators.
 *           Subtract a small amount from the score to reduce false positives.
 *   Value:  0.05 reduction when shared === true.
 */

const axios = require('axios');

const ML_BASE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const WEIGHTS = {
  modification: 0.30,
  view:         0.20,
  age:          0.15,
  size:         0.10,
  type:         0.15,
  duplicate:    0.10,
  sharedPenalty: 0.05, // subtracted, not added
};

// isJunk threshold — files at or above this score are classified as junk
const JUNK_THRESHOLD = 0.55;

// typeDecayRate by category (from driveService.classifyMimeType buckets)
const TYPE_DECAY_RATE = {
  Media:     0.7,
  Archives:  0.6,
  Other:     0.5,
  Documents: 0.3,
  Folders:   0.1,
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Days between a date string and now. Returns null if dateStr is falsy. */
function daysSince(dateStr) {
  if (!dateStr) return null;
  const ms = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, ms / 86_400_000);
}

/**
 * Sigmoid-shaped staleness ramp.
 * halfLifeDays: the number of days at which the signal reaches ~0.5.
 * Returns 0–1.
 */
function stalenessRamp(days, halfLifeDays) {
  if (days === null) return null;
  // Using 1 - exp(-k*days) where k is chosen so that at halfLife, result ≈ 0.5
  // k = ln(2) / halfLife  →  at days=halfLife: 1 - e^(-ln2) = 1 - 0.5 = 0.5  ✓
  const k = Math.LN2 / halfLifeDays;
  return 1 - Math.exp(-k * days);
}

/** Clamp value to [min, max]. */
function clamp(v, min = 0, max = 1) {
  return Math.min(max, Math.max(min, v));
}

// ─────────────────────────────────────────────────────────────────────────────
// Feature extractors
// ─────────────────────────────────────────────────────────────────────────────

function modificationStaleness(file) {
  const days = daysSince(file.modifiedTime);
  if (days === null) return 0.5; // unknown → neutral
  return stalenessRamp(days, 365); // half-life = 1 year
}

function viewStaleness(file) {
  const days = daysSince(file.lastViewedTime);
  if (days === null) return 0.6; // never viewed → more stale than neutral
  return stalenessRamp(days, 180); // half-life = 6 months
}

function ageStaleness(file) {
  const days = daysSince(file.createdTime);
  if (days === null) return 0.3;
  return stalenessRamp(days, 730); // half-life = 2 years
}

function sizeSignal(file) {
  const bytes = file.sizeBytes || 0;
  if (bytes === 0) return 0; // Google Docs / Folders — no storage cost
  // log10 scale: 1 B → ~0, 1 MB (10^6) → 0.5, 1 GB (10^9) → 0.75, 10 GB → ~1
  const log = Math.log10(bytes);        // range roughly 0–12 for real files
  return clamp(log / 12, 0, 1);
}

function typeDecayRate(file) {
  return TYPE_DECAY_RATE[file.category] ?? TYPE_DECAY_RATE.Other;
}

// ─────────────────────────────────────────────────────────────────────────────
// Duplicate index builder
// Builds a Set of md5 checksums that appear more than once in the file list.
// ─────────────────────────────────────────────────────────────────────────────

function buildDuplicateChecksums(files) {
  const counts = new Map();
  for (const f of files) {
    if (!f.md5Checksum) continue;
    counts.set(f.md5Checksum, (counts.get(f.md5Checksum) || 0) + 1);
  }
  const dupes = new Set();
  for (const [checksum, count] of counts) {
    if (count > 1) dupes.add(checksum);
  }
  return dupes;
}

// ─────────────────────────────────────────────────────────────────────────────
// Score a single file
// ─────────────────────────────────────────────────────────────────────────────

function scoreOneFile(file, duplicateChecksums) {
  const modS  = modificationStaleness(file);
  const viewS = viewStaleness(file);
  const ageS  = ageStaleness(file);
  const sizeS = sizeSignal(file);
  const typeS = typeDecayRate(file);
  const dupS  = (file.md5Checksum && duplicateChecksums.has(file.md5Checksum)) ? 1.0 : 0.0;
  const sharedReduction = file.shared ? WEIGHTS.sharedPenalty : 0;

  const raw =
    WEIGHTS.modification * modS  +
    WEIGHTS.view         * viewS +
    WEIGHTS.age          * ageS  +
    WEIGHTS.size         * sizeS +
    WEIGHTS.type         * typeS +
    WEIGHTS.duplicate    * dupS  -
    sharedReduction;

  const decayScore = clamp(raw, 0, 1);

  return {
    decayScore,
    isJunk: decayScore >= JUNK_THRESHOLD,
    // Explainability fields — useful for debugging and future UI tooltips
    _signals: {
      modificationStaleness: +modS.toFixed(3),
      viewStaleness:         +viewS.toFixed(3),
      ageStaleness:          +ageS.toFixed(3),
      sizeSignal:            +sizeS.toFixed(3),
      typeDecayRate:         +typeS.toFixed(3),
      duplicateSignal:       dupS,
      sharedReduction:       +sharedReduction.toFixed(3),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Local scoring engine — called when remote ML service is absent
// ─────────────────────────────────────────────────────────────────────────────

function scoreLocally(files) {
  const duplicateChecksums = buildDuplicateChecksums(files);

  const scored = files.map((f) => {
    const { decayScore, isJunk, _signals } = scoreOneFile(f, duplicateChecksums);
    return { ...f, decayScore, isJunk, _signals };
  });

  // ── Diagnostic summary (no secrets logged) ──────────────────────────────
  const scores  = scored.map((f) => f.decayScore);
  const min     = Math.min(...scores);
  const max     = Math.max(...scores);
  const mean    = scores.reduce((a, b) => a + b, 0) / scores.length;
  const sorted  = [...scores].sort((a, b) => a - b);
  const median  = sorted[Math.floor(sorted.length / 2)];
  const junk    = scored.filter((f) => f.isJunk).length;

  const buckets = [0, 20, 40, 60, 80, 100].map((lo, i, arr) => {
    const hi = arr[i + 1];
    if (hi === undefined) return null;
    const count = scores.filter((s) => s * 100 >= lo && s * 100 < hi).length;
    return `${lo}–${hi - 1}%: ${count}`;
  }).filter(Boolean);

  console.log('[mlService:local] ── Score distribution ──────────────────────');
  console.log(`[mlService:local]  Files scored : ${scores.length}`);
  console.log(`[mlService:local]  Min          : ${(min * 100).toFixed(1)}%`);
  console.log(`[mlService:local]  Max          : ${(max * 100).toFixed(1)}%`);
  console.log(`[mlService:local]  Mean         : ${(mean * 100).toFixed(1)}%`);
  console.log(`[mlService:local]  Median       : ${(median * 100).toFixed(1)}%`);
  console.log(`[mlService:local]  Junk (≥${(JUNK_THRESHOLD * 100).toFixed(0)}%) : ${junk} / ${scores.length}`);
  console.log(`[mlService:local]  Buckets      : ${buckets.join('  |  ')}`);
  console.log('[mlService:local] ──────────────────────────────────────────────');

  // Log 5 representative examples (no filenames — could be PII in some setups)
  const examples = [
    scored.reduce((a, b) => a.decayScore > b.decayScore ? a : b),   // highest
    scored.reduce((a, b) => a.decayScore < b.decayScore ? a : b),   // lowest
    scored[Math.floor(scored.length / 2)],                           // median
  ];
  examples.forEach((f) => {
    console.log(
      `[mlService:local]  Example — category: ${f.category}, ` +
      `size: ${(f.sizeBytes / 1048576).toFixed(2)} MB, ` +
      `decayScore: ${(f.decayScore * 100).toFixed(1)}%, ` +
      `isJunk: ${f.isJunk}, ` +
      `signals: mod=${f._signals.modificationStaleness} ` +
      `view=${f._signals.viewStaleness} ` +
      `age=${f._signals.ageStaleness} ` +
      `size=${f._signals.sizeSignal} ` +
      `type=${f._signals.typeDecayRate} ` +
      `dup=${f._signals.duplicateSignal}`
    );
  });

  return scored;
}

// ─────────────────────────────────────────────────────────────────────────────
// Remote ML service client (kept for forward-compatibility)
// ─────────────────────────────────────────────────────────────────────────────

async function scoreRemotely(files) {
  const payload = {
    files: files.map((f) => ({
      id:             f.id,
      name:           f.name,
      category:       f.category,
      sizeBytes:      f.sizeBytes,
      createdTime:    f.createdTime,
      modifiedTime:   f.modifiedTime,
      lastViewedTime: f.lastViewedTime,
    })),
  };

  console.log(`[mlService] Sending ${files.length} files to remote ML service at ${ML_BASE_URL}/score`);
  const { data } = await axios.post(`${ML_BASE_URL}/score`, payload, { timeout: 30000 });

  const scoreMap = new Map((data.scores || []).map((s) => [s.id, s]));

  return files.map((f) => ({
    ...f,
    decayScore: scoreMap.get(f.id)?.decayScore ?? null,
    isJunk:     scoreMap.get(f.id)?.isJunk     ?? false,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Scores all files with decay / junk signals.
 *
 * Strategy:
 *   1. Try the remote ML service (ML_SERVICE_URL) if it is set and reachable.
 *   2. Fall back to the local deterministic engine — always succeeds.
 *
 * Returns { files: Array, mlServiceAvailable: boolean }
 * mlServiceAvailable is always true because the local engine is the fallback.
 */
async function scoreFiles(files) {
  if (!files || files.length === 0) {
    return { files: [], mlServiceAvailable: true };
  }

  // ── Try remote first if explicitly configured ──────────────────────────────
  if (process.env.ML_SERVICE_URL) {
    try {
      const remoteScored = await scoreRemotely(files);
      console.log(`[mlService] Remote scoring complete. ${remoteScored.length} files scored.`);
      return { files: remoteScored, mlServiceAvailable: true };
    } catch (err) {
      const isConnRefused = err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND';
      const isTimeout     = err.code === 'ECONNABORTED' || err.message?.includes('timeout');

      if (isConnRefused) {
        console.warn(`[mlService] Remote ML service unreachable (${ML_BASE_URL}) — falling back to local engine.`);
      } else if (isTimeout) {
        console.warn(`[mlService] Remote ML service timed out — falling back to local engine.`);
      } else {
        const status  = err.response?.status  ?? 'N/A';
        const message = err.response?.data?.error ?? err.message ?? 'Unknown';
        console.error(`[mlService] Remote ML service error HTTP ${status}: ${message} — falling back to local engine.`);
      }
    }
  }

  // ── Local deterministic engine ─────────────────────────────────────────────
  console.log(`[mlService] Running local decay scoring engine on ${files.length} files.`);
  const localScored = scoreLocally(files);
  return { files: localScored, mlServiceAvailable: true };
}

/**
 * Lightweight health-check for the remote ML service.
 * The local engine is always healthy — this only checks the remote endpoint.
 */
async function isMLServiceHealthy() {
  try {
    const { data } = await axios.get(`${ML_BASE_URL}/health`, { timeout: 5000 });
    return data?.status === 'ok';
  } catch {
    return false;
  }
}

module.exports = { scoreFiles, isMLServiceHealthy };
