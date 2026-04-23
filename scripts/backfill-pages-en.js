#!/usr/bin/env node

/**
 * Backfill pages-en.json for manuals that only have pages-ja.json
 *
 * For each target manual slug, this script:
 *   1. Finds the source PDF in `manual-pdf/{slug}/*.pdf`.
 *   2. Reads the existing `public/{slug}/data/pages-ja.json` to determine the
 *      authoritative page list (pageNum, image path).
 *   3. Extracts per-page text from the PDF via pdf-parse v2.
 *   4. Emits `public/{slug}/data/pages-en.json` in the same shape as the
 *      reference file at `public/oxi-coral/data/pages-en.json`.
 *
 * This is a one-shot backfill helper complementing the normal pipeline:
 * the normal pipeline emits both pages-ja.json and pages-en.json together
 * via `pdf:build`, but for these manuals only pages-ja.json was committed
 * historically. See GitHub issue #97 on Takazudo/takazudomodular-manuals.
 *
 * Usage:
 *   node scripts/backfill-pages-en.js --slug oxi-one-mk2
 *   node scripts/backfill-pages-en.js --all-missing
 *
 * With --all-missing, iterates every manual under public/ that has a
 * pages-ja.json but no pages-en.json and attempts to backfill each one.
 * Manuals without a discoverable source PDF are skipped with a warning;
 * no empty / placeholder pages-en.json is written.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');
const PUBLIC_DIR = join(ROOT_DIR, 'public');

/**
 * Parse CLI args for --slug <slug> and --all-missing.
 *
 * @returns {{ slug: string | null, allMissing: boolean }}
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const slugIndex = args.indexOf('--slug');
  const slug = slugIndex !== -1 ? args[slugIndex + 1] : null;
  const allMissing = args.includes('--all-missing');
  return { slug, allMissing };
}

/**
 * Find the first PDF file under `manual-pdf/{slug}/`. Returns null if none.
 *
 * @param {string} slug
 * @returns {string | null}
 */
function findSourcePdf(slug) {
  const pdfDir = join(ROOT_DIR, 'manual-pdf', slug);
  if (!existsSync(pdfDir)) return null;
  const matches = glob.sync(join(pdfDir, '*.pdf'));
  if (matches.length === 0) return null;
  matches.sort();
  return matches[0];
}

/**
 * Discover manuals whose data/ directory has pages-ja.json but not pages-en.json.
 *
 * @returns {string[]} sorted slugs
 */
function discoverMissingEnSlugs() {
  if (!existsSync(PUBLIC_DIR)) return [];
  const entries = readdirSync(PUBLIC_DIR);
  const slugs = [];
  for (const name of entries) {
    const abs = join(PUBLIC_DIR, name);
    let st;
    try {
      st = statSync(abs);
    } catch {
      continue;
    }
    if (!st.isDirectory()) continue;
    const ja = join(abs, 'data', 'pages-ja.json');
    const en = join(abs, 'data', 'pages-en.json');
    if (existsSync(ja) && !existsSync(en)) {
      slugs.push(name);
    }
  }
  slugs.sort();
  return slugs;
}

/**
 * Extract per-page text from a PDF using pdf-parse v2.
 *
 * Returns a Map<pageNumber, string> keyed by 1-based page number. pdf-parse
 * 1-indexes pages in its `pages: Array<{ num, text }>` result.
 *
 * @param {string} pdfPath
 * @returns {Promise<{ pageMap: Map<number, string>, total: number }>}
 */
async function extractPageTextMap(pdfPath) {
  const parser = new PDFParse({ data: readFileSync(pdfPath) });
  try {
    const result = await parser.getText();
    const pageMap = new Map();
    for (const p of result.pages) {
      pageMap.set(p.num, (p.text || '').trim());
    }
    return { pageMap, total: result.total };
  } finally {
    await parser.destroy();
  }
}

/**
 * Build the pages-en.json document for a given slug using the authoritative
 * page list from pages-ja.json and the text extracted from the source PDF.
 *
 * The output shape mirrors `public/oxi-coral/data/pages-en.json`:
 *   metadata: { processedAt, language: 'en', extractionMethod, imageFormat, imageDPI }
 *   pages:    [{ pageNum, image, title, sectionName, content, hasContent, tags }]
 *
 * @param {string} slug
 * @param {object} jaDoc - Parsed pages-ja.json document
 * @param {Map<number, string>} pageMap - Per-page text from the PDF
 * @returns {object}
 */
