/**
 * unsubscribeService.js
 * Executes the appropriate unsubscribe action for a given subscription record
 * and always creates a Gmail sender-filter as a safety net.
 *
 * Supported methods (in order of preference):
 *   one-click — RFC 8058 POST directly to the unsubscribe URL
 *   mailto    — Sends an email via the Gmail API to the mailto: address
 *   link      — Returns a manualUrl for the frontend to open in a new tab
 *   none      — Filter-only (no outbound action possible)
 *
 * Callers supply a tokenSet: { access_token, refresh_token? }
 * obtained by decrypting the user's stored tokens via tokenHelpers.
 *
 * This module contains only business logic — no routes, no controllers,
 * no Express request/response handling.
 */

'use strict';

const axios   = require('axios');
const { google } = require('googleapis');
const { createOAuthClient }  = require('../../config/googleClient');
const { buildGmailClient, parseMailtoUri } = require('./gmailService');

// ---------------------------------------------------------------------------
// One-click (RFC 8058)
// ---------------------------------------------------------------------------

/**
 * Performs an RFC 8058 one-click unsubscribe by POSTing to the URL.
 * Some senders return a redirect or HTML on success — we only care that
 * the POST did not produce a 5xx.
 *
 * @param {string} url
 */
async function executeOneClickUnsubscribe(url) {
  await axios.post(url, 'List-Unsubscribe=One-Click', {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 10000,
    validateStatus: (status) => status < 500,
  });
}

// ---------------------------------------------------------------------------
// Mailto
// ---------------------------------------------------------------------------

/** Encodes a UTF-8 string as base64url (required by Gmail messages.send). */
function base64UrlEncode(str) {
  return Buffer.from(str).toString('base64url');
}

/**
 * Sends a minimal RFC 822 unsubscribe email via the Gmail API.
 *
 * @param {object} gmail       Authenticated Gmail v1 client
 * @param {string} mailtoUri   e.g. "mailto:unsub@example.com?subject=Unsubscribe"
 * @param {string} fromDisplay Sender display string used in the From header
 */
async function sendMailtoUnsubscribe(gmail, mailtoUri, fromDisplay) {
  const { address, subject, body } = parseMailtoUri(mailtoUri);

  const raw = base64UrlEncode(
    [
      `To: ${address}`,
      `From: ${fromDisplay || 'me'}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=UTF-8',
      '',
      body || 'Please unsubscribe me from this mailing list.',
    ].join('\r\n')
  );

  await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
}

// ---------------------------------------------------------------------------
// Gmail sender filter (always-applied safety net)
// ---------------------------------------------------------------------------

const FOOTPRINTX_LABEL = 'FootprintX/Unsubscribed';

/**
 * Creates (or reuses) the FootprintX label and adds a filter that archives
 * future mail from `senderEmail` under that label.
 *
 * This runs regardless of whether the "real" unsubscribe succeeded so that
 * cleanup happens even when a sender ignores the unsubscribe request.
 *
 * @param {object} gmail
 * @param {string} senderEmail
 */
async function createSenderFilter(gmail, senderEmail) {
  // Resolve or create the label
  const { data: labelList } = await gmail.users.labels.list({ userId: 'me' });
  let label = labelList.labels.find((l) => l.name === FOOTPRINTX_LABEL);

  if (!label) {
    const { data: created } = await gmail.users.labels.create({
      userId: 'me',
      requestBody: {
        name:                  FOOTPRINTX_LABEL,
        labelListVisibility:   'labelShow',
        messageListVisibility: 'show',
      },
    });
    label = created;
  }

  await gmail.users.settings.filters.create({
    userId: 'me',
    requestBody: {
      criteria: { from: senderEmail },
      action:   { removeLabelIds: ['INBOX'], addLabelIds: [label.id] },
    },
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Runs the appropriate unsubscribe path for one subscription record and
 * layers a Gmail filter on top as a safety net.
 *
 * @param {{ access_token: string, refresh_token?: string }} tokenSet
 * @param {{
 *   senderEmail: string,
 *   unsubscribeMethod: 'one-click'|'mailto'|'link'|'none',
 *   unsubscribeUrl?: string,
 *   unsubscribeMailto?: string
 * }} subscription
 * @param {string} userEmail  Used as the From address for mailto sends
 *
 * @returns {Promise<{
 *   senderEmail: string,
 *   method: string,
 *   unsubscribeSucceeded: boolean,
 *   requiresManualAction: boolean,
 *   manualUrl: string|null,
 *   filterApplied: boolean,
 *   error: string|null
 * }>}
 */
async function unsubscribeSender(tokenSet, subscription, userEmail) {
  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials(tokenSet);
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const result = {
    senderEmail:          subscription.senderEmail,
    method:               subscription.unsubscribeMethod,
    unsubscribeSucceeded: false,
    requiresManualAction: false,
    manualUrl:            null,
    filterApplied:        false,
    error:                null,
  };

  try {
    switch (subscription.unsubscribeMethod) {
      case 'one-click':
        await executeOneClickUnsubscribe(subscription.unsubscribeUrl);
        result.unsubscribeSucceeded = true;
        break;

      case 'mailto':
        await sendMailtoUnsubscribe(gmail, subscription.unsubscribeMailto, userEmail);
        result.unsubscribeSucceeded = true;
        break;

      case 'link':
        // Body-only link: hand back to the frontend to open in a new tab.
        result.requiresManualAction = true;
        result.manualUrl            = subscription.unsubscribeUrl;
        break;

      case 'none':
      default:
        // No outbound action available — filter-only path below handles this.
        break;
    }
  } catch (err) {
    result.error = err.message;
  }

  // Always apply the Gmail sender filter as a backup, regardless of outcome.
  try {
    await createSenderFilter(gmail, subscription.senderEmail);
    result.filterApplied = true;
  } catch (err) {
    console.warn(
      `Filter creation failed for ${subscription.senderEmail}:`,
      err.message
    );
    result.filterError = err.message;
  }

  return result;
}

/**
 * Processes multiple subscriptions sequentially with a small inter-request
 * delay to stay well under Gmail's per-user write-rate limits.
 *
 * @param {{ access_token: string, refresh_token?: string }} tokenSet
 * @param {Array}  subscriptions
 * @param {string} userEmail
 * @returns {Promise<Array>}
 */
async function unsubscribeSenders(tokenSet, subscriptions, userEmail) {
  const results = [];
  for (const sub of subscriptions) {
    results.push(await unsubscribeSender(tokenSet, sub, userEmail));
    // 250 ms gap between writes — deliberate, not a bug.
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return results;
}

module.exports = { unsubscribeSender, unsubscribeSenders };
