#!/usr/bin/env node

/**
 * pdf-md-to-html.js — Convert each page's `content` markdown to `contentHtml`
 * and write it alongside `content` in `pages-{ja,en}.json`.
 *
 * PLACEMENT: This step runs AFTER `pdf:clean-en` (which rewrites EN content),
 * BEFORE `pdf:manifest`. It reads the FINAL committed JSON files and adds the
 * `contentHtml` field deterministically — re-running is idempotent.
 *
 * Pipeline: unified + remark-parse + remark-gfm + remark-rehype + rehype-slug
 *           + rehype-highlight + rehype-stringify
 *
 * This mirrors `components/markdown-renderer.tsx` which uses:
 *   - remark-gfm (GFM tables, strikethrough, task lists)
 *   - rehype-slug (heading anchor IDs via `id` attributes)
 *   - rehype-highlight (code syntax highlighting via `hljs` classes)
 *
 * Structural deviations from react-markdown custom components (intentional):
 *   - <table> is NOT wrapped in <div role="region"> (Table component adds this)
 *   - <h2>/<h3> have no extra <span> or anchor-link children (H2/H3 add decorative spans)
 *   - <a> does NOT get target="_blank" on external links (A component adds this)
 *   - No Tailwind CSS classNames on any element (Sub 2's prose CSS targets elements)
 * Sub 4's island relies on prose CSS, not custom React components, so raw HTML is correct.
 *
 * Usage:
 *   node scripts/pdf-md-to-html.js --slug oxi-one-mk2
 *   node scripts/pdf-md-to-html.js --all
 *   pnpm run pdf:md-to-html --slug oxi-one-mk2
 *   pnpm run pdf:md-to-html:all
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Unified pipeline imports (all pinned in devDependencies)
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const ROOT_DIR = join(__dirname, '..');
const PUBLIC_DIR = join(ROOT_DIR, 'public');

// --------------------------------------------------------------------------
// Build the unified processor ONCE and reuse — process() calls are stateless
// --------------------------------------------------------------------------

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSlug)
  .use(rehypeHighlight)
  .use(rehypeStringify);

/**
 * Convert a markdown string to HTML using the unified pipeline.
 * Returns an empty string for empty/whitespace-only input.
 *
 * @param {string} markdown
 * @returns {Promise<string>} HTML string
 */
export async function markdownToHtml(markdown) {
  if (!markdown || !markdown.trim()) return '';
  const result = await processor.process(markdown);
  return String(result);
}

/**
 * Discover candidate manual slugs by scanning direct children of `publicDir`.
 * Returns only directory names that contain a `data/pages-ja.json` file.
 *
 * @param {string} publicDir
 * @returns {string[]} sorted list of manual slugs
 */
export function discoverManualSlugs(publicDir) {
  if (!existsSync(publicDir)) return [];

  const entries = readdirSync(publicDir);
  const slugs = [];

  for (const name of entries) {
    const abs = join(publicDir, name);
    let st;
    try {
      st = statSync(abs);
    } catch {
      continue;
    }
    if (!st.isDirectory()) continue;
    const pagesPath = join(abs, 'data', 'pages-ja.json');
    if (!existsSync(pagesPath)) continue;
    slugs.push(name);
  }

  slugs.sort();
  return slugs;
}

/**
 * Add `contentHtml` to every page in a pages JSON document.
 * Pages where `hasContent === false` get `contentHtml: ""`.
 *
 * @param {object} pagesDoc - parsed pages-{lang}.json
 * @returns {Promise<{ doc: object, converted: number }>} updated doc + count
 */
export async function addContentHtml(pagesDoc) {
  let converted = 0;
  const updatedPages = await Promise.all(
    pagesDoc.pages.map(async (page) => {
      const html = page.hasContent ? await markdownToHtml(page.content) : '';
      if (page.hasContent) converted++;
      return { ...page, contentHtml: html };
    }),
  );
  return {
    doc: { ...pagesDoc, pages: updatedPages },
    converted,
  };
}

/**
 * Process a single manual slug: read both pages-ja.json and pages-en.json,
 * add `contentHtml` to every page, and write the files back.
 *
 * @param {string} rootDir
 * @param {string} slug
 * @returns {Promise<{ ja: number, en: number }>} counts of converted pages
 */
export async function processSlug(rootDir, slug) {
  const dataDir = join(rootDir, 'public', slug, 'data');

  const jaPath = join(dataDir, 'pages-ja.json');
  const enPath = join(dataDir, 'pages-en.json');

  let jaConverted = 0;
  let enConverted = 0;

  if (existsSync(jaPath)) {
    const jaDoc = JSON.parse(readFileSync(jaPath, 'utf-8'));
    const { doc: updatedJa, converted } = await addContentHtml(jaDoc);
    writeFileSync(jaPath, JSON.stringify(updatedJa, null, 2), 'utf-8');
    jaConverted = converted;
  }

  if (existsSync(enPath)) {
    const enDoc = JSON.parse(readFileSync(enPath, 'utf-8'));
    const { doc: updatedEn, converted } = await addContentHtml(enDoc);
    writeFileSync(enPath, JSON.stringify(updatedEn, null, 2), 'utf-8');
    enConverted = converted;
  }

  return { ja: jaConverted, en: enConverted };
}

// --------------------------------------------------------------------------
// CLI entrypoint — only runs when invoked directly, not when imported by tests.
// --------------------------------------------------------------------------

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  const args = process.argv.slice(2);
  const allFlag = args.includes('--all');
  const slugIdx = args.indexOf('--slug');
  const slug = slugIdx !== -1 ? args[slugIdx + 1] : null;

  if (!allFlag && !slug) {
    console.error('Usage: node scripts/pdf-md-to-html.js --slug <slug>');
    console.error('       node scripts/pdf-md-to-html.js --all');
    process.exit(1);
  }

  const slugs = allFlag ? discoverManualSlugs(PUBLIC_DIR) : [slug];

  console.log('📝 Markdown → HTML converter');
  console.log('='.repeat(50));
  if (allFlag) {
    console.log(`📦 Discovered ${slugs.length} manual(s) under public/`);
  } else {
    console.log(`📦 Manual: ${slug}`);
  }
  console.log('');

  let totalJa = 0;
  let totalEn = 0;
  let totalManuals = 0;

  try {
    for (const s of slugs) {
      const result = await processSlug(ROOT_DIR, s);
      console.log(`[md-to-html] ${s}: ja=${result.ja} pages, en=${result.en} pages converted`);
      totalJa += result.ja;
      totalEn += result.en;
      totalManuals++;
    }

    console.log('');
    console.log('='.repeat(50));
    if (allFlag) {
      console.log(
        `✨ Done! Processed ${totalManuals} manual(s): ${totalJa} JA pages, ${totalEn} EN pages`,
      );
    } else {
      console.log(`✨ Done! ${totalJa} JA pages, ${totalEn} EN pages converted for ${slug}`);
    }
    console.log('Next step: Run pdf:manifest to generate manifest.json');
  } catch (err) {
    console.error('');
    console.error('❌ Error during markdown → HTML conversion:');
    console.error(err);
    process.exit(1);
  }
}
