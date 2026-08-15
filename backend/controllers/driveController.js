'use strict';

/**
 * driveController.js
 * Handles GET /api/drive/summary and GET /api/drive/files.
 *
 * Authentication: every handler is reached only after the authenticateToken
 * JWT middleware has already run (wired in routes/drive.js).
 * req.user.userId is the authenticated user's MongoDB _id string.
 *
 * Google tokens are retrieved from the encrypted MongoDB User record using
 * the existing tokenHelpers utilities — no session store, no second auth system.
 *
 * DIAGNOSTIC LOGGING:
 * All [drive:diag] lines are intentionally verbose in development to aid
 * root-cause analysis. They log only safe metadata — never tokens, secrets,
 * or credential values.
 */

const User          = require('../models/User');
const driveService  = require('../services/drive/driveService');
const mlService     = require('../services/drive/mlService');
const { getDecryptedAccessToken, refreshGoogleToken } = require('../utils/tokenHelpers');
const { decryptToken } = require('../utils/encryption');

// ---------------------------------------------------------------------------
// Internal helper — resolves a live { access_token, refresh_token } object
// from the authenticated user's encrypted MongoDB record.
// Returns null and sends a 401/502 response if tokens are unavailable.
// ---------------------------------------------------------------------------
async function resolveTokenSet(req, res) {
  const userId = req.user?.userId;
  console.log(`[drive:diag] resolveTokenSet — userId from JWT: ${userId}`);

  if (!userId) {
    console.error('[drive:diag] No userId in req.user. JWT payload malformed.');
    res.status(401).json({ error: 'Invalid token payload' });
    return null;
  }

  // ── Step 1: fetch user from MongoDB ───────────────────────────────────────
  let user;
  try {
    user = await User.findById(userId).select(
      '+accessToken +refreshToken +tokenExpiry +tokenStatus'
    );
  } catch (dbErr) {
    console.error('[drive:diag] MongoDB error fetching user:', dbErr.message);
    res.status(500).json({ error: 'Database error. Please try again.' });
    return null;
  }

  console.log(`[drive:diag] User found in MongoDB: ${!!user}`);
  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return null;
  }

  console.log(`[drive:diag] User email: ${user.email}`);
  console.log(`[drive:diag] accessToken present: ${!!user.accessToken}`);
  console.log(`[drive:diag] refreshToken present: ${!!user.refreshToken}`);
  console.log(`[drive:diag] tokenStatus: ${user.tokenStatus}`);
  console.log(`[drive:diag] tokenExpiry: ${user.tokenExpiry ? user.tokenExpiry.toISOString() : 'not set'}`);
  console.log(`[drive:diag] oauthScopes stored: ${JSON.stringify(user.oauthScopes || [])}`);

  // ── Step 2: check token expiry and attempt refresh if needed ──────────────
  const now = new Date();
  const isExpired = user.tokenExpiry && now > new Date(user.tokenExpiry);
  console.log(`[drive:diag] Token expired (server-side check): ${isExpired}`);

  if (isExpired) {
    console.log('[drive:diag] Token is expired — attempting refresh...');

    if (!user.refreshToken) {
      console.warn('[drive:diag] No refresh token stored — cannot refresh. User must re-authenticate.');
      res.status(401).json({
        error: 'Google access token expired and no refresh token is stored. Please re-authenticate with Google.',
        requiresReauth: true,
      });
      return null;
    }

    try {
      await refreshGoogleToken(user);
      console.log('[drive:diag] Token refreshed successfully. Reloading user...');

      // Reload to get freshly-stored tokens
      user = await User.findById(userId).select(
        '+accessToken +refreshToken +tokenExpiry +tokenStatus'
      );
      console.log(`[drive:diag] After refresh — tokenStatus: ${user.tokenStatus}, tokenExpiry: ${user.tokenExpiry?.toISOString()}`);
    } catch (refreshErr) {
      console.error('[drive:diag] Token refresh failed:', refreshErr.message);
      res.status(401).json({
        error: 'Google token expired and refresh failed. Please re-authenticate.',
        requiresReauth: true,
      });
      return null;
    }
  }

  // ── Step 3: decrypt the access token ──────────────────────────────────────
  const accessTokenRaw = user.accessToken;
  console.log(`[drive:diag] accessToken field is encrypted (contains ":"): ${accessTokenRaw ? accessTokenRaw.includes(':') : false}`);

  const accessToken = getDecryptedAccessToken(user);
  console.log(`[drive:diag] accessToken decrypted successfully: ${!!accessToken}`);

  if (!accessToken) {
    console.warn('[drive:diag] Decryption returned null/empty. Possibly a legacy token from before encryption migration, or no token stored.');
    res.status(401).json({
      error: 'No valid Google access token found. Please reconnect your Google account.',
      requiresReauth: true,
    });
    return null;
  }

  // Decrypt refresh token (non-fatal if missing — Drive read-only can work without it)
  let refreshToken;
  if (user.refreshToken) {
    try {
      refreshToken = decryptToken(user.refreshToken);
      console.log(`[drive:diag] refreshToken decrypted successfully: true`);
    } catch (decErr) {
      console.warn('[drive:diag] Could not decrypt refresh token:', decErr.message);
    }
  }

  return {
    access_token:  accessToken,
    refresh_token: refreshToken,
  };
}

