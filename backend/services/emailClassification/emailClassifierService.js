'use strict';

/**
 * emailClassifierService.js
 * Classifies emails into named categories using a two-stage pipeline:
 *   1. Fast rule-based classification (keyword + domain matching)
 *   2. OpenAI API fallback for ambiguous emails
 *
 * OpenAI credentials are read exclusively from environment variables
 * (OPENAI_API_KEY, OPENAI_MODEL) — never from request bodies.
 *
 * Source reference: Feature2 classifier/email_classifier.py
 */

const OpenAI = require('openai');

// ---------------------------------------------------------------------------
// Configuration — all sourced from backend/.env, never from requests
// ---------------------------------------------------------------------------

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

/** Lazily instantiated OpenAI client — only created when AI classification
 *  is actually needed. This avoids a startup error when OPENAI_API_KEY is
 *  not yet set. */
let _openaiClient = null;

function getOpenAIClient() {
  if (!_openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      throw new Error(
        'OPENAI_API_KEY is not configured in backend/.env. ' +
        'AI classification is unavailable. Rule-based classification will be used.'
      );
    }
    _openaiClient = new OpenAI({ apiKey });
  }
  return _openaiClient;
}

// ---------------------------------------------------------------------------
// Categories — matches Feature2 config/settings.py CATEGORIES list exactly
// ---------------------------------------------------------------------------

const CATEGORIES = [
  'Personal',
  'Work',
  'Financial',
  'Social Media',
  'Newsletters',
  'Marketing',
  'Automated',
  'Spam',
  'Low Priority',
];

// ---------------------------------------------------------------------------
// Rule-based classification
// Ported directly from Feature2 email_classifier.py _rule_based_classify()
// ---------------------------------------------------------------------------

const SPAM_KEYWORDS = [
  'viagra', 'casino', 'lottery', 'nigerian prince',
  'inheritance million', 'claim prize', 'congratulations you won',
  'click here now urgent', 'verify account immediately', 'won $', 'won 1,',
];

const SOCIAL_DOMAINS = [
  'facebook.com', 'facebookmail.com', 'twitter.com', 'linkedin.com',
  'instagram.com', 'tiktok.com', 'snapchat.com', 'reddit.com',
  'pinterest.com', 'x.com',
];

const SOCIAL_KEYWORDS = [
  'liked your', 'commented on', 'tagged you', 'friend request',
  'new follower', 'mentioned you', 'shared your post', 'connection request',
];

const FINANCIAL_KEYWORDS = [
  'invoice', 'payment received', 'payment due', 'bank statement',
  'credit card', 'transaction', 'account balance', 'bill due',
  'receipt', 'refund', 'wire transfer', 'deposit',
];

const FINANCIAL_DOMAINS = [
  'paypal.com', 'stripe.com', 'square.com', 'venmo.com',
  'chase.com', 'wellsfargo.com', 'bankofamerica.com', 'citi.com',
];

const AUTOMATED_FROM_KEYWORDS = ['noreply', 'no-reply', 'donotreply', 'do-not-reply', 'automated'];

const AUTOMATED_BODY_KEYWORDS = [
  'confirmation', 'verify your', 'reset password', 'account created',
  'order shipped', 'delivery update', 'tracking number', 'verification code',
  'security alert', 'login attempt',
];

const NEWSLETTER_KEYWORDS = [
  'newsletter', 'weekly digest', 'daily brief', 'roundup',
  'this week in', 'latest news', 'blog update', 'new article',
  'monthly update', 'news digest',
];

const MARKETING_KEYWORDS = [
  'unsubscribe', 'sale', 'discount', 'offer', 'deal', 'promo',
  'shop now', 'buy now', 'free shipping', 'save up to', '% off',
  'clearance', 'exclusive offer', 'limited time', 'special offer',
];

const MARKETING_DOMAINS = ['amazon.com', 'ebay.com', 'walmart.com', 'target.com', 'bestbuy.com'];

const WORK_KEYWORDS = [
  'meeting', 'deadline', 'project update', 'task assigned', 'report due',
  'presentation', 'conference call', 'team meeting', 'client meeting',
  'proposal', 'quarterly review',
];

const WORK_DOMAIN_SUFFIXES = ['.edu', '.gov', '.org'];

/**
 * Fast rule-based classification.
 * Returns a category string or null if the email is ambiguous (AI needed).
 *
 * @param {{ from: string, subject: string, body: string }} email
 * @returns {string|null}
 */
