'use strict';

/**
 * emailClassificationController.js
 *
 * Thin controller layer for the Feature2 Email Classifier + Bulk Delete.
 * Every handler:
 *   1. Resolves the authenticated user's Google token set from MongoDB.
 *   2. Delegates ALL business logic to the service layer.
 *   3. Persists the result via reportStorageService (fire-and-forget, never
 *      blocks or breaks the response).
 *   4. Returns a structured JSON response.
 *
 * Authentication model (identical to driveController / emailController):
 *   - Reached only after authenticateToken JWT middleware has run.
 *   - req.user.userId  — MongoDB User._id (string from JWT payload)
 *   - req.user.email   — user's email address
 *   - Google tokens retrieved from encrypted User document via tokenHelpers.
 *   - No session store, no InstalledAppFlow, no second auth system.
 */

const User                  = require('../models/User');
const emailFetcherService   = require('../services/emailClassification/emailFetcherService');
const emailClassifierService = require('../services/emailClassification/emailClassifierService');
const emailDeleterService   = require('../services/emailClassification/emailDeleterService');
const { getDecryptedAccessToken, refreshGoogleToken } = require('../utils/tokenHelpers');
const { decryptToken }      = require('../utils/encryption');
const {
  saveEmailReport,
  saveAutoCleanupReport,
  appendScanHistory,
} = require('../services/reports/reportStorageService');

// ---------------------------------------------------------------------------
// Shared token-resolution helper (same pattern as driveController)
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
// POST /api/email-classification/scan
//
// Fetches emails from the user's Gmail inbox, classifies them, and returns
// the categorised results with a summary breakdown.
//
// Query params (all optional):
//   maxResults {number}  — max emails to fetch (default: 100 for responsiveness)
//   query      {string}  — Gmail search query   (default: 'in:inbox')
// ---------------------------------------------------------------------------
async function scanEmails(req, res) {
  const tokenSet = await resolveTokenSet(req, res);
  if (!tokenSet) return;

  const userId = req.user.userId;

  // Cap at 100 for the initial implementation — callers can raise via query param
  const maxResults = Math.min(
    parseInt(req.query.maxResults, 10) || 100,
    1500
  );
  const query = req.query.query || 'in:inbox';

  const startedAt = Date.now();

  try {
    // Step 1: fetch full email bodies
    const emails = await emailFetcherService.fetchEmails(tokenSet, { maxResults, query });

    // Step 2: classify every fetched email
    const classified = await emailClassifierService.classifyEmails(emails);

    // Step 3: build summary statistics (mirrors Feature2 Streamlit dashboard)
    const keepCategories   = ['Personal', 'Work', 'Financial'];
    const deleteCategories = ['Marketing', 'Spam', 'Low Priority'];

    const totalEmails  = emails.length;
    const keepCount    = keepCategories.reduce(
      (acc, c) => acc + (classified[c]?.length || 0), 0
    );
    const deleteCount  = deleteCategories.reduce(
      (acc, c) => acc + (classified[c]?.length || 0), 0
    );
    const reviewCount  = totalEmails - keepCount - deleteCount;

    // Category-level counts (for the tab headers in the future UI)
    const categoryCounts = Object.fromEntries(
      emailClassifierService.CATEGORIES.map((c) => [c, classified[c]?.length || 0])
    );

    const responsePayload = {
      totalEmails,
      summary: { keep: keepCount, review: reviewCount, delete: deleteCount },
      categoryCounts,
      classified,  // { Personal: [...], Work: [...], ... }
    };

    // ── Persist report (non-blocking) ──────────────────────────────────────
    const durationMs = Date.now() - startedAt;
    Promise.all([
      saveEmailReport(userId, responsePayload),
      appendScanHistory(userId, {
        module:     'emailClassification',
        durationMs,
        status:     'success',
        summary:    `Classified ${totalEmails} email(s)`,
      }),
    ]).catch((err) =>
      console.error('emailClassificationController: background save error:', err.message)
    );
    // ──────────────────────────────────────────────────────────────────────

    res.json(responsePayload);
  } catch (err) {
    console.error('emailClassificationController.scanEmails error:', err.message);

    // Record the failed scan in history (best-effort)
    appendScanHistory(userId, {
      module:     'emailClassification',
      durationMs: Date.now() - startedAt,
      status:     'error',
      summary:    err.message,
    }).catch(() => {});

    res.status(502).json({ error: 'Failed to fetch and classify emails' });
  }
}

