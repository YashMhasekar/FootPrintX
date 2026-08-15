'use strict';

/**
 * emailDeleterService.js
 * Trashes or permanently deletes Gmail messages in bulk.
 *
 * Requires the gmail.modify scope (added to GOOGLE_OAUTH_SCOPES in
 * tokenHelpers.js as part of Feature2 integration).
 *
 * Callers supply a tokenSet: { access_token, refresh_token? }
 * obtained via User.findById + getDecryptedAccessToken (tokenHelpers).
 *
 * Reuses buildGmailClient from the existing gmailService — no duplicate
 * OAuth setup.
 *
 * Source reference: Feature2 gmail/email_deleter.py
 */

const { buildGmailClient } = require('../gmail/gmailService');

// ---------------------------------------------------------------------------
// Constants — match Feature2 config/settings.py BATCH_SIZE
// ---------------------------------------------------------------------------

/** Gmail batchDelete API hard limit: 1000 IDs per request. */
const BATCH_SIZE = 1000;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Permanently deletes emails using Gmail's batchDelete endpoint.
 * This action CANNOT be undone.
 *
 * Requires: gmail.modify scope on the user's token.
 *
 * @param {{ access_token: string, refresh_token?: string }} tokenSet
 * @param {string[]} messageIds  Gmail message IDs to delete
 * @param {{ dryRun?: boolean }} options
 * @returns {Promise<{ deleted: number, failed: number }>}
 */
async function deleteEmails(tokenSet, messageIds, { dryRun = false } = {}) {
  if (!messageIds || messageIds.length === 0) return { deleted: 0, failed: 0 };

  if (dryRun) {
    console.log(`[emailDeleterService] DRY RUN: would permanently delete ${messageIds.length} emails`);
    return { deleted: messageIds.length, failed: 0 };
  }

  const gmail = buildGmailClient(tokenSet);
  let deleted = 0;
  let failed  = 0;

  // Process in chunks of BATCH_SIZE (Gmail API limit)
  for (let i = 0; i < messageIds.length; i += BATCH_SIZE) {
    const batch = messageIds.slice(i, i + BATCH_SIZE);
    try {
      await gmail.users.messages.batchDelete({
        userId: 'me',
        requestBody: { ids: batch },
      });
      deleted += batch.length;
    } catch (err) {
      console.error(`emailDeleterService: batchDelete failed for batch starting at ${i}:`, err.message);
      failed += batch.length;
    }
  }

  return { deleted, failed };
}

/**
 * Moves emails to the Gmail Trash (recoverable for 30 days).
 * Operates per-message (no batch API for trash).
 *
 * Requires: gmail.modify scope on the user's token.
 *
 * @param {{ access_token: string, refresh_token?: string }} tokenSet
 * @param {string[]} messageIds  Gmail message IDs to trash
 * @param {{ dryRun?: boolean }} options
 * @returns {Promise<{ trashed: number, failed: number }>}
 */
async function trashEmails(tokenSet, messageIds, { dryRun = false } = {}) {
  if (!messageIds || messageIds.length === 0) return { trashed: 0, failed: 0 };

  if (dryRun) {
    console.log(`[emailDeleterService] DRY RUN: would move ${messageIds.length} emails to trash`);
    return { trashed: messageIds.length, failed: 0 };
  }

  const gmail = buildGmailClient(tokenSet);
  let trashed = 0;
  let failed  = 0;

  for (const id of messageIds) {
    try {
      await gmail.users.messages.trash({ userId: 'me', id });
      trashed += 1;
    } catch (err) {
      console.error(`emailDeleterService: trash failed for message ${id}:`, err.message);
      failed += 1;
    }
  }

  return { trashed, failed };
}

/**
 * Verifies whether a set of message IDs are no longer accessible
 * (i.e. have been deleted or trashed out of the inbox).
 *
 * A message that is in Trash will still be GET-able but will have the
 * TRASH label. A permanently deleted message will throw a 404.
 *
 * @param {{ access_token: string, refresh_token?: string }} tokenSet
 * @param {string[]} messageIds  IDs to check (keep small — one API call each)
 * @returns {Promise<{ deleted: string[], stillExist: string[] }>}
 */
async function verifyDeletion(tokenSet, messageIds) {
  if (!messageIds || messageIds.length === 0) return { deleted: [], stillExist: [] };

  const gmail      = buildGmailClient(tokenSet);
  const deleted    = [];
  const stillExist = [];

  for (const id of messageIds) {
    try {
      const { data } = await gmail.users.messages.get({
        userId: 'me',
        id,
        format: 'minimal',
      });
      // Message still accessible — check if it's in Trash
      const labels = data.labelIds || [];
      if (labels.includes('TRASH')) {
        deleted.push(id); // consider trashed as "deleted from inbox"
      } else {
        stillExist.push(id);
      }
    } catch (err) {
      // 404 / any error → message is gone
      deleted.push(id);
    }
  }

  return { deleted, stillExist };
}

module.exports = {
  deleteEmails,
  trashEmails,
  verifyDeletion,
  BATCH_SIZE,
};
