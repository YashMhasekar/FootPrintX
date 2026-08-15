'use strict';

/**
 * reportStorageService.js
 *
 * Central service for persisting scan results to MongoDB.
 * Controllers call these helpers AFTER a successful scan — never before.
 *
 * All upsert helpers follow the same contract:
 *   - findOneAndUpdate with { upsert: true, new: true }
 *   - filter: { userId }  → guarantees one latest report per user
 *   - Sets `lastScanned` to now on every call
 *
 * Errors are caught and logged; they are NEVER re-thrown so a storage
 * failure never breaks the API response already sent to the client.
 */

const EmailReport       = require('../../models/EmailReport');
const DriveReport       = require('../../models/DriveReport');
const WebsiteReport     = require('../../models/WebsiteReport');
const BreachReport      = require('../../models/BreachReport');
const DigitalRiskScore  = require('../../models/DigitalRiskScore');
const AutoCleanupReport = require('../../models/AutoCleanupReport');
const ScanHistory       = require('../../models/ScanHistory');

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

/**
 * Wraps a Mongoose operation so that storage errors never propagate to callers.
 * @param {string}            label   — used in the error log
 * @param {() => Promise<*>}  fn
 * @returns {Promise<* | null>}
 */
async function safely(label, fn) {
  try {
    return await fn();
  } catch (err) {
    console.error(`reportStorageService [${label}] error:`, err.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Email Classification report
// ---------------------------------------------------------------------------

/**
 * Saves (or updates) the latest email classification scan for a user.
 *
 * @param {string|ObjectId} userId
 * @param {{
 *   totalEmails:    number,
 *   summary:        { keep: number, review: number, delete: number },
 *   categoryCounts: object,
 *   classified:     object,
 * }} data  — the full object returned by the scan endpoint
 * @returns {Promise<import('../../models/EmailReport') | null>}
 */
async function saveEmailReport(userId, data) {
  return safely('saveEmailReport', () =>
    EmailReport.findOneAndUpdate(
      { userId },
      {
        $set: {
          totalEmails:    data.totalEmails    ?? 0,
          summary:        data.summary        ?? {},
          categoryCounts: data.categoryCounts ?? {},
          classified:     data.classified     ?? {},
          lastScanned:    new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
  );
}

/**
 * Reads the stored email report for a user (no Gmail API call).
 * Returns null if no report has been saved yet.
 */
async function getEmailReport(userId) {
  return safely('getEmailReport', () =>
    EmailReport.findOne({ userId }).lean()
  );
}

// ---------------------------------------------------------------------------
// Drive Classifier report
// ---------------------------------------------------------------------------

/**
 * Saves (or updates) the latest Drive classification scan for a user.
 *
 * @param {string|ObjectId} userId
 * @param {{
 *   summary:         { totalFiles: number, totalSizeBytes: number, categories: Array },
 *   categoryCounts:  object,
 *   classifiedFiles: Array,
 * }} data  — the full object returned by driveClassifierService.classifyDriveFiles
 */
async function saveDriveReport(userId, data) {
  return safely('saveDriveReport', () =>
    DriveReport.findOneAndUpdate(
      { userId },
      {
        $set: {
          summary:         data.summary         ?? {},
          categoryCounts:  data.categoryCounts  ?? {},
          classifiedFiles: data.classifiedFiles ?? [],
          lastScanned:     new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
  );
}

/**
 * Reads the stored Drive report for a user.
 */
async function getDriveReport(userId) {
  return safely('getDriveReport', () =>
    DriveReport.findOne({ userId }).lean()
  );
}

// ---------------------------------------------------------------------------
// Website Tracker report
// ---------------------------------------------------------------------------

/**
 * Saves (or updates) the latest website tracker scan for a user.
 *
 * @param {string|ObjectId} userId
 * @param {{
 *   totalWebsites:  number,
 *   categoryCounts: object,
 *   activeCount:    number,
 *   inactiveCount:  number,
 *   websites:       Array,
 * }} data  — the full object returned by websiteTrackerService.scanWebsites
 */
async function saveWebsiteReport(userId, data) {
  return safely('saveWebsiteReport', () =>
    WebsiteReport.findOneAndUpdate(
      { userId },
      {
        $set: {
          totalWebsites:  data.totalWebsites  ?? 0,
          activeCount:    data.activeCount    ?? 0,
          inactiveCount:  data.inactiveCount  ?? 0,
          categoryCounts: data.categoryCounts ?? {},
          websites:       data.websites       ?? [],
          lastScanned:    new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
  );
}

/**
 * Reads the stored website report for a user.
 */
async function getWebsiteReport(userId) {
  return safely('getWebsiteReport', () =>
    WebsiteReport.findOne({ userId }).lean()
  );
}

// ---------------------------------------------------------------------------
// Breach Radar report
// ---------------------------------------------------------------------------

/**
 * Saves (or updates) the latest breach radar scan for a user.
 * Also triggers saveDigitalRiskScore with the same breach score data.
 *
 * @param {string|ObjectId} userId
 * @param {{
 *   score:           number,
 *   level:           string,
 *   summary:         string,
 *   alerts:          Array,
 *   recommendations: Array,
 *   statistics:      object,
 * }} data  — the full object returned by breachRadarService.runScan
 */
async function saveBreachReport(userId, data) {
  const saved = await safely('saveBreachReport', () =>
    BreachReport.findOneAndUpdate(
      { userId },
      {
        $set: {
          score:           data.score           ?? 0,
          level:           data.level           ?? 'Unknown',
          summary:         data.summary         ?? '',
          alerts:          data.alerts          ?? [],
          recommendations: data.recommendations ?? [],
          statistics:      data.statistics      ?? {},
          lastScanned:     new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
  );

  // Persist the derived digital risk score from the same scan data
  await saveDigitalRiskScore(userId, data);

  return saved;
}

/**
 * Reads the stored breach report for a user.
 */
async function getBreachReport(userId) {
  return safely('getBreachReport', () =>
    BreachReport.findOne({ userId }).lean()
  );
}

// ---------------------------------------------------------------------------
// Digital Risk Score
// ---------------------------------------------------------------------------

/**
 * Saves (or updates) the digital risk score derived from a breach radar scan.
 * Called internally by saveBreachReport — can also be called standalone.
 *
 * @param {string|ObjectId} userId
 * @param {{
 *   score:      number,
 *   level:      string,
 *   statistics: object,
 * }} data  — breach radar result (score, level, statistics reused as components)
 */
async function saveDigitalRiskScore(userId, data) {
  const stats = data.statistics ?? {};

  // Derive per-module risk signals from breach radar statistics
  const emailRisk   = Math.min(100, (stats.totalAlerts ?? 0) * 5);
  const driveRisk   = Math.min(
    100,
    ((stats.publicFiles ?? 0) * 20) +
    ((stats.sensitiveShared ?? 0) * 10) +
    ((stats.largeSharedFiles ?? 0) * 5)
  );
  const websiteRisk = Math.min(100, (stats.dormantAccounts ?? 0) * 4);

  return safely('saveDigitalRiskScore', () =>
    DigitalRiskScore.findOneAndUpdate(
      { userId },
      {
        $set: {
          score: data.score  ?? 0,
          level: data.level  ?? 'Unknown',
          breakdown: {
            emailRisk,
            driveRisk,
            websiteRisk,
            breachScore: data.score ?? 0,
          },
          components:  stats,
          lastScanned: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
  );
}

/**
 * Reads the stored digital risk score for a user.
 */
async function getDigitalRiskScore(userId) {
  return safely('getDigitalRiskScore', () =>
    DigitalRiskScore.findOne({ userId }).lean()
  );
}

// ---------------------------------------------------------------------------
// Auto Cleanup report
// ---------------------------------------------------------------------------

/**
 * Updates the auto cleanup report after a trash or delete action.
 * Increments running totals and records the last action.
 *
 * @param {string|ObjectId} userId
 * @param {{
 *   actionType: 'trash' | 'delete' | 'verify',
 *   dryRun:     boolean,
 *   trashed:    number,
 *   deleted:    number,
 *   failed:     number,
 *   emailIds:   string[],
 * }} data
 */
async function saveAutoCleanupReport(userId, data) {
  const trashed = data.trashed ?? 0;
  const deleted = data.deleted ?? 0;
  const failed  = data.failed  ?? 0;

  return safely('saveAutoCleanupReport', () =>
    AutoCleanupReport.findOneAndUpdate(
      { userId },
      {
        $inc: {
          totalTrashed: trashed,
          totalDeleted: deleted,
          totalFailed:  failed,
        },
        $set: {
          lastAction: {
            type:     data.actionType ?? 'trash',
            dryRun:   data.dryRun     ?? false,
            trashed,
            deleted,
            failed,
            emailIds: data.emailIds   ?? [],
            at:       new Date(),
          },
          lastScanned: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
  );
}

/**
 * Reads the stored auto cleanup report for a user.
 */
async function getAutoCleanupReport(userId) {
  return safely('getAutoCleanupReport', () =>
    AutoCleanupReport.findOne({ userId }).lean()
  );
}

// ---------------------------------------------------------------------------
// Scan History (append-only)
// ---------------------------------------------------------------------------

/**
 * Appends one scan history entry.
 * Called by every scan endpoint regardless of whether the scan succeeded.
 *
 * @param {string|ObjectId} userId
 * @param {{
 *   module:     'emailClassification' | 'driveClassifier' | 'websiteTracker' | 'breachRadar' | 'autoCleanup',
 *   durationMs: number,
 *   status:     'success' | 'error' | 'partial',
 *   summary:    string,
 * }} data
 */
async function appendScanHistory(userId, data) {
  return safely('appendScanHistory', () =>
    ScanHistory.create({
      userId,
      module:      data.module      ?? 'emailClassification',
      durationMs:  data.durationMs  ?? 0,
      status:      data.status      ?? 'success',
      summary:     data.summary     ?? '',
      timestamp:   new Date(),
      lastScanned: new Date(),
    })
  );
}

/**
 * Reads scan history for a user, newest first.
 * @param {string|ObjectId} userId
 * @param {number} [limit=50]
 */
async function getScanHistory(userId, limit = 50) {
  return safely('getScanHistory', () =>
    ScanHistory.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean()
  );
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  // Email
  saveEmailReport,
  getEmailReport,
  // Drive
  saveDriveReport,
  getDriveReport,
  // Website
  saveWebsiteReport,
  getWebsiteReport,
  // Breach
  saveBreachReport,
  getBreachReport,
  // Digital risk
  saveDigitalRiskScore,
  getDigitalRiskScore,
  // Auto cleanup
  saveAutoCleanupReport,
  getAutoCleanupReport,
  // History
  appendScanHistory,
  getScanHistory,
};
