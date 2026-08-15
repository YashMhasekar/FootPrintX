'use strict';

/**
 * websiteTrackerService.js
 *
 * Scans a user's Gmail inbox, extracts unique sender domains,
 * groups emails by service/website, and categorises each one using
 * a rule-based lookup first and an OpenAI fallback only for unknown domains.
 *
 * Reuses buildGmailClient from gmailService — no new OAuth flow.
 * Callers supply a tokenSet: { access_token, refresh_token? }
 * obtained via tokenHelpers (same pattern as all other services).
 */

const { google } = require('googleapis');
const OpenAI = require('openai');
const { buildGmailClient } = require('../gmail/gmailService');

// ---------------------------------------------------------------------------
// OpenAI — lazy init, only called for unknown domains
// ---------------------------------------------------------------------------

let _openaiClient = null;

function getOpenAIClient() {
  if (!_openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      return null; // AI unavailable — fall back to 'Other'
    }
    _openaiClient = new OpenAI({ apiKey });
  }
  return _openaiClient;
}

// ---------------------------------------------------------------------------
// Rule-based category map
// key = lowercase substring match against domain
// ---------------------------------------------------------------------------

const DOMAIN_RULES = [
  // Shopping
  { patterns: ['amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'snapdeal', 'ebay', 'walmart', 'aliexpress', 'etsy', 'nykaa', 'bigbasket', 'blinkit', 'swiggy', 'zomato', 'dunzo'], category: 'Shopping' },
  // Developer
  { patterns: ['github', 'gitlab', 'bitbucket', 'vercel', 'netlify', 'render', 'heroku', 'digitalocean', 'railway', 'supabase', 'firebase', 'stackblitz', 'replit', 'codepen', 'jsfiddle', 'stackoverflow', 'npm', 'pypi', 'docker', 'kubernetes'], category: 'Developer' },
  // Professional
  { patterns: ['linkedin', 'indeed', 'naukri', 'monster', 'glassdoor', 'angel', 'wellfound', 'upwork', 'fiverr', 'toptal', 'hiration', 'resumegenius', 'slack', 'notion', 'asana', 'jira', 'confluence', 'trello', 'monday'], category: 'Professional' },
  // Entertainment
  { patterns: ['netflix', 'spotify', 'primevideo', 'amazon.com/primevideo', 'hotstar', 'zee5', 'sonyliv', 'jiocinema', 'youtube', 'twitch', 'crunchyroll', 'disneyplus', 'hulu', 'voot', 'mxplayer', 'gaana', 'jiosaavn', 'wynk', 'hungama'], category: 'Entertainment' },
  // Education
  { patterns: ['coursera', 'udemy', 'edx', 'classroom.google', 'khanacademy', 'skillshare', 'pluralsight', 'lynda', 'linkedin.com/learning', 'udacity', 'brilliant', 'duolingo', 'byjus', 'unacademy', 'toppr', 'vedantu', 'npmjs', 'leetcode', 'hackerrank', 'codechef', 'codeforces', 'hackerearth'], category: 'Education' },
  // Finance
  { patterns: ['paypal', 'stripe', 'razorpay', 'paytm', 'phonepe', 'gpay', 'googlepay', 'bank', 'hdfc', 'icici', 'sbi', 'axis', 'kotak', 'yesbank', 'indusind', 'zerodha', 'groww', 'angelone', 'upstox', 'coin', 'cleartax', 'quickbooks', 'freshbooks', 'wise', 'revolut', 'monzo'], category: 'Finance' },
  // Travel
  { patterns: ['uber', 'ola', 'rapido', 'airbnb', 'booking', 'makemytrip', 'yatra', 'goibibo', 'irctc', 'redbus', 'abhibus', 'cleartrip', 'tripadvisor', 'expedia', 'kayak', 'skyscanner', 'indigo', 'airindia', 'spicejet'], category: 'Travel' },
  // Social
  { patterns: ['facebook', 'instagram', 'discord', 'twitter', 'x.com', 'reddit', 'pinterest', 'snapchat', 'telegram', 'whatsapp', 'signal', 'tiktok', 'quora', 'tumblr', 'medium', 'substack', 'mastodon'], category: 'Social' },
  // Cloud / Productivity
  { patterns: ['google.com', 'googleapis', 'microsoft', 'dropbox', 'adobe', 'icloud', 'apple', 'box.com', 'onedrive', 'notion', 'airtable', 'figma', 'canva', 'miro', 'loom', 'zoom', 'meet.google', 'teams'], category: 'Cloud' },
  // Security / Privacy
  { patterns: ['lastpass', 'bitwarden', '1password', 'dashlane', 'nordvpn', 'expressvpn', 'protonmail', 'proton', 'tutanota', 'haveibeenpwned', 'virustotal'], category: 'Security' },
  // Health
  { patterns: ['practo', 'healthifyme', 'cult', 'fitbit', 'strava', 'myfitnesspal', 'headspace', 'calm', 'doctor', 'hospital', 'clinic', 'pharmacy', 'medlife', 'netmeds', 'apollo', '1mg'], category: 'Health' },
];

// Known brand name overrides for better display names
const BRAND_NAMES = {
  'google.com': 'Google',
  'gmail.com': 'Gmail',
  'youtube.com': 'YouTube',
  'github.com': 'GitHub',
  'gitlab.com': 'GitLab',
  'facebook.com': 'Facebook',
  'instagram.com': 'Instagram',
  'twitter.com': 'Twitter',
  'x.com': 'X (Twitter)',
  'linkedin.com': 'LinkedIn',
  'netflix.com': 'Netflix',
  'spotify.com': 'Spotify',
  'amazon.com': 'Amazon',
  'amazon.in': 'Amazon India',
  'flipkart.com': 'Flipkart',
  'paypal.com': 'PayPal',
  'stripe.com': 'Stripe',
  'github.io': 'GitHub Pages',
  'vercel.app': 'Vercel',
  'netlify.app': 'Netlify',
  'heroku.com': 'Heroku',
  'notion.so': 'Notion',
  'slack.com': 'Slack',
  'discord.com': 'Discord',
  'reddit.com': 'Reddit',
  'medium.com': 'Medium',
  'substack.com': 'Substack',
  'udemy.com': 'Udemy',
  'coursera.org': 'Coursera',
  'dropbox.com': 'Dropbox',
  'microsoft.com': 'Microsoft',
  'apple.com': 'Apple',
  'adobe.com': 'Adobe',
  'zoom.us': 'Zoom',
  'uber.com': 'Uber',
  'airbnb.com': 'Airbnb',
  'booking.com': 'Booking.com',
  'myntra.com': 'Myntra',
  'naukri.com': 'Naukri',
  'indeed.com': 'Indeed',
  'glassdoor.com': 'Glassdoor',
  'razorpay.com': 'Razorpay',
  'paytm.com': 'Paytm',
  'phonepe.com': 'PhonePe',
  'zerodha.com': 'Zerodha',
  'groww.in': 'Groww',
  'swiggy.com': 'Swiggy',
  'zomato.com': 'Zomato',
};

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/**
 * Extracts the registrable domain from an email address.
 * notifications@sub.github.com → github.com
 * support@amazon.in → amazon.in
 * hello@netflix.com → netflix.com
 */
function extractDomain(emailAddress) {
  if (!emailAddress) return null;
  const at = emailAddress.lastIndexOf('@');
  if (at === -1) return null;
  const host = emailAddress.slice(at + 1).toLowerCase().trim();
  // Collapse subdomains: keep only last two labels unless TLD is 2-letter country code (e.g. .co.in)
  const parts = host.split('.');
  if (parts.length >= 3) {
    const tld = parts[parts.length - 1];
    const sld = parts[parts.length - 2];
    // Country TLDs like .co.in, .co.uk, .com.au — keep 3 labels
    if (tld.length === 2 && ['co', 'com', 'net', 'org', 'gov', 'edu', 'ac'].includes(sld)) {
      return parts.slice(-3).join('.');
    }
    return parts.slice(-2).join('.');
  }
  return host;
}

/**
 * Rule-based category lookup.
 * Returns category string or null (unknown domain).
 */
function ruleCategory(domain) {
  if (!domain) return null;
  const d = domain.toLowerCase();
  for (const rule of DOMAIN_RULES) {
    if (rule.patterns.some((p) => d.includes(p))) {
      return rule.category;
    }
  }
  return null;
}

/**
 * Derives a display name from a domain.
 * Uses BRAND_NAMES lookup first, then title-cases the SLD.
 */
function domainToName(domain) {
  if (!domain) return 'Unknown';
  if (BRAND_NAMES[domain]) return BRAND_NAMES[domain];
  // title-case the second-level label
  const sld = domain.split('.')[0];
  return sld.charAt(0).toUpperCase() + sld.slice(1);
}

/**
 * Returns the Google favicon service URL for a domain.
 */
function faviconUrl(domain) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

/**
 * Returns 'active' if lastSeen is within 90 days, else 'inactive'.
 */
function computeStatus(lastSeen) {
  if (!lastSeen) return 'inactive';
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  return new Date(lastSeen).getTime() > ninetyDaysAgo ? 'active' : 'inactive';
}

/**
 * Parses "Name <email>" or bare "email" from a From header.
 */
function parseFrom(fromHeader) {
  if (!fromHeader) return { name: '', email: '' };
  const match = fromHeader.match(/^(.*?)<(.+)>$/);
  if (match) {
    return {
      name: match[1].trim().replace(/^"|"$/g, ''),
      email: match[2].trim().toLowerCase(),
    };
  }
  return { name: fromHeader.trim(), email: fromHeader.trim().toLowerCase() };
}

/**
 * Concurrency limiter (same as gmailService.mapWithConcurrency).
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
// AI fallback — called only for domains with no rule match
// ---------------------------------------------------------------------------

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

/**
 * Uses OpenAI to guess category + display name for an unknown domain.
 * Returns { category, websiteName, confidence }.
 * On any error falls back to { category: 'Other', websiteName: domainToName(domain), confidence: 'low' }.
 */
async function aiCategorise(domain, sampleSubject) {
  const client = getOpenAIClient();
  if (!client) {
    return { category: 'Other', websiteName: domainToName(domain), confidence: 'low' };
  }

  const prompt = [
    `Domain: ${domain}`,
    `Sample email subject: ${sampleSubject || 'N/A'}`,
    '',
    'Respond with JSON only, no prose:',
    '{ "websiteName": "<display name>", "category": "<one of: Shopping, Developer, Professional, Entertainment, Education, Finance, Travel, Social, Cloud, Security, Health, Other>", "confidence": "<high|medium|low>" }',
  ].join('\n');

  try {
    const res = await client.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: 'You are a website categoriser. Given a domain name and an email subject, classify the website and return valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 80,
    });

    const raw = res.choices[0].message.content.trim();
    const parsed = JSON.parse(raw);
    return {
      category: parsed.category || 'Other',
      websiteName: parsed.websiteName || domainToName(domain),
      confidence: parsed.confidence || 'medium',
    };
  } catch (err) {
    console.warn(`websiteTrackerService: AI categorise failed for ${domain}:`, err.message);
    return { category: 'Other', websiteName: domainToName(domain), confidence: 'low' };
  }
}

