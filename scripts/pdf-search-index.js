#!/usr/bin/env node

/**
 * PDF Search Index Generator
 *
 * Reads `public/{slug}/data/pages-ja.json` and emits a compact, MiniSearch-ready
 * search index to `public/{slug}/data/search-index.json`.
 *
 * Skips pages where `hasContent === false`. For each remaining page it:
 *   - Extracts the first markdown heading from `content` as an optional title override.
 *   - Strips markdown (headings, bold/italic, links, code fences/spans) to plain text.
 *   - Truncates the body to ~500 chars.
 *
 * Output entry shape:
 *   { id: string, pageNum: number, title: string, sectionName: string | null,
 *     body: string, url: string }
 *
 * CLI convention matches the rest of the pipeline scripts
 * (see scripts/pdf-split.js, scripts/pdf-build.js):
 *
 *   node scripts/pdf-search-index.js --slug oxi-one-mk2
 *   # or
 *   pnpm run pdf:search-index --slug oxi-one-mk2
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { resolveManualConfig } from './lib/pdf-config-resolver.js';
import { serializeSearchIndex } from './lib/search-index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

const BODY_MAX_CHARS = 500;

/**
 * Extract the first markdown ATX heading ("# ...", "## ...", etc.) from a string.
 * Returns the heading text without the leading hashes, or null if no heading
 * appears before any non-heading, non-blank line.
 *
 * We only look at the first heading, not any heading — consistent with the spec
 * which uses it as a best-effort `title` override. Code fences are ignored so a
 * heading-looking line inside a fenced block is not treated as a heading.
 *
 * @param {string} content
 * @returns {string | null}
 */
export function extractFirstHeading(content) {
  if (typeof content !== 'string' || content.length === 0) return null;

  const lines = content.split(/\r?\n/);
  let inFence = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('```') || line.startsWith('~~~')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = line.match(/^#{1,6}\s+(.+?)\s*#*\s*$/);
    if (m) return m[1].trim();
  }
  return null;
}

/**
 * Strip common markdown syntax to plain text, suitable for full-text search indexing.
 *
 * Handles (in order):
 *   1. Fenced code blocks (``` ... ```, ~~~ ... ~~~) — removed entirely.
 *   2. Inline code spans (`code`) — unwrapped to inner text.
 *   3. Images (![alt](url)) — replaced with alt text.
 *   4. Links ([text](url)) — replaced with link text.
 *   5. Bold/italic (**x**, __x__, *x*, _x_) — unwrapped.
 *   6. Strikethrough (~~x~~) — unwrapped.
 *   7. ATX headings (#, ##, ...) — leading hashes removed.
 *   8. Blockquote markers (>) at line start — removed.
 *   9. List markers (-, *, +, "1.") at line start — removed.
 *  10. Collapse runs of whitespace/newlines to single spaces.
 *
 * Regex-based — good enough for search indexing; not a full markdown parser.
 *
 * @param {string} md
 * @returns {string}
 */
