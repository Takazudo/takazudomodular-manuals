#!/usr/bin/env node

/**
 * PDF Build Script - Page by Page
 * Combines individual page translations into pages-ja.json and pages-en.json files
 *
 * Input:
 *   - temp-processing/{slug}/extracted/page-*.txt (English)
 *   - temp-processing/{slug}/translations-draft/page-*.json (Japanese +
 *     optional cleaned English in the `en_clean` field)
 * Output:
 *   - public/{slug}/data/pages-ja.json (Japanese translations)
 *   - public/{slug}/data/pages-en.json (Original English text)
 *
 * EN source precedence (per page):
 *   1. `translationData.en_clean` from the translation-draft JSON — this is
 *      the clean EN emitted up-front by the manual-translator agent.
 *   2. Fallback: raw `extractedMap.get(pageNum)` text from pdf-parse.
 *
 * Existing manuals whose translation drafts predate the `en_clean` field
 * continue to build exactly as before via the fallback.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { resolveManualConfig } from './lib/pdf-config-resolver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const ROOT_DIR = join(__dirname, '..');

// --------------------------------------------------------------------------
// Pure helpers (exported for tests)
// --------------------------------------------------------------------------

/**
 * Build the Japanese page objects from the given sorted page numbers, the
 * translations map (parsed translation-draft JSON per page), and the manual
 * slug.
 *
 * @param {number[]} sortedPageNums - ascending page numbers to emit
 * @param {Map<number, object>} translationsMap - pageNum -> translation draft
 * @param {string} slug - manual slug (used to build the image URL)
 * @returns {object[]} ja page objects (shape matches pages-ja.json entries)
 */
export function buildJaPages(sortedPageNums, translationsMap, slug) {
  return sortedPageNums.map((pageNum) => {
    const translationData = translationsMap.get(pageNum);
    const content = translationData?.translation || '';

    return {
      pageNum: pageNum,
      image: `/${slug}/pages/page-${String(pageNum).padStart(3, '0')}.png`,
      title: `Page ${pageNum}`,
      sectionName: null,
      content: content,
      hasContent: !!(content && content.trim()),
      tags: [],
    };
  });
}

/**
 * Build the English page objects. Prefers `translationData.en_clean` (clean
 * EN emitted by the translator agent) over the raw extracted text; falls
 * back to the raw extracted text when `en_clean` is missing or empty so
 * pre-existing manuals keep building correctly.
 *
 * @param {number[]} sortedPageNums - ascending page numbers to emit
 * @param {Map<number, object>} translationsMap - pageNum -> translation draft
 * @param {Map<number, string>} extractedMap - pageNum -> raw extracted text
 * @param {string} slug - manual slug (used to build the image URL)
 * @returns {{ pages: object[], sources: { enClean: number, rawExtract: number } }}
 */
export function buildEnPages(sortedPageNums, translationsMap, extractedMap, slug) {
  let enCleanCount = 0;
  let rawExtractCount = 0;

  const pages = sortedPageNums.map((pageNum) => {
    const translationData = translationsMap.get(pageNum);
    const cleanEn = translationData?.en_clean;
    let content;
    if (typeof cleanEn === 'string' && cleanEn.length > 0) {
      content = cleanEn;
      enCleanCount += 1;
    } else {
      content = extractedMap.get(pageNum) || '';
      rawExtractCount += 1;
    }

    return {
      pageNum: pageNum,
      image: `/${slug}/pages/page-${String(pageNum).padStart(3, '0')}.png`,
      title: `Page ${pageNum}`,
      sectionName: null,
      content: content,
      hasContent: !!(content && content.trim()),
      tags: [],
    };
  });

  return { pages, sources: { enClean: enCleanCount, rawExtract: rawExtractCount } };
}

