'use strict';

/**
 * breachRadarService.js
 *
 * Generates a Privacy & Security Radar report using only data produced
 * inside FootPrintX — no external breach databases, no paid APIs.
 *
 * Data sources:
 *   - Google Drive API  (via driveService.listAllFiles + Drive permissions)
 *   - Drive Classifier  (via driveClassifierService.classifyDriveFiles)
 *   - Website Tracker   (via websiteTrackerService.scanWebsites)
 *
 * All functions accept a tokenSet: { access_token, refresh_token? }
 * obtained via tokenHelpers — identical pattern to every other service.
 */

const { google }                 = require('googleapis');
const { createOAuthClient }      = require('../../config/googleClient');
const { listAllFiles }           = require('../drive/driveService');
const { classifyDriveFiles }     = require('../drive/driveClassifierService');
const { scanWebsites }           = require('../websiteTracker/websiteTrackerService');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** File categories from Drive Classifier that raise a security concern */
const SENSITIVE_CATEGORY_KEYWORDS = [
  'identity', 'financial', 'government', 'personal', 'medical', 'tax', 'resume',
];

/** 100 MB in bytes */
const LARGE_FILE_THRESHOLD = 100 * 1024 * 1024;

/** Files not modified for more than 365 days are considered "old" */
const OLD_FILE_DAYS = 365;

/** Accounts not seen in 180 days are considered "dormant" */
const DORMANT_ACCOUNT_DAYS = 180;

// ---------------------------------------------------------------------------
// Drive helpers
// ---------------------------------------------------------------------------

/**
 * Builds a Drive v3 client from a raw token set.
 * @param {{ access_token: string, refresh_token?: string }} tokenSet
 */
function buildDriveClient(tokenSet) {
  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials(tokenSet);
  return google.drive({ version: 'v3', auth: oauth2Client });
}

/**
 * Fetches the sharing permissions for a single Drive file.
 * Returns an array of permission objects (role, type, displayName, etc.).
 *
 * @param {object} drive   Authenticated Drive v3 client
 * @param {string} fileId
 * @returns {Promise<Array>}
 */
async function getFilePermissions(drive, fileId) {
  try {
    const { data } = await drive.permissions.list({
      fileId,
      fields: 'permissions(id,role,type,displayName,emailAddress)',
    });
    return data.permissions || [];
  } catch (err) {
    // Permissions endpoint may 403 for items the user cannot manage
    return [];
  }
}

/**
 * Simple concurrency limiter — prevents exceeding Drive's per-user rate limit.
 */
async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const cur = idx++;
      results[cur] = await fn(items[cur], cur);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

// ---------------------------------------------------------------------------
// Alert generators
// ---------------------------------------------------------------------------

/**
 * 1. Public Drive files — type === 'anyone', role === 'reader'|'writer'
 */
function alertPublicFiles(filesWithPerms) {
  const alerts = [];
  for (const { file, permissions } of filesWithPerms) {
    const pub = permissions.find(
      (p) => p.type === 'anyone' && p.role !== 'owner',
    );
    if (pub) {
      alerts.push({
        id:             `public_${file.id}`,
        type:           'public_file',
        severity:       'critical',
        title:          'Public Drive File',
        description:    `"${file.name}" is publicly accessible by anyone on the internet.`,
        fileId:         file.id,
        fileName:       file.name,
        recommendation: 'Remove the public permission from this file in Google Drive.',
        icon:           'globe',
      });
    }
  }
  return alerts;
}

/**
 * 2. "Anyone with the link" sharing
 */
function alertAnyoneWithLink(filesWithPerms) {
  const alerts = [];
  for (const { file, permissions } of filesWithPerms) {
    const link = permissions.find(
      (p) => p.type === 'anyone' && p.role === 'reader',
    );
    // Distinguish "public" (indexed) vs "anyone with link" by checking
    // whether it is already flagged as fully public.
    // Drive uses the same type='anyone' for both — differentiate via
    // allowFileDiscovery if available; otherwise skip duplicates.
    const alreadyPublic = permissions.some(
      (p) => p.type === 'anyone' && p.role === 'writer',
    );
    if (link && !alreadyPublic) {
      alerts.push({
        id:             `link_${file.id}`,
        type:           'link_sharing',
        severity:       'high',
        title:          'Shared via Link',
        description:    `"${file.name}" can be accessed by anyone who has the link.`,
        fileId:         file.id,
        fileName:       file.name,
        recommendation: 'Change sharing to specific people or disable link sharing.',
        icon:           'link',
      });
    }
  }
  return alerts;
}

/**
 * 3. Sensitive classified files that are shared
 */
