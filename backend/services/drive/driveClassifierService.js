'use strict';

/**
 * driveClassifierService.js
 *
 * Classifies every file in the user's Google Drive into one of ten fine-
 * grained categories using MIME-type rules first and OpenAI only as a
 * fallback for truly ambiguous MIME types.
 *
 * Categories:
 *   Documents | Images | Videos | Audio | PDFs | Presentations |
 *   Spreadsheets | Archives | Code | Others
 *
 * Returns:
 *   { summary, categoryCounts, classifiedFiles }
 */

const OpenAI   = require('openai');
const { listAllFiles } = require('./driveService');

// ---------------------------------------------------------------------------
// Fine-grained MIME-type → category map (deterministic fast path)
// ---------------------------------------------------------------------------
const MIME_RULES = [
  // PDFs — must come before the generic "document" catch-all
  { match: /^application\/pdf/,                                             category: 'PDFs'          },

  // Google Docs / OOXML documents / legacy Word
  { match: /vnd\.google-apps\.document/,                                    category: 'Documents'     },
  { match: /wordprocessingml|msword|vnd\.oasis\.opendocument\.text/,        category: 'Documents'     },
  { match: /^text\/plain/,                                                  category: 'Documents'     },
  { match: /^text\/html/,                                                   category: 'Documents'     },
  { match: /^application\/rtf/,                                             category: 'Documents'     },

  // Spreadsheets
  { match: /vnd\.google-apps\.spreadsheet/,                                 category: 'Spreadsheets'  },
  { match: /spreadsheetml|ms-excel|vnd\.oasis\.opendocument\.spreadsheet/,  category: 'Spreadsheets'  },

  // Presentations
  { match: /vnd\.google-apps\.presentation/,                                category: 'Presentations' },
  { match: /presentationml|ms-powerpoint|vnd\.oasis\.opendocument\.presentation/, category: 'Presentations' },

  // Images
  { match: /^image\//,                                                      category: 'Images'        },
  { match: /vnd\.google-apps\.photo/,                                       category: 'Images'        },

  // Videos
  { match: /^video\//,                                                      category: 'Videos'        },

  // Audio
  { match: /^audio\//,                                                      category: 'Audio'         },

  // Archives / compressed
  { match: /zip|x-tar|gzip|x-7z|x-rar|x-bzip|x-xz/,                       category: 'Archives'      },

  // Code / scripts
  { match: /^text\/x-|^application\/x-python|^application\/javascript/,    category: 'Code'          },
  { match: /x-sh|x-shellscript|x-c|x-c\+\+|x-java|x-ruby|x-perl/,         category: 'Code'          },
  { match: /^application\/json|^application\/xml|^text\/xml|^text\/css/,   category: 'Code'          },
  { match: /vnd\.google-apps\.script/,                                      category: 'Code'          },
];

/**
 * Fast MIME-type lookup. Returns null when the type is ambiguous and needs
 * the OpenAI fallback.
 * @param {string} mimeType
 * @returns {string|null}
 */
function classifyByMime(mimeType = '') {
  const rule = MIME_RULES.find((r) => r.match.test(mimeType));
  return rule ? rule.category : null;
}

// ---------------------------------------------------------------------------
// OpenAI fallback — batched to minimise API calls
// ---------------------------------------------------------------------------
const VALID_CATEGORIES = [
  'Documents', 'Images', 'Videos', 'Audio', 'PDFs',
  'Presentations', 'Spreadsheets', 'Archives', 'Code', 'Others',
];

let openaiClient = null;
function getOpenAI() {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

/**
 * Classifies a batch of { id, name, mimeType } objects via OpenAI.
 * Returns a Map<id, category>.
 * @param {Array<{id:string, name:string, mimeType:string}>} batch
 * @returns {Promise<Map<string,string>>}
 */
async function classifyBatchWithAI(batch) {
  const resultMap = new Map();
  if (!batch.length) return resultMap;

  const categoriesStr = VALID_CATEGORIES.join(', ');
  const fileLines = batch
    .map((f, i) => `${i + 1}. name="${f.name}" mimeType="${f.mimeType}"`)
    .join('\n');

  const prompt =
    `You are a file categorisation assistant. Classify each file into EXACTLY ONE of these categories: ${categoriesStr}.\n` +
    `Reply with ONLY a JSON array of objects in the same order: [{"id":"<id>","category":"<category>"}, ...]\n\n` +
    `Files:\n${fileLines}`;

  // Attach ids so the model can reference them
  const filesWithIds = batch.map((f, i) => ({ ...f, _lineNo: i + 1 }));

  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model:       process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages:    [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens:  512,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '[]';
    // Extract JSON array from response (guard against markdown fences)
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON array in AI response');

    const parsed = JSON.parse(jsonMatch[0]);
    parsed.forEach((item, idx) => {
      const file = filesWithIds[idx];
      if (!file) return;
      const cat = VALID_CATEGORIES.includes(item.category) ? item.category : 'Others';
      resultMap.set(file.id, cat);
    });
  } catch (err) {
    console.warn('driveClassifierService: OpenAI batch failed, defaulting to Others:', err.message);
    batch.forEach((f) => resultMap.set(f.id, 'Others'));
  }

  return resultMap;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Classifies all non-trashed Drive files for the given token set.
 *
 * @param {{ access_token: string, refresh_token?: string }} tokenSet
 * @returns {Promise<{
 *   summary:         { totalFiles: number, totalSizeBytes: number },
 *   categoryCounts:  Record<string, number>,
 *   classifiedFiles: Array
 * }>}
 */
async function classifyDriveFiles(tokenSet) {
  // 1. Fetch all files via the existing Drive service
  const files = await listAllFiles(tokenSet);

  // 2. Split into MIME-resolved vs ambiguous
  const ambiguous = [];
  const enriched  = files.map((f) => {
    const mimeCategory = classifyByMime(f.mimeType);
    if (mimeCategory) {
      return { ...f, classifiedCategory: mimeCategory, classificationMethod: 'mime' };
    }
    // Mark for AI classification
    ambiguous.push(f);
    return f; // will be updated after AI call
  });

  // 3. Classify ambiguous files in batches of 20 (keeps prompt size manageable)
  const AI_BATCH_SIZE = 20;
  const aiResultMap = new Map();

  for (let i = 0; i < ambiguous.length; i += AI_BATCH_SIZE) {
    const batch = ambiguous.slice(i, i + AI_BATCH_SIZE);
    const batchMap = await classifyBatchWithAI(
      batch.map((f) => ({ id: f.id, name: f.name, mimeType: f.mimeType }))
    );
    batchMap.forEach((cat, id) => aiResultMap.set(id, cat));
  }

  // 4. Merge AI results back
  const classifiedFiles = enriched.map((f) => {
    if (f.classifiedCategory) return f; // already resolved by MIME
    const aiCat = aiResultMap.get(f.id) || 'Others';
    return { ...f, classifiedCategory: aiCat, classificationMethod: 'ai' };
  });

  // 5. Build categoryCounts
  const categoryCounts = Object.fromEntries(
    VALID_CATEGORIES.map((c) => [c, 0])
  );
  let totalSizeBytes = 0;

  classifiedFiles.forEach((f) => {
    const cat = f.classifiedCategory || 'Others';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    totalSizeBytes += f.sizeBytes || 0;
  });

  // 6. Summary
  const summary = {
    totalFiles:      classifiedFiles.length,
    totalSizeBytes,
    categories:      Object.entries(categoryCounts)
      .filter(([, count]) => count > 0)
      .map(([name, count]) => ({
        name,
        count,
        sizeBytes: classifiedFiles
          .filter((f) => f.classifiedCategory === name)
          .reduce((acc, f) => acc + (f.sizeBytes || 0), 0),
      }))
      .sort((a, b) => b.count - a.count),
  };

  return { summary, categoryCounts, classifiedFiles };
}

module.exports = { classifyDriveFiles, VALID_CATEGORIES };
