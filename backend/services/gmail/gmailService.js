/**
 * gmailService.js
 * Scans a user's Gmail inbox for subscription-style senders and resolves
 * the unsubscribe mechanism available for each one.
 *
 * Callers supply a tokenSet: { access_token, refresh_token? }
 * obtained by decrypting the user's stored tokens via tokenHelpers.
 *
 * Pure-parsing helpers are exported separately so they remain unit-testable
 * without hitting the real Gmail API.
 *
 * This module contains only business logic — no routes, no controllers,
 * no Express request/response handling.
 */

'use strict';

const { google } = require('googleapis');
const { createOAuthClient } = require('../../config/googleClient');

// ---------------------------------------------------------------------------
// Helpers — pure functions, no I/O
// ---------------------------------------------------------------------------

/**
 * Parses a raw `List-Unsubscribe` header value, e.g.:
 *   "<https://example.com/unsub?id=1>, <mailto:unsub@example.com?subject=unsub>"
 * Returns { url, mailto } — either may be null when not present.
 *
 * @param {string|undefined} headerValue
 * @returns {{ url: string|null, mailto: string|null }}
 */
function parseListUnsubscribeHeader(headerValue) {
  if (!headerValue) return { url: null, mailto: null };

  const matches = [...headerValue.matchAll(/<([^>]+)>/g)].map((m) => m[1].trim());
  const url    = matches.find((m) => /^https?:\/\//i.test(m))  || null;
  const mailto = matches.find((m) => /^mailto:/i.test(m))       || null;

  return { url, mailto };
}

/**
 * Returns true when the sender supports RFC 8058 one-click unsubscribe
 * (i.e. no confirmation page required — a direct POST suffices).
 *
 * @param {string|undefined} listUnsubscribePostValue
 * @param {string|null} url
 * @returns {boolean}
 */
function supportsOneClick(listUnsubscribePostValue, url) {
  return (
    Boolean(url) &&
    /List-Unsubscribe=One-Click/i.test(listUnsubscribePostValue || '')
  );
}

/**
 * Parses a mailto: URI into its component parts.
 * e.g. "mailto:unsub@x.com?subject=Unsubscribe%20me&body=please"
 *
 * @param {string} mailtoUri
 * @returns {{ address: string, subject: string, body: string }}
 */
function parseMailtoUri(mailtoUri) {
  const withoutScheme = mailtoUri.replace(/^mailto:/i, '');
  const [address, queryString] = withoutScheme.split('?');
  const params = new URLSearchParams(queryString || '');
  return {
    address: decodeURIComponent(address),
    subject: params.get('subject') || 'Unsubscribe',
    body:    params.get('body')    || '',
  };
}

/**
 * Best-effort extraction of an unsubscribe link from an HTML email body
 * for senders that omit the List-Unsubscribe header entirely.
 *
 * @param {string|null} html
 * @returns {string|null}
 */
function extractUnsubscribeLinkFromHtml(html) {
  if (!html) return null;

  const anchorRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gis;
  let match;
  while ((match = anchorRegex.exec(html)) !== null) {
    const href = match[1];
    const text = match[2].replace(/<[^>]+>/g, '').trim();
    if (/unsubscribe|opt.?out|manage.*(preferences|subscription)/i.test(href + ' ' + text)) {
      return href;
    }
  }
  return null;
}

/** @param {string} data  Base64url-encoded string */
function decodeBase64Url(data) {
  if (!data) return '';
  return Buffer.from(data, 'base64url').toString('utf-8');
}

/**
 * Walks a Gmail message payload tree to find the first text/html part.
 * @param {object|null} payload
 * @returns {string|null}
 */
function findHtmlBody(payload) {
  if (!payload) return null;
  if (payload.mimeType === 'text/html' && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const found = findHtmlBody(part);
      if (found) return found;
    }
  }
  return null;
}

