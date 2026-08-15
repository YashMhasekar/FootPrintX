'use strict';

/**
 * emailController.js
 * Handles:
 *   POST /api/email/scan
 *   GET  /api/email/subscriptions
 *   POST /api/email/unsubscribe
 *   POST /api/email/unsubscribe/bulk
 *
 * Authentication: every handler is reached only after the authenticateToken
 * JWT middleware has run (wired in routes/email.js).
 * req.user.userId  — authenticated user's MongoDB _id (string from JWT payload)
 * req.user.email   — authenticated user's email (used as From for mailto sends)
 *
 * Google tokens are retrieved from the encrypted MongoDB User record using
 * the existing tokenHelpers utilities — no session store, no second auth system.
 */

const mongoose        = require('mongoose');
const User            = require('../models/User');
const Subscription    = require('../models/Subscription');
const gmailService    = require('../services/gmail/gmailService');
const unsubscribeService = require('../services/gmail/unsubscribeService');
const { getDecryptedAccessToken, refreshGoogleToken } = require('../utils/tokenHelpers');
const { decryptToken } = require('../utils/encryption');

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** True when Mongoose has an open connection (readyState 1 = connected). */
function mongooseConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * Resolves a live { access_token, refresh_token } object from the
 * authenticated user's encrypted MongoDB record.
 * Returns null and sends the appropriate HTTP error if tokens are unavailable.
 */
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

/**
 * Persists an unsubscribe result back to the Subscription document.
 * Silently skips when MongoDB is not connected.
 */
async function applyResultToDb(userId, result) {
  if (!mongooseConnected()) return;

  const status = result.unsubscribeSucceeded
    ? 'unsubscribe_sent'
    : result.requiresManualAction
    ? 'manual_pending'
    : result.filterApplied
    ? 'filtered'
    : 'failed';

  await Subscription.updateOne(
    { userId, senderEmail: result.senderEmail },
    { $set: { status, lastActionAt: new Date() } }
  );
}

// ---------------------------------------------------------------------------
// POST /api/email/scan
// Scans Gmail for subscription senders, upserts results into MongoDB,
// and returns the full sender list.
// ---------------------------------------------------------------------------
async function scanSubscriptions(req, res) {
  const tokenSet = await resolveTokenSet(req, res);
  if (!tokenSet) return;

  try {
    const senders = await gmailService.scanSubscriptions(tokenSet);

    if (senders.length && mongooseConnected()) {
      const userId = req.user.userId;
      const bulkOps = senders.map((s) => ({
        updateOne: {
          filter: { userId, senderEmail: s.senderEmail },
          update: {
            $set: {
              senderName:        s.senderName,
              category:          s.category,
              emailCount:        s.emailCount,
              latestSubject:     s.latestSubject,
              latestDate:        s.latestDate,
              unsubscribeMethod: s.unsubscribeMethod,
              unsubscribeUrl:    s.unsubscribeUrl,
              unsubscribeMailto: s.unsubscribeMailto,
              oneClickSupported: s.oneClickSupported,
              bodyLinkOnly:      Boolean(s.bodyLinkOnly),
            },
          },
          upsert: true,
        },
      }));
      await Subscription.bulkWrite(bulkOps);
    }

    res.json({ totalSenders: senders.length, subscriptions: senders });
  } catch (err) {
    console.error('Gmail scan error:', err.message);
    res.status(502).json({ error: 'Failed to scan Gmail inbox' });
  }
}

// ---------------------------------------------------------------------------
// GET /api/email/subscriptions
// Returns the cached subscription list from MongoDB (fast, no Gmail call).
// Falls back to an empty array when MongoDB is not connected.
// ---------------------------------------------------------------------------
async function getSubscriptions(req, res) {
  const tokenSet = await resolveTokenSet(req, res);
  if (!tokenSet) return;

  try {
    const subs = mongooseConnected()
      ? await Subscription.find({ userId: req.user.userId }).sort({ emailCount: -1 })
      : [];
    res.json({ totalSenders: subs.length, subscriptions: subs });
  } catch (err) {
    console.error('Fetch subscriptions error:', err.message);
    res.status(500).json({ error: 'Failed to load subscriptions' });
  }
}

// ---------------------------------------------------------------------------
// POST /api/email/unsubscribe
// Body: { senderEmail, [unsubscribeMethod, unsubscribeUrl, unsubscribeMailto] }
//
// Looks up the subscription in MongoDB first; falls back to the client-supplied
// body when the DB record is missing (covers no-DB setups and stale cache).
// ---------------------------------------------------------------------------
async function unsubscribeOne(req, res) {
  const tokenSet = await resolveTokenSet(req, res);
  if (!tokenSet) return;

  const { senderEmail } = req.body;
  if (!senderEmail) {
    return res.status(400).json({ error: 'senderEmail is required' });
  }

  try {
    let sub = mongooseConnected()
      ? await Subscription.findOne({ userId: req.user.userId, senderEmail })
      : null;

    if (!sub) {
      if (!req.body.unsubscribeMethod) {
        return res.status(404).json({
          error: mongooseConnected()
            ? 'Subscription not found. Run a scan first.'
            : 'Subscription not found — send the full subscription object (senderEmail, unsubscribeMethod, …).',
        });
      }
      sub = req.body; // use client-supplied data as fallback
    }

    const result = await unsubscribeService.unsubscribeSender(
      tokenSet,
      sub,
      req.user.email // from JWT payload — used as From address in mailto sends
    );

    await applyResultToDb(req.user.userId, result);
    res.json(result);
  } catch (err) {
    console.error('Unsubscribe error:', err.message);
    res.status(500).json({ error: 'Unsubscribe attempt failed' });
  }
}

// ---------------------------------------------------------------------------
// POST /api/email/unsubscribe/bulk
// Body: { subscriptions: [ { senderEmail, unsubscribeMethod, … }, … ] }
//
// Prefers the MongoDB record for each sender; falls back to the client-supplied
// object when a record is not found.
// ---------------------------------------------------------------------------
async function unsubscribeBulk(req, res) {
  const tokenSet = await resolveTokenSet(req, res);
  if (!tokenSet) return;

  const { subscriptions } = req.body;
  if (!Array.isArray(subscriptions) || !subscriptions.length) {
    return res.status(400).json({ error: 'subscriptions must be a non-empty array' });
  }

  try {
    let subs = subscriptions;

    if (mongooseConnected()) {
      const senderEmails = subscriptions.map((s) => s.senderEmail);
      const dbSubs       = await Subscription.find({
        userId:      req.user.userId,
        senderEmail: { $in: senderEmails },
      });
      const dbByEmail = new Map(dbSubs.map((s) => [s.senderEmail, s]));
      // Prefer the DB record; fall back to what the client sent
      subs = subscriptions.map((s) => dbByEmail.get(s.senderEmail) || s);
    }

    const results = await unsubscribeService.unsubscribeSenders(
      tokenSet,
      subs,
      req.user.email
    );

    await Promise.all(results.map((r) => applyResultToDb(req.user.userId, r)));
    res.json({ results });
  } catch (err) {
    console.error('Bulk unsubscribe error:', err.message);
    res.status(500).json({ error: 'Bulk unsubscribe failed' });
  }
}

module.exports = { scanSubscriptions, getSubscriptions, unsubscribeOne, unsubscribeBulk };