// ---------------------------------------------------------------------------
// POST /api/email-classification/trash
//
// Moves the supplied email IDs to the Gmail Trash (recoverable for 30 days).
//
// Body: { emailIds: string[], dryRun?: boolean }
// ---------------------------------------------------------------------------
async function trashEmails(req, res) {
  const tokenSet = await resolveTokenSet(req, res);
  if (!tokenSet) return;

  const userId = req.user.userId;
  const { emailIds, dryRun = false } = req.body;

  if (!Array.isArray(emailIds) || emailIds.length === 0) {
    return res.status(400).json({ error: 'emailIds must be a non-empty array' });
  }

  try {
    const result = await emailDeleterService.trashEmails(tokenSet, emailIds, { dryRun });

    const responsePayload = {
      dryRun,
      trashed: result.trashed,
      failed:  result.failed,
      message: dryRun
        ? `DRY RUN: would trash ${emailIds.length} emails`
        : `Moved ${result.trashed} email(s) to trash`,
    };

    // ── Persist cleanup stats (non-blocking, skip dry runs) ───────────────
    if (!dryRun) {
      Promise.all([
        saveAutoCleanupReport(userId, {
          actionType: 'trash',
          dryRun,
          trashed:    result.trashed,
          deleted:    0,
          failed:     result.failed,
          emailIds,
        }),
        appendScanHistory(userId, {
          module:     'autoCleanup',
          durationMs: 0,
          status:     result.failed > 0 ? 'partial' : 'success',
          summary:    `Trashed ${result.trashed} email(s)`,
        }),
      ]).catch((err) =>
        console.error('emailClassificationController: trash save error:', err.message)
      );
    }
    // ──────────────────────────────────────────────────────────────────────

    res.json(responsePayload);
  } catch (err) {
    console.error('emailClassificationController.trashEmails error:', err.message);
    res.status(502).json({ error: 'Failed to trash emails' });
  }
}

// ---------------------------------------------------------------------------
// POST /api/email-classification/delete
//
// Permanently deletes the supplied email IDs via Gmail batchDelete.
// This action CANNOT be undone.
//
// Body: { emailIds: string[], dryRun?: boolean }
// ---------------------------------------------------------------------------
async function deleteEmails(req, res) {
  const tokenSet = await resolveTokenSet(req, res);
  if (!tokenSet) return;

  const userId = req.user.userId;
  const { emailIds, dryRun = false } = req.body;

  if (!Array.isArray(emailIds) || emailIds.length === 0) {
    return res.status(400).json({ error: 'emailIds must be a non-empty array' });
  }

  try {
    const result = await emailDeleterService.deleteEmails(tokenSet, emailIds, { dryRun });

    const responsePayload = {
      dryRun,
      deleted: result.deleted,
      failed:  result.failed,
      message: dryRun
        ? `DRY RUN: would permanently delete ${emailIds.length} emails`
        : `Permanently deleted ${result.deleted} email(s)`,
    };

    // ── Persist cleanup stats (non-blocking, skip dry runs) ───────────────
    if (!dryRun) {
      Promise.all([
        saveAutoCleanupReport(userId, {
          actionType: 'delete',
          dryRun,
          trashed:    0,
          deleted:    result.deleted,
          failed:     result.failed,
          emailIds,
        }),
        appendScanHistory(userId, {
          module:     'autoCleanup',
          durationMs: 0,
          status:     result.failed > 0 ? 'partial' : 'success',
          summary:    `Permanently deleted ${result.deleted} email(s)`,
        }),
      ]).catch((err) =>
        console.error('emailClassificationController: delete save error:', err.message)
      );
    }
    // ──────────────────────────────────────────────────────────────────────

    res.json(responsePayload);
  } catch (err) {
    console.error('emailClassificationController.deleteEmails error:', err.message);
    res.status(502).json({ error: 'Failed to delete emails' });
  }
}

// ---------------------------------------------------------------------------
// POST /api/email-classification/verify
//
// Verifies whether a set of message IDs were successfully deleted/trashed.
// Useful for post-deletion confirmation in the UI.
//
// Body: { emailIds: string[] }
// ---------------------------------------------------------------------------
async function verifyDeletion(req, res) {
  const tokenSet = await resolveTokenSet(req, res);
  if (!tokenSet) return;

  const { emailIds } = req.body;

  if (!Array.isArray(emailIds) || emailIds.length === 0) {
    return res.status(400).json({ error: 'emailIds must be a non-empty array' });
  }

  try {
    const result = await emailDeleterService.verifyDeletion(tokenSet, emailIds);
    res.json({
      checked:    emailIds.length,
      deleted:    result.deleted,
      stillExist: result.stillExist,
    });
  } catch (err) {
    console.error('emailClassificationController.verifyDeletion error:', err.message);
    res.status(502).json({ error: 'Failed to verify deletion' });
  }
}

module.exports = { scanEmails, trashEmails, deleteEmails, verifyDeletion };
