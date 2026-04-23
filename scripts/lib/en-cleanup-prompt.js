/**
 * Shared prompt builder + cruft-pattern constants for EN cleanup.
 *
 * This module is imported by:
 *   - scripts/pdf-clean-en.js (the bulk cleanup CLI, topic #110)
 *   - the manual-translator agent prompt wiring (topic #112) — the same cruft
 *     patterns are applied up-front so freshly translated pages land already
 *     cleaned.
 *
 * The prompt instructs a Claude model to take raw, messy English text from a
 * `pdf-parse` extraction and emit a reformatted English string that mirrors
 * the structural shape of the Japanese translation (paragraph + list breaks),
 * while preserving English wording VERBATIM.
 */

// --------------------------------------------------------------------------
// Cruft patterns
// --------------------------------------------------------------------------

/**
 * Running page headers emitted on every page of the source PDF.
 * Example matches:
 *   "The OXI ONE MKII Manual"
 *   "24 The OXI ONE MKII Manual"
 *   "IV The OXI ONE MKII Manual"
 *
 * Anchored to line starts/ends so it doesn't eat body prose.
 */
export const RUNNING_HEADER_RE = /^\s*(?:[IVXLCDM]+|\d+)?\s*The OXI ONE MKII Manual\s*$/gim;

/**
 * "-- N of M --" page-number leaders inserted between columns during extraction.
 * Example matches:
 *   "-- 1 of 7 --"
 *   "-- 24 of 280 --"
 */
export const N_OF_M_RE = /-{1,3}\s*\d+\s+of\s+\d+\s*-{1,3}/gi;

/**
 * Trailing standalone section number like "1.5" or "2.10" that appears alone on
 * its own line — usually a page footer that survived extraction.
 */
export const TRAILING_SECTION_NUMBER_RE = /^\s*\d+\.\d+\s*$/gm;

/**
 * Bare "Contents" / "Page N" / "N" tokens sometimes left over as the only
 * content on a line.
 */
export const BARE_TOC_MARKER_RE = /^\s*(?:Contents|Page\s+\d+|\d+)\s*$/gim;

// --------------------------------------------------------------------------
// Prompt builder
// --------------------------------------------------------------------------

const PROMPT_HEADER = `You are an expert technical editor. You reformat raw English text extracted from a PDF manual so it reads like clean, properly paragraphed English prose, WITHOUT translating or paraphrasing.

Your rules are ABSOLUTE:
1. Preserve English wording VERBATIM. Do NOT translate. Do NOT paraphrase. Do NOT summarize. Do NOT add, remove, or reorder sentences.
2. Keep hyphens, capitalization, product names, and technical terms exactly as given.
3. Strip running page headers (e.g. "The OXI ONE MKII Manual", "24 The OXI ONE MKII Manual", "IV The OXI ONE MKII Manual").
4. Strip page-number leaders like "-- 1 of 7 --".
5. Strip trailing standalone section numbers like "1.5" or "2.10" that appear alone on a line as footer cruft.
6. Strip bare "Contents" / "Page N" markers when they appear as their own line.
7. Insert a single blank line (\\n\\n) between paragraphs and between list items, mirroring the paragraph structure of the Japanese translation provided as a structural reference. Do NOT copy any Japanese content into the output.
8. Use the Japanese translation ONLY as a structural guide (where do list items start, where do paragraphs break). Its wording is irrelevant. If it is null, apply the cruft-strip rules only.
9. **No markdown headings — any form.** The viewer renders this text through react-markdown + remark-gfm, so any heading syntax turns into a bold, oversized block with a separator line. Avoid ALL of these:
   (a) ATX headings: never start a line with \`#\`, \`##\`, \`###\`, etc.
   (b) Setext headings: never emit a line containing only \`=\` characters (any length) or only \`-\` characters (any length) directly below a non-blank text line. CommonMark treats that line as an underline and turns the text above into an H1/H2. This frequently appears when the source PDF has isolated polarity tokens (e.g. a lone \`+\` and \`-\` on separate lines under a label like \`ATTENUVERTER\`). Fix it by joining the isolated token onto the adjacent line (\`ATTENUVERTER + -\` or \`ATTENUVERTER +/-\`), or by inserting a blank line between the text and the standalone \`-\` so the \`-\` becomes its own paragraph. Never leave a bare \`-\` / \`--\` / \`=\` line directly under text.
   (c) Horizontal rules: never emit a line of 3+ \`-\`, \`_\`, or \`*\` characters alone (e.g. \`---\`, \`------------\`). These are almost always PDF footer cruft — drop them.
10. If after cleanup there is no substantive body content left (only cruft), return an empty string for en_clean.
11. You MUST respond with a single JSON object of the shape {"en_clean": "..."} and NOTHING ELSE. No markdown code fences. No prose. No commentary. Just the JSON.`;