// ---------------------------------------------------------------------------
// GET /api/drive/summary
// Returns a storage-usage breakdown by category (no ML call — fast path).
// ---------------------------------------------------------------------------
async function getSummary(req, res) {
  console.log(`\n[drive:diag] ── GET /api/drive/summary ── userId: ${req.user?.userId}`);

  const tokenSet = await resolveTokenSet(req, res);
  if (!tokenSet) return; // resolveTokenSet already sent the error response

  // ── Drive API call ─────────────────────────────────────────────────────────
  let files;
  try {
    console.log('[drive:diag] Calling driveService.listAllFiles()...');
    files = await driveService.listAllFiles(tokenSet);
    console.log(`[drive:diag] Drive API returned ${files.length} files.`);
  } catch (driveErr) {
    const code    = driveErr.code    ?? driveErr.response?.status ?? 'N/A';
    const message = driveErr.message ?? 'Unknown Drive API error';
    console.error(`[drive:diag] Drive API error — code: ${code}, message: ${message}`);

    // Surface scope/auth errors clearly
    if (code === 401 || code === 403) {
      return res.status(401).json({
        error: 'Google Drive access denied. Your token may be missing Drive scopes. Please re-authenticate.',
        requiresReauth: true,
        driveErrorCode: code,
      });
    }

    return res.status(502).json({
      error: 'Failed to fetch files from Google Drive.',
      driveErrorCode: code,
    });
  }

  const summary = driveService.summariseByCategory(files);
  console.log(`[drive:diag] Summary categories: ${Object.keys(summary).join(', ')}`);

  res.json({ totalFiles: files.length, summary });
}

// ---------------------------------------------------------------------------
// GET /api/drive/files
// Returns the full file list scored by the ML microservice.
// If ML is unavailable, files are returned with null decayScore + isJunk:false
// and a "mlServiceAvailable: false" flag so the frontend can show a notice.
// ---------------------------------------------------------------------------
async function getScoredFiles(req, res) {
  console.log(`\n[drive:diag] ── GET /api/drive/files ── userId: ${req.user?.userId}`);

  const tokenSet = await resolveTokenSet(req, res);
  if (!tokenSet) return; // resolveTokenSet already sent the error response

  // ── Phase A: Fetch file list from Google Drive ─────────────────────────────
  let files;
  try {
    console.log('[drive:diag] Phase A — Calling driveService.listAllFiles()...');
    files = await driveService.listAllFiles(tokenSet);
    console.log(`[drive:diag] Phase A — Drive API returned ${files.length} files.`);
  } catch (driveErr) {
    const code    = driveErr.code    ?? driveErr.response?.status ?? 'N/A';
    const message = driveErr.message ?? 'Unknown Drive API error';
    console.error(`[drive:diag] Phase A FAILED — Drive API error — code: ${code}, message: ${message}`);

    if (code === 401 || code === 403) {
      return res.status(401).json({
        error: 'Google Drive access denied. Your token may be missing Drive scopes. Please re-authenticate.',
        requiresReauth: true,
        driveErrorCode: code,
      });
    }

    return res.status(502).json({
      error: 'Failed to fetch files from Google Drive.',
      driveErrorCode: code,
    });
  }

  // ── Phase B: Duplicate detection (local — never fails) ────────────────────
  const duplicates = driveService.findDuplicates(files);
  console.log(`[drive:diag] Phase B — Found ${duplicates.length} duplicate groups.`);

  // ── Phase C: ML scoring (graceful degradation if service is down) ──────────
  console.log('[drive:diag] Phase C — Calling mlService.scoreFiles()...');
  const { files: scored, mlServiceAvailable } = await mlService.scoreFiles(files);

  if (!mlServiceAvailable) {
    console.warn(
      `[drive:diag] Phase C — ML service unavailable. ` +
      `Returning ${scored.length} files without decay scores. ` +
      `To enable scoring, start the ML microservice at ${process.env.ML_SERVICE_URL || 'http://localhost:8000'}.`
    );
  } else {
    console.log(`[drive:diag] Phase C — ML scoring complete. ${scored.length} files scored.`);
  }

  // Sort highest decay score first; unsorted files (null score) go to the end
  scored.sort((a, b) => {
    if (a.decayScore === null && b.decayScore === null) return 0;
    if (a.decayScore === null) return 1;
    if (b.decayScore === null) return -1;
    return b.decayScore - a.decayScore;
  });

  res.json({
    totalFiles:          files.length,
    duplicateGroups:     duplicates.length,
    mlServiceAvailable,
    files:               scored,
  });
}

module.exports = { getSummary, getScoredFiles };