function alertSensitiveFiles(classifiedFiles) {
  const alerts = [];
  for (const file of classifiedFiles) {
    if (!file.shared) continue;
    const cat = (file.classifiedCategory || '').toLowerCase();
    const isSensitive = SENSITIVE_CATEGORY_KEYWORDS.some((kw) => cat.includes(kw));
    // Also match by file name keywords
    const nameLower = (file.name || '').toLowerCase();
    const nameIsSensitive = SENSITIVE_CATEGORY_KEYWORDS.some((kw) => nameLower.includes(kw));
    if (isSensitive || nameIsSensitive) {
      alerts.push({
        id:             `sensitive_${file.id}`,
        type:           'sensitive_file',
        severity:       'high',
        title:          'Sensitive File Shared',
        description:    `"${file.name}" appears to contain sensitive information and is currently shared.`,
        fileId:         file.id,
        fileName:       file.name,
        category:       file.classifiedCategory || 'Unknown',
        recommendation: 'Review who has access to this file and remove unnecessary sharing.',
        icon:           'file-lock',
      });
    }
  }
  return alerts;
}

/**
 * 4. Old shared files — shared AND not modified for > 365 days
 */
function alertOldSharedFiles(files) {
  const alerts = [];
  const cutoff = Date.now() - OLD_FILE_DAYS * 24 * 60 * 60 * 1000;
  for (const file of files) {
    if (!file.shared) continue;
    if (!file.modifiedTime) continue;
    if (new Date(file.modifiedTime).getTime() < cutoff) {
      const daysOld = Math.floor(
        (Date.now() - new Date(file.modifiedTime).getTime()) / (24 * 60 * 60 * 1000),
      );
      alerts.push({
        id:             `old_${file.id}`,
        type:           'old_shared_file',
        severity:       'medium',
        title:          'Old Shared File',
        description:    `"${file.name}" has been shared but not modified for ${daysOld} days.`,
        fileId:         file.id,
        fileName:       file.name,
        daysOld,
        recommendation: 'Review this file and remove sharing if it is no longer needed.',
        icon:           'clock',
      });
    }
  }
  return alerts;
}

/**
 * 5. Dormant accounts — websites not seen for > 180 days
 */
function alertDormantAccounts(websites) {
  const alerts = [];
  const cutoff = Date.now() - DORMANT_ACCOUNT_DAYS * 24 * 60 * 60 * 1000;
  for (const site of websites) {
    if (!site.lastSeen) continue;
    if (new Date(site.lastSeen).getTime() < cutoff) {
      const daysSince = Math.floor(
        (Date.now() - new Date(site.lastSeen).getTime()) / (24 * 60 * 60 * 1000),
      );
      alerts.push({
        id:             `dormant_${site.id}`,
        type:           'dormant_account',
        severity:       'medium',
        title:          `Dormant ${site.websiteName} Account`,
        description:    `Your ${site.websiteName} account hasn't had activity in ${daysSince} days.`,
        domain:         site.domain,
        websiteName:    site.websiteName,
        category:       site.category,
        daysSince,
        recommendation: `Log in to ${site.websiteName} and consider deleting the account if unused.`,
        icon:           'user-x',
      });
    }
  }
  return alerts;
}

/**
 * 6. Large shared files — shared AND size > 100 MB
 */
function alertLargeSharedFiles(files) {
  const alerts = [];
  for (const file of files) {
    if (!file.shared) continue;
    if ((file.sizeBytes || 0) > LARGE_FILE_THRESHOLD) {
      const sizeMB = Math.round(file.sizeBytes / (1024 * 1024));
      alerts.push({
        id:             `large_${file.id}`,
        type:           'large_shared_file',
        severity:       'medium',
        title:          'Large Shared File',
        description:    `"${file.name}" is ${sizeMB} MB and is currently shared.`,
        fileId:         file.id,
        fileName:       file.name,
        sizeMB,
        recommendation: 'Verify this large file needs to be shared, or restrict access.',
        icon:           'hard-drive',
      });
    }
  }
  return alerts;
}

/**
 * 7. Password reuse risk — derived from number of online accounts
 *    We never look at passwords; we infer risk from account count.
 */
function computePasswordReuseRisk(websites) {
  const total = websites.length;
  let level;
  if (total >= 50) {
    level = 'High';
  } else if (total >= 20) {
    level = 'Medium';
  } else {
    level = 'Low';
  }
  const alert = {
    id:             'password_reuse',
    type:           'password_reuse_risk',
    severity:       level === 'High' ? 'high' : level === 'Medium' ? 'medium' : 'low',
    title:          `Password Reuse Risk: ${level}`,
    description:    `You have ${total} online accounts detected — the more accounts sharing an email address, the higher the risk of credential stuffing.`,
    accountCount:   total,
    riskLevel:      level,
    recommendation: 'Use a password manager and ensure each account has a unique password.',
    icon:           'key',
  };
  return { alert, level };
}