/**
 * Build the per-page cleanup prompt.
 *
 * @param {object} args
 * @param {string} args.slug - manual slug, e.g. "oxi-one-mk2"
 * @param {number} args.pageNum - 1-based page number
 * @param {number} args.totalPages - total page count for the manual
 * @param {string} args.raw_en - raw English content (may be empty)
 * @param {string|null} args.clean_ja - cleaned Japanese translation, or null
 *   when the JA side is empty (apply cruft-strip rules only, no scaffold)
 * @returns {string} prompt string
 */
export function buildEnCleanupPrompt({ slug, pageNum, totalPages, raw_en, clean_ja }) {
  const jaBlock =
    clean_ja === null || clean_ja === undefined
      ? '(none — apply cruft-strip rules only, no structural scaffold is available)'
      : clean_ja;

  return [
    PROMPT_HEADER,
    '',
    `Manual slug: ${slug}`,
    `Page: ${pageNum} of ${totalPages}`,
    '',
    'Raw English (source — reformat this, preserve wording VERBATIM):',
    '---',
    raw_en ?? '',
    '---',
    '',
    'Japanese translation (structural reference only — do NOT copy its wording):',
    '---',
    jaBlock,
    '---',
    '',
    'Respond with ONE JSON object only: {"en_clean": "..."}',
  ].join('\n');
}

/**
 * Extract the JSON payload from a Claude response.
 *
 * The subprocess wrapper reliably returns the assistant text — but that text
 * might be a bare JSON object, or it might be fenced in ```json ... ```, or
 * it might have leading/trailing whitespace. This helper peels all of those
 * off and returns the parsed `{ en_clean }` object.
 *
 * @param {string} text
 * @returns {{ en_clean: string }}
 */
export function parseEnCleanResponse(text) {
  if (typeof text !== 'string') {
    throw new Error(`expected string, got ${typeof text}`);
  }
  let body = text.trim();

  // Strip ```json ... ``` or ``` ... ``` fences if present.
  const fenceMatch = body.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/i);
  if (fenceMatch) {
    body = fenceMatch[1].trim();
  }

  // Some models still leak a leading note before the JSON object. Find the
  // first `{` and the matching last `}` and try that substring if the direct
  // parse fails. On JSON-parse failures, apply control-char escaping as a
  // second-chance parse: Haiku occasionally emits literal \n / \r / \t inside
  // string values, which is invalid JSON but recoverable.
  try {
    return parseAndValidate(body);
  } catch (firstErr) {
    const first = body.indexOf('{');
    const last = body.lastIndexOf('}');
    const candidate = first >= 0 && last > first ? body.slice(first, last + 1) : body;
    try {
      return parseAndValidate(candidate);
    } catch (secondErr) {
      try {
        return parseAndValidate(escapeControlCharsInStrings(candidate));
      } catch {
        throw secondErr;
      }
    }
  }
}

function parseAndValidate(jsonStr) {
  const obj = JSON.parse(jsonStr);
  if (obj === null || typeof obj !== 'object') {
    throw new Error('response JSON was not an object');
  }
  if (typeof obj.en_clean !== 'string') {
    throw new Error('response JSON missing "en_clean" string field');
  }
  return obj;
}

/**
 * Escape unescaped control characters inside JSON string values.
 *
 * Walks the text character-by-character, tracking whether we are inside a
 * string literal. When a literal control character (0x00–0x1F) appears
 * inside a string, rewrite it as a valid JSON escape sequence so JSON.parse
 * can handle it. This is a defensive fallback for models that emit literal
 * newlines inside string values.
 *
 * @param {string} text
 * @returns {string}
 */
export function escapeControlCharsInStrings(text) {
  let out = '';
  let inString = false;
  let escaped = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escaped) {
      out += ch;
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      out += ch;
      escaped = true;
      continue;
    }
    if (ch === '"') {
      out += ch;
      inString = !inString;
      continue;
    }
    if (inString && ch.charCodeAt(0) < 0x20) {
      if (ch === '\n') out += '\\n';
      else if (ch === '\r') out += '\\r';
      else if (ch === '\t') out += '\\t';
      else if (ch === '\b') out += '\\b';
      else if (ch === '\f') out += '\\f';
      else out += '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0');
      continue;
    }
    out += ch;
  }
  return out;
}