// ---------------------------------------------------------------------------
// Core scanner
// ---------------------------------------------------------------------------

/**
 * Fetches up to maxMessages from Gmail (full inbox, not just promotions),
 * extracts sender domains, groups emails, and classifies each domain.
 *
 * @param {{ access_token: string, refresh_token?: string }} tokenSet
 * @param {{ maxMessages?: number }} options
 * @returns {Promise<{
 *   totalWebsites: number,
 *   categoryCounts: object,
 *   activeCount: number,
 *   inactiveCount: number,
 *   websites: Array
 * }>}
 */
async function scanWebsites(tokenSet, { maxMessages = 300 } = {}) {
  const gmail = buildGmailClient(tokenSet);

  // ── 1. Fetch message IDs ─────────────────────────────────────────────────
  let ids = [];
  let pageToken;
  const batchSize = 100;

  do {
    const { data } = await gmail.users.messages.list({
      userId:     'me',
      q:          'in:inbox OR category:promotions OR category:updates OR category:forums OR in:sent',
      maxResults: Math.min(batchSize, maxMessages - ids.length),
      pageToken,
    });
    ids = ids.concat((data.messages || []).map((m) => m.id));
    pageToken = data.nextPageToken;
  } while (pageToken && ids.length < maxMessages);

  if (!ids.length) {
    return { totalWebsites: 0, categoryCounts: {}, activeCount: 0, inactiveCount: 0, websites: [] };
  }

  // ── 2. Fetch metadata headers for each message ───────────────────────────
  const rawMessages = await mapWithConcurrency(ids, 10, async (id) => {
    try {
      const { data } = await gmail.users.messages.get({
        userId:          'me',
        id,
        format:          'metadata',
        metadataHeaders: ['From', 'Subject', 'Date'],
      });
      const headers = {};
      for (const h of data.payload?.headers || []) {
        headers[h.name] = h.value;
      }
      return { id, headers, internalDate: data.internalDate };
    } catch (err) {
      console.warn(`websiteTrackerService: skip message ${id}:`, err.message);
      return null;
    }
  });

  // ── 3. Group by domain ───────────────────────────────────────────────────
  const byDomain = new Map();

  for (const msg of rawMessages) {
    if (!msg) continue;
    const { name, email } = parseFrom(msg.headers.From);
    if (!email) continue;

    const domain = extractDomain(email);
    if (!domain) continue;

    // Skip obvious internal / system senders
    if (['localhost', 'example.com', 'test.com'].includes(domain)) continue;

    const msgDate = msg.internalDate ? new Date(Number(msg.internalDate)) : null;
    const subject = msg.headers.Subject || '';

    if (!byDomain.has(domain)) {
      byDomain.set(domain, {
        domain,
        senderNames: new Set(),
        senderEmails: new Set(),
        emailCount: 0,
        firstSeen: msgDate,
        lastSeen: msgDate,
        sampleEmails: [],
      });
    }

    const entry = byDomain.get(domain);
    entry.emailCount += 1;
    if (name) entry.senderNames.add(name);
    entry.senderEmails.add(email);

    if (msgDate) {
      if (!entry.firstSeen || msgDate < entry.firstSeen) entry.firstSeen = msgDate;
      if (!entry.lastSeen  || msgDate > entry.lastSeen)  entry.lastSeen  = msgDate;
    }

    if (entry.sampleEmails.length < 5 && subject) {
      entry.sampleEmails.push({
        subject,
        from: email,
        date: msgDate ? msgDate.toISOString() : null,
      });
    }
  }

  // ── 4. Classify each domain ──────────────────────────────────────────────
  const domains = Array.from(byDomain.values());

  // Split into known (rule) vs unknown (needs AI)
  const knownDomains   = [];
  const unknownDomains = [];

  for (const entry of domains) {
    const cat = ruleCategory(entry.domain);
    if (cat) {
      knownDomains.push({ entry, category: cat, websiteName: domainToName(entry.domain), confidence: 'high' });
    } else {
      unknownDomains.push(entry);
    }
  }

  // AI only for unknown domains (capped to avoid excessive API calls)
  const aiResults = await mapWithConcurrency(unknownDomains, 3, async (entry) => {
    const sampleSubject = entry.sampleEmails[0]?.subject || '';
    const ai = await aiCategorise(entry.domain, sampleSubject);
    return { entry, ...ai };
  });

  // ── 5. Build final website objects ───────────────────────────────────────
  const allResults = [...knownDomains, ...aiResults];

  const websites = allResults.map((item, idx) => ({
    id:          `wt_${idx}_${item.entry.domain.replace(/\W/g, '_')}`,
    websiteName: item.websiteName,
    domain:      item.entry.domain,
    logoUrl:     faviconUrl(item.entry.domain),
    category:    item.category,
    emailCount:  item.entry.emailCount,
    firstSeen:   item.entry.firstSeen ? item.entry.firstSeen.toISOString() : null,
    lastSeen:    item.entry.lastSeen  ? item.entry.lastSeen.toISOString()  : null,
    status:      computeStatus(item.entry.lastSeen),
    confidence:  item.confidence,
    sampleEmails: item.entry.sampleEmails,
  }));

  // Sort: most emails first
  websites.sort((a, b) => b.emailCount - a.emailCount);

  // ── 6. Aggregate counts ──────────────────────────────────────────────────
  const categoryCounts = {};
  let activeCount = 0;
  let inactiveCount = 0;

  for (const w of websites) {
    categoryCounts[w.category] = (categoryCounts[w.category] || 0) + 1;
    if (w.status === 'active') activeCount++;
    else inactiveCount++;
  }

  return {
    totalWebsites: websites.length,
    categoryCounts,
    activeCount,
    inactiveCount,
    websites,
  };
}

module.exports = {
  scanWebsites,
  // Exported for unit testing
  extractDomain,
  ruleCategory,
  domainToName,
  computeStatus,
};