// ---------------------------------------------------------------------------
// Score computation
// ---------------------------------------------------------------------------

/**
 * Computes a 0–100 security score from the generated alerts.
 *
 * Deduction table:
 *   critical  → −15 each (cap 45)
 *   high      → −8 each  (cap 32)
 *   medium    → −3 each  (cap 15)
 *   low       → −1 each  (cap 5)
 */
function computeScore(alerts) {
  const deductions = {
    critical: Math.min(45, alerts.filter((a) => a.severity === 'critical').length * 15),
    high:     Math.min(32, alerts.filter((a) => a.severity === 'high').length    * 8),
    medium:   Math.min(15, alerts.filter((a) => a.severity === 'medium').length  * 3),
    low:      Math.min(5,  alerts.filter((a) => a.severity === 'low').length     * 1),
  };
  const total = Object.values(deductions).reduce((s, v) => s + v, 0);
  return Math.max(0, 100 - total);
}

function scoreLevel(score) {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Needs Attention';
  return 'At Risk';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Runs the full Privacy & Security Radar scan for the given user token set.
 *
 * @param {{ access_token: string, refresh_token?: string }} tokenSet
 * @returns {Promise<{
 *   score: number,
 *   level: string,
 *   summary: string,
 *   alerts: Array,
 *   recommendations: Array,
 *   statistics: object
 * }>}
 */
async function runScan(tokenSet) {
  // ── 1. Fetch Drive files ────────────────────────────────────────────────
  const [allFiles, classifierResult, websiteResult] = await Promise.all([
    listAllFiles(tokenSet),
    classifyDriveFiles(tokenSet).catch((err) => {
      console.warn('breachRadarService: classifier failed, continuing:', err.message);
      return { classifiedFiles: [] };
    }),
    scanWebsites(tokenSet, { maxMessages: 200 }).catch((err) => {
      console.warn('breachRadarService: website tracker failed, continuing:', err.message);
      return { websites: [] };
    }),
  ]);

  const classifiedFiles = classifierResult.classifiedFiles || [];
  const websites        = websiteResult.websites || [];

  // ── 2. Fetch permissions for shared files only ──────────────────────────
  const sharedFiles = allFiles.filter((f) => f.shared);
  const drive       = buildDriveClient(tokenSet);

  // Limit permission fetches to first 50 shared files to stay within rate limits
  const sharedSample = sharedFiles.slice(0, 50);
  const filesWithPerms = await mapWithConcurrency(sharedSample, 5, async (file) => {
    const permissions = await getFilePermissions(drive, file.id);
    return { file, permissions };
  });

  // ── 3. Generate alerts ──────────────────────────────────────────────────
  const publicAlerts       = alertPublicFiles(filesWithPerms);
  const linkAlerts         = alertAnyoneWithLink(filesWithPerms);
  const sensitiveAlerts    = alertSensitiveFiles(classifiedFiles);
  const oldSharedAlerts    = alertOldSharedFiles(allFiles);
  const dormantAlerts      = alertDormantAccounts(websites);
  const largeSharedAlerts  = alertLargeSharedFiles(allFiles);
  const { alert: pwAlert, level: pwLevel } = computePasswordReuseRisk(websites);

  // De-duplicate: if a file is already flagged as public, skip link alert for it
  const publicFileIds = new Set(publicAlerts.map((a) => a.fileId));
  const filteredLinkAlerts = linkAlerts.filter((a) => !publicFileIds.has(a.fileId));

  const allAlerts = [
    ...publicAlerts,
    ...filteredLinkAlerts,
    ...sensitiveAlerts,
    ...oldSharedAlerts.slice(0, 10), // cap to avoid overwhelming UI
    ...dormantAlerts.slice(0, 10),
    ...largeSharedAlerts,
    pwAlert,
  ];

  // ── 4. Score ────────────────────────────────────────────────────────────
  const score = computeScore(allAlerts);
  const level = scoreLevel(score);

  // ── 5. Summary ──────────────────────────────────────────────────────────
  const critCount = allAlerts.filter((a) => a.severity === 'critical').length;
  const highCount = allAlerts.filter((a) => a.severity === 'high').length;
  const summary = critCount > 0
    ? `${critCount} critical issue${critCount > 1 ? 's' : ''} detected. Immediate action recommended.`
    : highCount > 0
    ? `${highCount} high-priority issue${highCount > 1 ? 's' : ''} require your attention.`
    : allAlerts.length > 1
    ? `${allAlerts.length} minor issues found. Your privacy is mostly healthy.`
    : 'No significant privacy risks detected. Your digital footprint looks healthy.';

  // ── 6. Recommendations ──────────────────────────────────────────────────
  const recommendations = buildRecommendations(allAlerts, allFiles, websites);

  // ── 7. Statistics ───────────────────────────────────────────────────────
  const statistics = {
    totalFiles:         allFiles.length,
    sharedFiles:        sharedFiles.length,
    publicFiles:        publicAlerts.length,
    sensitiveShared:    sensitiveAlerts.length,
    dormantAccounts:    dormantAlerts.length,
    largeSharedFiles:   largeSharedAlerts.length,
    trackedWebsites:    websites.length,
    oldSharedFiles:     oldSharedAlerts.length,
    passwordReuseRisk:  pwLevel,
    criticalAlerts:     critCount,
    highAlerts:         highCount,
    mediumAlerts:       allAlerts.filter((a) => a.severity === 'medium').length,
    lowAlerts:          allAlerts.filter((a) => a.severity === 'low').length,
    totalAlerts:        allAlerts.length,
  };

  return { score, level, summary, alerts: allAlerts, recommendations, statistics };
}

/**
 * Builds a deduplicated, prioritised recommendations list.
 */
function buildRecommendations(alerts, allFiles, websites) {
  const recs = [];

  const publicCount = alerts.filter((a) => a.type === 'public_file').length;
  if (publicCount > 0) {
    recs.push({
      id:       'rec_public',
      title:    'Remove Public Links',
      body:     `${publicCount} file${publicCount > 1 ? 's are' : ' is'} publicly accessible. Remove public sharing from Google Drive.`,
      action:   'Review Drive Files',
      route:    '/drive-classifier',
      priority: 'critical',
    });
  }

  const sensitiveCount = alerts.filter((a) => a.type === 'sensitive_file').length;
  if (sensitiveCount > 0) {
    recs.push({
      id:       'rec_sensitive',
      title:    'Review Sensitive Shared Files',
      body:     `${sensitiveCount} sensitive file${sensitiveCount > 1 ? 's' : ''} detected as shared. Restrict access.`,
      action:   'Classify Files',
      route:    '/drive-classifier',
      priority: 'high',
    });
  }

  const linkCount = alerts.filter((a) => a.type === 'link_sharing').length;
  if (linkCount > 0) {
    recs.push({
      id:       'rec_links',
      title:    'Audit Shared Links',
      body:     `${linkCount} file${linkCount > 1 ? 's' : ''} shared via link. Change to specific-person sharing where possible.`,
      action:   'Manage Drive',
      route:    '/drive-cleanup',
      priority: 'high',
    });
  }

  const dormantCount = alerts.filter((a) => a.type === 'dormant_account').length;
  if (dormantCount > 0) {
    recs.push({
      id:       'rec_dormant',
      title:    'Archive Dormant Accounts',
      body:     `${dormantCount} dormant online account${dormantCount > 1 ? 's' : ''} detected. Delete unused accounts to reduce your attack surface.`,
      action:   'View Accounts',
      route:    '/website-tracker',
      priority: 'medium',
    });
  }

  const oldCount = alerts.filter((a) => a.type === 'old_shared_file').length;
  if (oldCount > 0) {
    recs.push({
      id:       'rec_old',
      title:    'Delete Old Shared Files',
      body:     `${oldCount} file${oldCount > 1 ? 's' : ''} shared but not modified in over a year. Remove stale shares.`,
      action:   'Clean Drive',
      route:    '/drive-cleanup',
      priority: 'medium',
    });
  }

  const largeCount = alerts.filter((a) => a.type === 'large_shared_file').length;
  if (largeCount > 0) {
    recs.push({
      id:       'rec_large',
      title:    'Review Large Shared Files',
      body:     `${largeCount} large file${largeCount > 1 ? 's' : ''} (over 100 MB) are being shared. Confirm sharing is intentional.`,
      action:   'Review Files',
      route:    '/drive-classifier',
      priority: 'medium',
    });
  }

  const pwAlert = alerts.find((a) => a.type === 'password_reuse_risk');
  if (pwAlert && (pwAlert.riskLevel === 'High' || pwAlert.riskLevel === 'Medium')) {
    recs.push({
      id:       'rec_password',
      title:    'Reduce Password Reuse Risk',
      body:     `You have ${pwAlert.accountCount} online accounts. Use a password manager to ensure unique credentials on every site.`,
      action:   'View Accounts',
      route:    '/website-tracker',
      priority: pwAlert.riskLevel === 'High' ? 'high' : 'medium',
    });
  }

  if (recs.length === 0) {
    recs.push({
      id:       'rec_healthy',
      title:    'Review File Permissions',
      body:     'Periodically audit your Drive sharing settings to stay proactive about privacy.',
      action:   'Open Drive Classifier',
      route:    '/drive-classifier',
      priority: 'low',
    });
  }

  return recs;
}

module.exports = { runScan };
