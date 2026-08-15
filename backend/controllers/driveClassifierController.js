'use strict';

/**
 * driveClassifierController.js
 *
 * Handles GET /api/drive-classifier/classify
 *
 * Authentication model (identical to driveController):
 *   - Reached only after authenticateToken JWT middleware has run.
 *   - req.user.userId — MongoDB User._id from JWT payload.
 *   - Google tokens retrieved from encrypted User document via tokenHelpers.
 */

const User                     = require('../models/User');
const driveClassifierService   = require('../services/drive/driveClassifierService');
const { getDecryptedAccessToken, refreshGoogleToken } = require('../utils/tokenHelpers');
const { decryptToken }         = require('../utils/encryption');
const {
  saveDriveReport,
  appendScanHistory,
} = require('../services/reports/reportStorageService');

// ---------------------------------------------------------------------------
// Internal helper — resolves a live { access_token, refresh_token } object.
// Returns null and sends a 401/502 response if tokens are unavailable.
// (Same pattern as driveController.resolveTokenSet)
// ---------------------------------------------------------------------------
async function resolveTokenSet(req, res) {
  const user = await User.findById(req.user.userId).select(
    '+accessToken +refreshToken +tokenExpiry +tokenStatus'
  );

  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return null;
  }

  // Refresh if expired
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
// GET /api/drive-classifier/classify
//
// Fetches all Drive files, classifies them by MIME type (with OpenAI fallback
// for ambiguous types), and returns:
//   { summary, categoryCounts, classifiedFiles }
// ---------------------------------------------------------------------------
async function classifyFiles(req, res) {
  const tokenSet = await resolveTokenSet(req, res);
  if (!tokenSet) return;

  const userId    = req.user.userId;
  const startedAt = Date.now();

  try {
    const result = await driveClassifierService.classifyDriveFiles(tokenSet);

    // ── Persist report (non-blocking) ──────────────────────────────────────
    const durationMs = Date.now() - startedAt;
    Promise.all([
      saveDriveReport(userId, result),
      appendScanHistory(userId, {
        module:     'driveClassifier',
        durationMs,
        status:     'success',
        summary:    `Classified ${result.summary?.totalFiles ?? 0} Drive file(s)`,
      }),
    ]).catch((err) =>
      console.error('driveClassifierController: background save error:', err.message)
    );
    // ──────────────────────────────────────────────────────────────────────

    res.json(result);
  } catch (err) {
    console.error('driveClassifierController.classifyFiles error:', err.message);

    // Record the failed scan in history (best-effort)
    appendScanHistory(userId, {
      module:     'driveClassifier',
      durationMs: Date.now() - startedAt,
      status:     'error',
      summary:    err.message,
    }).catch(() => {});

    res.status(502).json({ error: 'Failed to classify Drive files' });
  }
}

module.exports = { classifyFiles };
