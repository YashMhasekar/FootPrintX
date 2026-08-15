'use strict';

/**
 * websiteTrackerController.js
 *
 * Thin controller for the Website Tracker module.
 * Resolves the authenticated user's Google token set from MongoDB
 * (identical pattern to emailClassificationController / driveController)
 * then delegates all work to websiteTrackerService.
 */

const User                   = require('../models/User');
const websiteTrackerService  = require('../services/websiteTracker/websiteTrackerService');
const { getDecryptedAccessToken, refreshGoogleToken } = require('../utils/tokenHelpers');
const { decryptToken }       = require('../utils/encryption');
const {
  saveWebsiteReport,
  appendScanHistory,
} = require('../services/reports/reportStorageService');

// ---------------------------------------------------------------------------
// Shared token-resolution helper (same pattern as emailClassificationController)
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
// GET /api/website-tracker/scan
//
// Scans the user's Gmail inbox, extracts sender domains, groups and
// categorises them, and returns the full website dashboard payload.
//
// Query params (all optional):
//   maxMessages {number}  — emails to scan (default 300, max 1500)
// ---------------------------------------------------------------------------
async function scanWebsites(req, res) {
  const tokenSet = await resolveTokenSet(req, res);
  if (!tokenSet) return;

  const userId    = req.user.userId;
  const startedAt = Date.now();

  const maxMessages = Math.min(
    parseInt(req.query.maxMessages, 10) || 300,
    1500
  );

  try {
    const result = await websiteTrackerService.scanWebsites(tokenSet, { maxMessages });

    // ── Persist report (non-blocking) ──────────────────────────────────────
    const durationMs = Date.now() - startedAt;
    Promise.all([
      saveWebsiteReport(userId, result),
      appendScanHistory(userId, {
        module:     'websiteTracker',
        durationMs,
        status:     'success',
        summary:    `Tracked ${result.totalWebsites ?? 0} website(s)`,
      }),
    ]).catch((err) =>
      console.error('websiteTrackerController: background save error:', err.message)
    );
    // ──────────────────────────────────────────────────────────────────────

    res.json(result);
  } catch (err) {
    console.error('websiteTrackerController.scanWebsites error:', err.message);

    // Record the failed scan in history (best-effort)
    appendScanHistory(userId, {
      module:     'websiteTracker',
      durationMs: Date.now() - startedAt,
      status:     'error',
      summary:    err.message,
    }).catch(() => {});

    res.status(502).json({ error: 'Failed to scan Gmail for websites. Please try again.' });
  }
}

module.exports = { scanWebsites };