// --------------------------------------------------------------------------
// CLI entrypoint — only runs when invoked directly, not when imported by tests.
// --------------------------------------------------------------------------

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  const config = resolveManualConfig(ROOT_DIR);

  console.log('🔨 PDF Build Script (Bilingual - Page by Page)');
  console.log('='.repeat(50));
  console.log(`📦 Manual: ${config.slug}`);
  console.log('');

  const extractedDir = join(ROOT_DIR, config.output.extracted);
  const draftsDir = join(ROOT_DIR, config.output.translationsDraft);
  const outputDir = join(ROOT_DIR, config.output.data);

  // Check if directories exist
  if (!existsSync(draftsDir)) {
    console.error(`❌ Translations draft directory not found: ${draftsDir}`);
    console.error('   Please run translation first');
    process.exit(1);
  }

  if (!existsSync(extractedDir)) {
    console.error(`❌ Extracted text directory not found: ${extractedDir}`);
    console.error('   Please run extraction first');
    process.exit(1);
  }

  // Create output directory
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  console.log(`📁 Extracted text (EN): ${extractedDir}`);
  console.log(`📁 Translations (JA): ${draftsDir}`);
  console.log(`📁 Output directory: ${outputDir}`);
  console.log('');

  // Get all translation JSON files
  const translationFiles = readdirSync(draftsDir)
    .filter((file) => file.startsWith('page-') && file.endsWith('.json'))
    .sort();

  // Get all extracted text files
  const extractedFiles = readdirSync(extractedDir)
    .filter((file) => file.startsWith('page-') && file.endsWith('.txt'))
    .sort();

  if (translationFiles.length === 0) {
    console.error(`❌ No translation JSON files found in: ${draftsDir}`);
    console.error('   Please run translation first');
    process.exit(1);
  }

  console.log(`📚 Found ${translationFiles.length} translation files`);
  console.log(`📚 Found ${extractedFiles.length} extracted text files`);
  console.log('');

  // Read all translations (Japanese + optional en_clean)
  const translationsMap = new Map();
  for (const file of translationFiles) {
    const filePath = join(draftsDir, file);
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    translationsMap.set(data.pageNum, data);
  }

  // Read all extracted text (English)
  const extractedMap = new Map();
  for (const file of extractedFiles) {
    const filePath = join(extractedDir, file);
    const pageNum = parseInt(file.match(/page-(\d+)\.txt/)?.[1] || '0');
    const text = readFileSync(filePath, 'utf-8').trim();
    extractedMap.set(pageNum, text);
  }

  // Determine total pages (use the larger of the two)
  const allPageNums = new Set([...translationsMap.keys(), ...extractedMap.keys()]);
  const sortedPageNums = [...allPageNums].sort((a, b) => a - b);

  console.log(`📊 Total pages: ${sortedPageNums.length}`);
  console.log('');

  try {
    const jaPages = buildJaPages(sortedPageNums, translationsMap, config.slug);
    const { pages: enPages, sources } = buildEnPages(
      sortedPageNums,
      translationsMap,
      extractedMap,
      config.slug,
    );

    // Build output for Japanese
    const jaOutput = {
      metadata: {
        processedAt: new Date().toISOString(),
        language: 'ja',
        translationMethod: 'claude-code-subagent-page-by-page',
        imageFormat: config.settings.imageFormat,
        imageDPI: config.settings.imageDPI,
      },
      pages: jaPages,
    };

    // Build output for English
    const enOutput = {
      metadata: {
        processedAt: new Date().toISOString(),
        language: 'en',
        extractionMethod: 'pdf-parse',
        imageFormat: config.settings.imageFormat,
        imageDPI: config.settings.imageDPI,
      },
      pages: enPages,
    };

    // Write Japanese output file
    const jaOutputPath = join(outputDir, 'pages-ja.json');
    writeFileSync(jaOutputPath, JSON.stringify(jaOutput, null, 2), 'utf-8');

    // Write English output file
    const enOutputPath = join(outputDir, 'pages-en.json');
    writeFileSync(enOutputPath, JSON.stringify(enOutput, null, 2), 'utf-8');

    const jaContentPages = jaPages.filter((p) => p.hasContent).length;
    const enContentPages = enPages.filter((p) => p.hasContent).length;

    console.log(`✅ Created ${jaOutputPath}`);
    console.log(`   Total pages: ${jaPages.length}, Content pages: ${jaContentPages}`);
    console.log('');
    console.log(`✅ Created ${enOutputPath}`);
    console.log(`   Total pages: ${enPages.length}, Content pages: ${enContentPages}`);
    console.log(
      `   EN source: ${sources.enClean} pages from translator en_clean, ${sources.rawExtract} pages from raw extract`,
    );
    console.log('');

    console.log('='.repeat(50));
    console.log(`✨ Build complete!`);
    console.log(`📁 Output location: ${outputDir}`);
    console.log('');
    console.log('Generated files:');
    console.log(`  - pages-ja.json (Japanese translations)`);
    console.log(`  - pages-en.json (Original English text)`);
    console.log('');
    console.log('Next step: Run pdf:manifest to generate manifest.json');
  } catch (error) {
    console.error(`❌ Error building pages JSON files:`, error.message);
    process.exit(1);
  }
}