const GMAIL_CATEGORY_LABEL_MAP = {
  CATEGORY_PROMOTIONS: 'Promotions',
  CATEGORY_FORUMS:     'Forums',
  CATEGORY_SOCIAL:     'Social',
  CATEGORY_UPDATES:    'Updates',
};

/**
 * Heuristic category on top of Gmail's own category labels.
 *
 * @param {string[]} labelIds
 * @param {string}   senderEmail
 * @param {string}   subject
 * @returns {string}
 */
function categorise(labelIds = [], senderEmail = '', subject = '') {
  const domain = (senderEmail.split('@')[1] || '').toLowerCase();
  const text   = `${senderEmail} ${subject}`.toLowerCase();

  if (/\.edu(\.|$)/.test(domain) || /course|lecture|university|academy|bootcamp/.test(text)) {
    return 'Education';
  }
  if (/newsletter|digest|weekly|roundup/.test(text)) {
    return 'Newsletters';
  }
  for (const label of labelIds) {
    if (GMAIL_CATEGORY_LABEL_MAP[label]) return GMAIL_CATEGORY_LABEL_MAP[label];
  }
  return 'Other';
}

/**
 * Parses an RFC 5322 From header value into name + email.
 * e.g. `"Example Inc" <info@example.com>`
 *
 * @param {string} fromValue
 * @returns {{ name: string, email: string }}
 */
function parseFromHeader(fromValue = '') {
  const match = fromValue.match(/^(.*?)<(.+)>$/);
  if (match) {
    return {
      name:  match[1].trim().replace(/^"|"$/g, ''),
      email: match[2].trim().toLowerCase(),
    };
  }
  return { name: fromValue.trim(), email: fromValue.trim().toLowerCase() };
}

// ---------------------------------------------------------------------------
// Gmail API I/O helpers
// ---------------------------------------------------------------------------

/**
 * Simple concurrency limiter — prevents exceeding Gmail's per-user rate limit
 * when fetching many messages in parallel.
 *
 * @param {Array}    items
 * @param {number}   limit  Maximum concurrent promises
 * @param {Function} fn     Async function called with (item, index)
 * @returns {Promise<Array>}
 */
async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index++;
      results[current] = await fn(items[current], current);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker)
  );
  return results;
}

/** Header names we request in metadata-format fetches. */
const HEADER_NAMES = [
  'From',
  'Subject',
  'Date',
  'List-Unsubscribe',
  'List-Unsubscribe-Post',
];

/**
 * Returns up to `maxResults` message IDs from the Gmail promotion/update/forum
 * categories.
 *
 * @param {object} gmail      Authenticated Gmail API client
 * @param {number} maxResults
 * @returns {Promise<string[]>}
 */
async function fetchMessageIds(gmail, maxResults = 300) {
  let ids = [];
  let pageToken;

  do {
    const { data } = await gmail.users.messages.list({
      userId:     'me',
      q:          'category:promotions OR category:updates OR category:forums',
      maxResults: Math.min(100, maxResults - ids.length),
      pageToken,
    });
    ids = ids.concat((data.messages || []).map((m) => m.id));
    pageToken = data.nextPageToken;
  } while (pageToken && ids.length < maxResults);

  return ids;
}

/**
 * Fetches only the headers we need for a single message (metadata format).
 *
 * @param {object} gmail
 * @param {string} id
 * @returns {Promise<{ id, labelIds, headers, internalDate }>}
 */