export function stripMarkdown(md) {
  if (typeof md !== 'string' || md.length === 0) return '';

  let out = md;

  // Remove fenced code blocks entirely (including triple-backtick and tilde variants).
  out = out.replace(/```[\s\S]*?```/g, ' ');
  out = out.replace(/~~~[\s\S]*?~~~/g, ' ');

  // Inline code: `foo` -> foo
  out = out.replace(/`([^`]+)`/g, '$1');

  // Images: ![alt](url) -> alt
  out = out.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');

  // Links: [text](url) -> text
  out = out.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

  // Bold/italic (process greedy double-marker variants first).
  out = out.replace(/\*\*([^*]+)\*\*/g, '$1');
  out = out.replace(/__([^_]+)__/g, '$1');
  out = out.replace(/\*([^*\n]+)\*/g, '$1');
  out = out.replace(/_([^_\n]+)_/g, '$1');

  // Strikethrough: ~~x~~ -> x
  out = out.replace(/~~([^~]+)~~/g, '$1');

  // Headings: strip leading #'s (with or without trailing #'s).
  out = out.replace(/^\s{0,3}#{1,6}\s+/gm, '');

  // Blockquotes: strip leading ">" markers.
  out = out.replace(/^\s{0,3}>\s?/gm, '');

  // List markers: leading "-", "*", "+", or "1." / "1)".
  out = out.replace(/^\s{0,3}(?:[-*+]|\d+[.)])\s+/gm, '');

  // Collapse whitespace.
  out = out.replace(/\s+/g, ' ').trim();

  return out;
}

/**
 * Truncate `text` to at most `max` characters. Tries to break on a whitespace
 * boundary within the last ~20% so we don't cut a word in half when it's easy
 * to avoid. Does NOT append ellipses — the body is raw search text, not UI.
 *
 * @param {string} text
 * @param {number} max
 * @returns {string}
 */
export function truncate(text, max = BODY_MAX_CHARS) {
  if (typeof text !== 'string') return '';
  if (text.length <= max) return text;

  const hardCut = text.slice(0, max);
  const softWindow = Math.floor(max * 0.8);
  const lastSpace = hardCut.lastIndexOf(' ');
  if (lastSpace >= softWindow) return hardCut.slice(0, lastSpace);
  return hardCut;
}

/**
 * Build a single search index entry from a pages-ja.json page object.
 *
 * @param {object} page - page entry from pages-ja.json
 * @param {string} slug - manual slug, used to build the route URL
 * @returns {object} search index entry
 */
export function buildEntry(page, slug) {
  const heading = extractFirstHeading(page.content);
  const title = heading || page.title || `Page ${page.pageNum}`;
  const sectionName = page.sectionName || heading || null;
  const body = truncate(stripMarkdown(page.content || ''), BODY_MAX_CHARS);

  return {
    id: String(page.pageNum),
    pageNum: page.pageNum,
    title,
    sectionName,
    body,
    url: `/${slug}/page/${page.pageNum}`,
  };
}

/**
 * Build the full search index array from a pages-ja.json document.
 * Skips pages where `hasContent === false`.
 *
 * @param {object} pagesDoc - parsed contents of pages-ja.json
 * @param {string} slug - manual slug
 * @returns {Array<object>}
 */
export function buildIndex(pagesDoc, slug) {
  if (!pagesDoc || !Array.isArray(pagesDoc.pages)) {
    throw new Error('Invalid pages-ja.json: missing `pages` array');
  }
  return pagesDoc.pages.filter((p) => p && p.hasContent === true).map((p) => buildEntry(p, slug));
}

// --------------------------------------------------------------------------
// CLI entrypoint — only run when invoked directly, not when imported by tests.
// --------------------------------------------------------------------------

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  try {
    const config = resolveManualConfig(ROOT_DIR);
    const slug = config.slug;

    const inputPath = join(ROOT_DIR, config.output.data, 'pages-ja.json');
    const outputPath = join(ROOT_DIR, config.output.data, 'search-index.json');

    console.log('🔎 PDF Search Index Generator');
    console.log('='.repeat(50));
    console.log(`📦 Manual: ${slug}`);
    console.log(`📄 Input:  ${inputPath}`);

    if (!existsSync(inputPath)) {
      console.error(`❌ Input file not found: ${inputPath}`);
      console.error('   Run `pnpm run pdf:build --slug ' + slug + '` first.');
      process.exit(1);
    }

    const pagesDoc = JSON.parse(readFileSync(inputPath, 'utf-8'));
    const entries = buildIndex(pagesDoc, slug);

    const outputDir = dirname(outputPath);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const serialized = serializeSearchIndex(entries);
    writeFileSync(outputPath, serialized);

    const byteLength = Buffer.byteLength(serialized, 'utf-8');
    console.log(`📁 Output: ${outputPath}`);
    console.log('');
    console.log(
      `✨ Generated search index for ${slug}: ${entries.length} entries, ${byteLength} bytes`,
    );
  } catch (err) {
    console.error('');
    console.error('❌ Error generating search index:');
    console.error(err);
    process.exit(1);
  }
}