function ruleBasedClassify(email) {
  const fromAddr = (email.from || '').toLowerCase();
  const subject  = (email.subject || '').toLowerCase();
  const body     = (email.body || '').toLowerCase();
  const combined = `${fromAddr} ${subject} ${body}`;

  if (SPAM_KEYWORDS.some((kw) => combined.includes(kw)))            return 'Spam';
  if (SOCIAL_DOMAINS.some((d) => fromAddr.includes(d)))             return 'Social Media';
  if (SOCIAL_KEYWORDS.some((kw) => combined.includes(kw)))          return 'Social Media';
  if (FINANCIAL_DOMAINS.some((d) => fromAddr.includes(d)))          return 'Financial';
  if (FINANCIAL_KEYWORDS.some((kw) => combined.includes(kw)))       return 'Financial';
  if (AUTOMATED_FROM_KEYWORDS.some((kw) => fromAddr.includes(kw)))  return 'Automated';
  if (AUTOMATED_BODY_KEYWORDS.some((kw) => combined.includes(kw)))  return 'Automated';
  if (NEWSLETTER_KEYWORDS.some((kw) => combined.includes(kw)))      return 'Newsletters';
  if (MARKETING_KEYWORDS.some((kw) => combined.includes(kw)))       return 'Marketing';
  if (MARKETING_DOMAINS.some((d) => fromAddr.includes(d)))          return 'Marketing';
  if (WORK_KEYWORDS.some((kw) => combined.includes(kw)))            return 'Work';
  if (WORK_DOMAIN_SUFFIXES.some((s) => fromAddr.includes(s)))       return 'Work';

  return null; // ambiguous — let AI decide
}

// ---------------------------------------------------------------------------
// AI classification fallback
// ---------------------------------------------------------------------------

/** Maps normalised OpenAI response tokens back to CATEGORIES entries. */
const CATEGORY_MAP = {
  marketing:   'Marketing',
  newsletters: 'Newsletters',
  socialmedia: 'Social Media',
  automated:   'Automated',
  spam:        'Spam',
  financial:   'Financial',
  work:        'Work',
  personal:    'Personal',
  lowpriority: 'Low Priority',
};

/**
 * Classifies a single email via the OpenAI API.
 * Falls back to 'Low Priority' on any error.
 *
 * @param {{ from: string, subject: string, body: string }} email
 * @returns {Promise<string>}
 */
async function aiClassify(email) {
  const client = getOpenAIClient();

  const prompt = [
    'Classify this email:',
    '',
    `From: ${email.from || ''}`,
    `Subject: ${email.subject || ''}`,
    `Body: ${(email.body || '').slice(0, 400)}`,
    '',
    'Choose ONE category:',
    '- Marketing: Sales, promotions, shopping, deals, advertisements',
    '- Newsletters: Subscribed content, blog updates, news digests',
    '- SocialMedia: Facebook, Twitter, LinkedIn, Instagram notifications',
    '- Automated: System notifications, confirmations, alerts, no-reply',
    '- Spam: Unwanted, suspicious, phishing',
    '- Financial: Bills, payments, banking, invoices, receipts',
    '- Work: Professional emails, meetings, projects, business',
    '- Personal: Direct messages from real people, conversations',
    '- LowPriority: Old notifications, unimportant updates',
    '',
    'Category:',
  ].join('\n');

  try {
    const res = await client.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role:    'system',
          content: 'You are an email classifier. Respond with ONLY ONE word from this list: Marketing, Newsletters, SocialMedia, Automated, Spam, Financial, Work, Personal, LowPriority',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      max_tokens:  15,
    });

    const raw = res.choices[0].message.content.trim().toLowerCase().replace(/[\s_]/g, '');
    for (const [key, value] of Object.entries(CATEGORY_MAP)) {
      if (raw.includes(key)) return value;
    }
    return 'Low Priority';
  } catch (err) {
    console.error('emailClassifierService: AI classification error:', err.message);
    return 'Low Priority';
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Classifies a single email.
 * Uses rule-based classification first; falls back to AI for ambiguous emails.
 *
 * @param {{ from: string, subject: string, body: string }} email
 * @returns {Promise<string>}  One of CATEGORIES
 */
async function classifyEmail(email) {
  const ruleResult = ruleBasedClassify(email);
  if (ruleResult) return ruleResult;
  return aiClassify(email);
}

/**
 * Classifies an array of emails.
 * Returns a map of category → emails array, matching Feature2 output shape.
 *
 * @param {Array<{id,from,subject,body}>} emails
 * @param {{ onProgress?: (done:number, total:number) => void }} options
 * @returns {Promise<Object.<string, Array>>}  { Personal: [...], Work: [...], ... }
 */
async function classifyEmails(emails, { onProgress } = {}) {
  const result = Object.fromEntries(CATEGORIES.map((c) => [c, []]));

  for (let i = 0; i < emails.length; i++) {
    const category = await classifyEmail(emails[i]);
    const bucket   = result[category] || result['Low Priority'];
    bucket.push(emails[i]);

    if (onProgress) onProgress(i + 1, emails.length);
  }

  return result;
}

module.exports = {
  classifyEmail,
  classifyEmails,
  ruleBasedClassify, // exported for testing without OpenAI
  CATEGORIES,
};