async function fetchHeadersForMessage(gmail, id) {
  const { data } = await gmail.users.messages.get({
    userId:          'me',
    id,
    format:          'metadata',
    metadataHeaders: HEADER_NAMES,
  });

  const headers = {};
  for (const h of data.payload?.headers || []) {
    headers[h.name] = h.value;
  }

  return {
    id,
    labelIds:     data.labelIds || [],
    headers,
    internalDate: data.internalDate,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Builds an authenticated Gmail v1 client from a raw token set.
 * Exported so callers (unsubscribeService) can reuse the same factory.
 *
 * @param {{ access_token: string, refresh_token?: string }} tokenSet
 */
function buildGmailClient(tokenSet) {
  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials(tokenSet);
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

/**
 * Scans the user's inbox and returns one entry per subscription-style sender.
 * Each entry contains the best-available unsubscribe metadata.
 *
 * @param {{ access_token: string, refresh_token?: string }} tokenSet
 * @param {{ maxMessages?: number }} options
 * @returns {Promise<Array>}
 */
async function scanSubscriptions(tokenSet, { maxMessages = 300 } = {}) {
  const gmail = buildGmailClient(tokenSet);

  const ids      = await fetchMessageIds(gmail, maxMessages);
  const messages = await mapWithConcurrency(ids, 8, (id) =>
    fetchHeadersForMessage(gmail, id)
  );

  const bySender = new Map();

  for (const msg of messages) {
    const { name, email } = parseFromHeader(msg.headers.From);
    if (!email) continue;

    const { url, mailto } = parseListUnsubscribeHeader(msg.headers['List-Unsubscribe']);
    const oneClick        = supportsOneClick(msg.headers['List-Unsubscribe-Post'], url);

    if (!bySender.has(email)) {
      bySender.set(email, {
        senderEmail:      email,
        senderName:       name || email,
        category:         categorise(msg.labelIds, email, msg.headers.Subject),
        emailCount:       0,
        latestSubject:    msg.headers.Subject || '',
        latestDate:       msg.internalDate
          ? new Date(Number(msg.internalDate)).toISOString()
          : null,
        latestMessageId:  msg.id,
        unsubscribeUrl:   url,
        unsubscribeMailto: mailto,
        oneClickSupported: oneClick,
      });
    }

    const entry = bySender.get(email);
    entry.emailCount += 1;

    // Keep the most recent message as the representative one
    if (
      msg.internalDate &&
      (!entry.latestDate || Number(msg.internalDate) > Date.parse(entry.latestDate))
    ) {
      entry.latestDate      = new Date(Number(msg.internalDate)).toISOString();
      entry.latestSubject   = msg.headers.Subject || entry.latestSubject;
      entry.latestMessageId = msg.id;
      if (url || mailto) {
        entry.unsubscribeUrl    = url;
        entry.unsubscribeMailto = mailto;
        entry.oneClickSupported = oneClick;
      }
    }
  }

  const senders = Array.from(bySender.values());

  // For senders with no List-Unsubscribe header, dig into the HTML body of
  // their representative message to look for a footer unsubscribe link.
  const needsBodyLookup = senders.filter(
    (s) => !s.unsubscribeUrl && !s.unsubscribeMailto
  );

  await mapWithConcurrency(needsBodyLookup, 5, async (sender) => {
    try {
      const { data } = await gmail.users.messages.get({
        userId: 'me',
        id:     sender.latestMessageId,
        format: 'full',
      });
      const html = findHtmlBody(data.payload);
      const link = extractUnsubscribeLinkFromHtml(html);
      if (link) {
        sender.unsubscribeUrl  = link;
        sender.bodyLinkOnly    = true; // flags "needs manual confirmation"
      }
    } catch (err) {
      console.warn(`Body lookup failed for ${sender.senderEmail}:`, err.message);
    }
  });

  // Resolve the unsubscribe method label before returning
  return senders.map((s) => ({
    ...s,
    unsubscribeMethod: s.oneClickSupported
      ? 'one-click'
      : s.unsubscribeMailto
      ? 'mailto'
      : s.unsubscribeUrl
      ? 'link'
      : 'none',
  }));
}

module.exports = {
  scanSubscriptions,
  buildGmailClient,
  // Exported for unit testing / reuse in unsubscribeService
  parseListUnsubscribeHeader,
  supportsOneClick,
  parseMailtoUri,
  extractUnsubscribeLinkFromHtml,
  categorise,
  parseFromHeader,
};