function buildEnDoc(slug, jaDoc, pageMap) {
  const imageFormat = jaDoc?.metadata?.imageFormat ?? 'png';
  const imageDPI = jaDoc?.metadata?.imageDPI ?? 300;

  const pages = jaDoc.pages.map((jaPage) => {
    const pageNum = jaPage.pageNum;
    const content = (pageMap.get(pageNum) ?? '').trim();
    return {
      pageNum,
      image: jaPage.image ?? `/${slug}/pages/page-${String(pageNum).padStart(3, '0')}.png`,
      title: jaPage.title ?? `Page ${pageNum}`,
      sectionName: jaPage.sectionName ?? null,
      content,
      hasContent: content.length > 0,
      tags: [],
    };
  });

  return {
    metadata: {
      processedAt: new Date().toISOString(),
      language: 'en',
      extractionMethod: 'pdf-parse',
      imageFormat,
      imageDPI,
    },
    pages,
  };
}

/**
 * Backfill pages-en.json for a single slug. Throws if the source PDF or
 * pages-ja.json is missing so the caller can decide whether to continue.
 *
 * @param {string} slug
 * @returns {Promise<{ pageCount: number, contentPages: number, outputPath: string }>}
 */
async function backfillSlug(slug) {
  const dataDir = join(PUBLIC_DIR, slug, 'data');
  const jaPath = join(dataDir, 'pages-ja.json');
  const enPath = join(dataDir, 'pages-en.json');

  if (!existsSync(jaPath)) {
    throw new Error(`pages-ja.json not found: ${jaPath}`);
  }

  const pdfPath = findSourcePdf(slug);
  if (!pdfPath) {
    throw new Error(`No source PDF under manual-pdf/${slug}/`);
  }

  const jaDoc = JSON.parse(readFileSync(jaPath, 'utf-8'));
  const { pageMap, total } = await extractPageTextMap(pdfPath);

  const jaCount = jaDoc.pages.length;
  if (total !== jaCount) {
    console.warn(
      `⚠️  ${slug}: PDF has ${total} pages, pages-ja.json has ${jaCount}. ` +
        `Using pages-ja.json as authoritative page list; missing pages will be empty.`,
    );
  }

  const enDoc = buildEnDoc(slug, jaDoc, pageMap);
  writeFileSync(enPath, JSON.stringify(enDoc, null, 2), 'utf-8');

  const contentPages = enDoc.pages.filter((p) => p.hasContent).length;
  return { pageCount: enDoc.pages.length, contentPages, outputPath: enPath };
}

async function main() {
  const { slug, allMissing } = parseArgs();

  if (!slug && !allMissing) {
    console.error('Usage: node scripts/backfill-pages-en.js --slug <slug>');
    console.error('       node scripts/backfill-pages-en.js --all-missing');
    process.exit(1);
  }

  const slugs = allMissing ? discoverMissingEnSlugs() : [slug];

  console.log('📘 Backfill pages-en.json');
  console.log('='.repeat(50));
  console.log(`📦 Manuals to process: ${slugs.length}`);
  console.log('');

  let succeeded = 0;
  const skipped = [];
  const failed = [];

  for (const s of slugs) {
    try {
      const result = await backfillSlug(s);
      console.log(
        `✅ ${s}: ${result.pageCount} pages (${result.contentPages} with content) → ${result.outputPath}`,
      );
      succeeded++;
    } catch (err) {
      // A genuinely missing source PDF is a skip, not a hard failure — we
      // expect some manuals to lack a processable PDF and we do NOT want
      // to commit an empty / placeholder pages-en.json for those.
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.startsWith('No source PDF')) {
        console.warn(`⚠️  ${s}: skipped — ${msg}`);
        skipped.push({ slug: s, reason: msg });
      } else {
        console.error(`❌ ${s}: ${msg}`);
        failed.push({ slug: s, reason: msg });
      }
    }
  }

  console.log('');
  console.log('='.repeat(50));
  console.log(
    `✨ Done — ${succeeded} succeeded, ${skipped.length} skipped, ${failed.length} failed`,
  );

  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('');
  console.error('❌ Unexpected error:');
  console.error(err);
  process.exit(1);
});
