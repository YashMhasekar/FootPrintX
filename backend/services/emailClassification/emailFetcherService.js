'use strict';

/**
 * emailFetcherService.js
 * Fetches full email messages from a user's Gmail inbox for classification.
 *
 * Complements the existing gmailService.js (which handles metadata-only
 * subscription scanning). This service fetches full message bodies needed
 * by the AI classifier.
 *
 * Callers supply a tokenSet: { access_token, refresh_token? }
 * obtained via User.findById + getDecryptedAccessToken (tokenHelpers).
 *
 * Reuses buildGmailClient from the existing gmailService — no duplicate
 * OAuth setup.
 *
 * Source reference: Feature2 gmail/email_fetcher.py
 */

const cheerio = require('cheerio');
const { buildGmailClient } = require('../gmail/gmailService');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default maximum emails to fetch per request. Matches Feature2 default. */
const DEFAULT_MAX_RESULTS = 100;

/** Default Gmail query — full inbox. */
const DEFAULT_QUERY = 'in:inbox';

// ---------------------------------------------------------------------------
// Helpers — pure functions, no I/O
// ---------------------------------------------------------------------------

/**
 * Extracts a named header value from a Gmail message header array.
 * @param {Array<{name:string,value:string}>} headers
 * @param {string} name
 * @returns {string}
 */
function getHeader(headers, name) {
  const header = (headers || []).find(
    (h) => h.name.toLowerCase() === name.toLowerCase()
  );
  return header ? header.value : '';
}

/**
 * Decodes a base64url-encoded Gmail body part.
 * @param {string} data
 * @returns {string}
 */
function decodeBase64Url(data) {
  if (!data) return '';
  return Buffer.from(data, 'base64url').toString('utf-8');
}

/**
 * Converts an HTML string to plain text using cheerio.
 * Strips scripts, styles, and collapses whitespace.
 * @param {string} html
 * @returns {string}
 */
function htmlToText(html) {
  if (!html) return '';
  const $ = cheerio.load(html);
  $('script, style').remove();
  return $('body').text().replace(/\s+/g, ' ').trim();
}

/**
 * Walks a Gmail message payload tree and returns the plain-text body.
 * Prefers text/plain; falls back to stripping text/html.
 * @param {object} payload
 * @returns {string}
 */
function extractBody(payload) {
  if (!payload) return '';

  if (payload.parts && payload.parts.length) {
    // Prefer text/plain first
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
    }
    // Fall back to text/html
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        return htmlToText(decodeBase64Url(part.body.data));
      }
    }
    // Recurse into nested parts (multipart/alternative, etc.)
    for (const part of payload.parts) {
      const nested = extractBody(part);
      if (nested) return nested;
    }
  }

  if (payload.body?.data) {
    const decoded = decodeBase64Url(payload.body.data);
    return payload.mimeType === 'text/html' ? htmlToText(decoded) : decoded;
  }

  return '';
}

/**
 * Parses a raw Gmail message object into the flat shape used by the classifier.
 *
 * @param {object} message  Full Gmail API message object
 * @returns {{
 *   id: string,
 *   from: string,
 *   subject: string,
 *   date: string,
 *   body: string,
 *   snippet: string
 * }}
 */
function parseMessage(message) {
  const headers = message.payload?.headers || [];
  const rawBody = extractBody(message.payload);

  // Limit body to 2000 chars — same cap as Feature2 email_fetcher.py
  const body = rawBody.replace(/[^\x00-\x7F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000);

  return {
    id:      message.id,
    from:    getHeader(headers, 'From'),
    subject: getHeader(headers, 'Subject'),
    date:    getHeader(headers, 'Date'),
    body,
    snippet: message.snippet || '',
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetches emails from a user's Gmail inbox.
 *
 * @param {{ access_token: string, refresh_token?: string }} tokenSet
 * @param {{ maxResults?: number, query?: string }} options
 * @returns {Promise<Array<{id,from,subject,date,body,snippet}>>}
 */
async function fetchEmails(tokenSet, { maxResults = DEFAULT_MAX_RESULTS, query = DEFAULT_QUERY } = {}) {
  const gmail = buildGmailClient(tokenSet);
  const emails = [];

  try {
    const listRes = await gmail.users.messages.list({
      userId:     'me',
      q:          query,
      maxResults: Math.min(maxResults, 1500), // hard cap — same as Feature2
    });

    const messages = listRes.data.messages || [];
    if (!messages.length) return emails;

    // Fetch full message details for each ID
    // Sequential to stay within Gmail quota; can be made concurrent later
    for (const msg of messages) {
      try {
        const full = await gmail.users.messages.get({
          userId: 'me',
          id:     msg.id,
          format: 'full',
        });
        emails.push(parseMessage(full.data));
      } catch (err) {
        console.warn(`emailFetcherService: skipping message ${msg.id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('emailFetcherService: fetchEmails error:', err.message);
    throw err;
  }

  return emails;
}

module.exports = {
  fetchEmails,
  // Exported for unit testing
  parseMessage,
  extractBody,
  htmlToText,
  getHeader,
};
