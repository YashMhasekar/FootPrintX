'use strict';

/**
 * breachRadarController.js
 *
 * Handles GET /api/breach-radar/scan
 *
 * Authentication model (identical to driveController / websiteTrackerController):
 *   - Reached only after authenticateToken JWT middleware has run.
 *   - req.user.userId — MongoDB User._id from JWT payload.
 *   - Google tokens retrieved from encrypted User document via tokenHelpers.
 */

const User                 = require('../models/User');
const breachRadarService   = require('../services/breachRadar/breachRadarService');
const { getDecryptedAccessToken, refreshGoogleToken } = require('../utils/tokenHelpers');
const { decryptToken }     = require('../utils/encryption');
const {
  saveBreachReport,
  appendScanHistory,
} = require('../services/reports/reportStorageService');

// ---------------------------------------------------------------------------
// Internal helper — resolves a live { access_token, refresh_token } object.
// Returns null and sends a 401 response if tokens are unavailable.
// (Exact same pattern as driveController / websiteTrackerController)
// ---------------------------------------------------------------------------
async function resolveTokenSet(req, res) {
  const user = await User.findById(req.user.userId).select(
    '+accessToken +refreshToken +tokenExpiry +tokenStatus'
  );

  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return null;
  }

  if (user.tokenExpiry && new Date() > new Date(user.tokenExpiry)) {
    try {
      await refreshGoogleToken(user);
      const refreshed = await User.findById(req.user.userId).select(
        '+accessToken +refreshToken +tokenExpiry +tokenStatus'
      );
      return buildTokenSet(refreshed, res);
    } catch (err) {
      res.status(401).json({
        error: 'Google token expired and refresh failed. Please re-authenticate.',
        requiresReauth: true,
      });
      return null;
    }
  }

  return buildTokenSet(user, res);
}

function buildTokenSet(user, res) {
  const accessToken = getDecryptedAccessToken(user);
  if (!accessToken) {
    res.status(401).json({
      error: 'No Google access token found. Please connect your Google account.',
      requiresReauth: true,
    });
    return null;
  }
  return {
    access_token:  accessToken,
    refresh_token: user.refreshToken ? decryptToken(user.refreshToken) : undefined,
  };
}

// ---------------------------------------------------------------------------
// GET /api/breach-radar/scan
//
// Runs a full Privacy & Security Radar scan for the authenticated user.
// Aggregates data from Drive, Drive Classifier, and Website Tracker.
//
// Response shape:
//   {
//     score,          — 0–100 integer
//     level,          — 'Excellent' | 'Good' | 'Needs Attention' | 'At Risk'
//     summary,        — human-readable summary string
//     alerts,         — array of alert objects
//     recommendations,— array of recommendation objects
//     statistics      — raw counts object
//   }
// ---------------------------------------------------------------------------
async function scan(req, res) {
  const tokenSet = await resolveTokenSet(req, res);
  if (!tokenSet) return;

  const userId    = req.user.userId;
  const startedAt = Date.now();

  try {
    const result = await breachRadarService.runScan(tokenSet);

    // ── Persist report (non-blocking) ──────────────────────────────────────
    // saveBreachReport also internally calls saveDigitalRiskScore
    const durationMs = Date.now() - startedAt;
    Promise.all([
      saveBreachReport(userId, result),
      appendScanHistory(userId, {
        module:     'breachRadar',
        durationMs,
        status:     'success',
        summary:    `Score: ${result.score}/100 — ${result.level}`,
      }),
    ]).catch((err) =>
      console.error('breachRadarController: background save error:', err.message)
    );
    // ──────────────────────────────────────────────────────────────────────

    res.json(result);
  } catch (err) {
    console.error('breachRadarController.scan error:', err.message);

    // Record the failed scan in history (best-effort)
    appendScanHistory(userId, {
      module:     'breachRadar',
      durationMs: Date.now() - startedAt,
      status:     'error',
      summary:    err.message,
    }).catch(() => {});

    res.status(502).json({ error: 'Failed to run Privacy & Security Radar scan. Please try again.' });
  }
}

module.exports = { scan };
