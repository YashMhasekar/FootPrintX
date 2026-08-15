/**
 * driveService.js
 * Fetches and normalises Google Drive file metadata for a user.
 *
 * Callers must supply a tokenSet object:
 *   { access_token, refresh_token }
 * obtained by decrypting the user's stored tokens via tokenHelpers.
 *
 * This module contains only business logic — no routes, no controllers,
 * no direct Express request/response handling.
 */

'use strict';

const { google } = require('googleapis');
const { createOAuthClient } = require('../../config/googleClient');

// ---------------------------------------------------------------------------
// MIME-type → category mapping
// Deterministic bucketing; the ML service handles the fuzzier junk call.
// ---------------------------------------------------------------------------
const MIME_CATEGORY_MAP = [
  { match: /^application\/vnd\.google-apps\.document/,     category: 'Documents' },
  { match: /^application\/vnd\.google-apps\.spreadsheet/,  category: 'Documents' },
  { match: /^application\/vnd\.google-apps\.presentation/, category: 'Documents' },
  { match: /^application\/pdf/,                            category: 'Documents' },
  { match: /wordprocessingml|msword/,                      category: 'Documents' },
  { match: /^image\//,                                     category: 'Media'     },
  { match: /^video\//,                                     category: 'Media'     },
  { match: /^audio\//,                                     category: 'Media'     },
  { match: /zip|x-tar|x-7z|x-rar/,                        category: 'Archives'  },
  { match: /^application\/vnd\.google-apps\.folder/,       category: 'Folders'   },
];

/**
 * Maps a MIME type string to one of the five category buckets.
 * @param {string} mimeType
 * @returns {string}
 */
function classifyMimeType(mimeType = '') {
  const hit = MIME_CATEGORY_MAP.find((entry) => entry.match.test(mimeType));
  return hit ? hit.category : 'Other';
}

/**
 * Builds an authenticated Drive v3 client from a raw token set.
 * @param {{ access_token: string, refresh_token?: string }} tokenSet
 */
function buildDriveClient(tokenSet) {
  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials(tokenSet);
  return google.drive({ version: 'v3', auth: oauth2Client });
}

/**
 * Lists all non-trashed files in the user's Drive (paginated, metadata only).
 * Never requests file content.
 *
 * @param {{ access_token: string, refresh_token?: string }} tokenSet
 * @returns {Promise<Array>} Normalised file objects
 */
async function listAllFiles(tokenSet) {
  const drive = buildDriveClient(tokenSet);
  const fields =
    'nextPageToken, files(id, name, mimeType, size, modifiedTime, viewedByMeTime, createdTime, trashed, parents, shared, md5Checksum)';

  let files = [];
  let pageToken;

  do {
    const response = await drive.files.list({
      pageSize: 1000,
      fields,
      pageToken,
      q: 'trashed = false',
    });
    files = files.concat(response.data.files || []);
    pageToken = response.data.nextPageToken;
  } while (pageToken);

  return files.map(normaliseFile);
}

/**
 * Converts a raw Drive API file object into the shape expected by the ML
 * service and the frontend.
 * @param {object} file
 */
function normaliseFile(file) {
  const sizeBytes = file.size ? parseInt(file.size, 10) : 0;
  return {
    id:            file.id,
    name:          file.name,
    mimeType:      file.mimeType,
    category:      classifyMimeType(file.mimeType),
    sizeBytes,
    createdTime:   file.createdTime   || null,
    modifiedTime:  file.modifiedTime  || null,
    lastViewedTime: file.viewedByMeTime || null,
    shared:        Boolean(file.shared),
    md5Checksum:   file.md5Checksum   || null,
  };
}

/**
 * Aggregates storage usage per category for the chart view.
 * @param {Array} files  Result of listAllFiles()
 * @returns {object}  { [category]: { count, sizeBytes } }
 */
function summariseByCategory(files) {
  const summary = {};
  for (const f of files) {
    if (!summary[f.category]) {
      summary[f.category] = { count: 0, sizeBytes: 0 };
    }
    summary[f.category].count    += 1;
    summary[f.category].sizeBytes += f.sizeBytes;
  }
  return summary;
}

/**
 * Groups files that share the same MD5 checksum (exact-content duplicates).
 * Files without a checksum (Google Docs, Folders) are ignored.
 *
 * @param {Array} files  Result of listAllFiles()
 * @returns {Array<Array>}  Groups of two or more duplicate files
 */
function findDuplicates(files) {
  const byChecksum = {};
  for (const f of files) {
    if (!f.md5Checksum) continue;
    byChecksum[f.md5Checksum] = byChecksum[f.md5Checksum] || [];
    byChecksum[f.md5Checksum].push(f);
  }
  return Object.values(byChecksum).filter((group) => group.length > 1);
}

module.exports = {
  listAllFiles,
  summariseByCategory,
  findDuplicates,
  classifyMimeType,
};
