#!/usr/bin/env node

/**
 * PDF Build Script - Page by Page
 * Combines individual page translations into part JSON files
 *
 * Input: data/translations-draft/page-*.json
 * Output: data/translations/part-01.json, part-02.json, etc.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// Load configuration
const config = JSON.parse(readFileSync(join(ROOT_DIR, 'pdf-config.json'), 'utf-8'));

console.log('🔨 PDF Build Script (Page by Page)');
console.log('='.repeat(50));
console.log('');

const draftsDir = join(ROOT_DIR, config.output.translationsDraft);
const outputDir = join(ROOT_DIR, config.output.translations);

// Check if drafts directory exists
if (!existsSync(draftsDir)) {
  console.error(`❌ Drafts directory not found: ${draftsDir}`);
  console.error('   Please run translation first');
  process.exit(1);
}

// Create output directory
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

console.log(`📁 Input directory: ${draftsDir}`);
console.log(`📁 Output directory: ${outputDir}`);
console.log('');

// Get all page JSON files
const pageFiles = readdirSync(draftsDir)
  .filter((file) => file.startsWith('page-') && file.endsWith('.json'))
  .sort();

if (pageFiles.length === 0) {
  console.error(`❌ No page JSON files found in: ${draftsDir}`);
  console.error('   Please run translation first');
  process.exit(1);
}

console.log(`📚 Found ${pageFiles.length} page translation files`);
console.log('');

// Read all pages
const pages = [];
for (const pageFile of pageFiles) {
  const pagePath = join(draftsDir, pageFile);
  const pageData = JSON.parse(readFileSync(pagePath, 'utf-8'));
  pages.push(pageData);
}

// Group pages into parts based on config
const pagesPerPart = config.settings.pagesPerPart;
const partCount = Math.ceil(pages.length / pagesPerPart);

console.log(`📊 Total pages: ${pages.length}`);
console.log(`📦 Pages per part: ${pagesPerPart}`);
console.log(`📁 Parts to create: ${partCount}`);
console.log('');

let successCount = 0;
let failCount = 0;

// Create parts
for (let partIndex = 0; partIndex < partCount; partIndex++) {
  const partNum = String(partIndex + 1).padStart(2, '0');
  const startIdx = partIndex * pagesPerPart;
  const endIdx = Math.min(startIdx + pagesPerPart, pages.length);
  const partPages = pages.slice(startIdx, endIdx);

  console.log(`📄 Processing part-${partNum} (pages ${startIdx + 1}-${endIdx})...`);

  try {
    // Build page objects for this part
    const pageObjects = partPages.map((pageData) => {
      const pageNum = pageData.pageNum;

      return {
        pageNum: pageNum,
        image: `/manual/pages/page-${String(pageNum).padStart(3, '0')}.png`,
        title: `Page ${pageNum}`,
        sectionName: null,
        translation: pageData.translation || '',
        hasContent: !!(pageData.translation && pageData.translation.trim()),
        tags: [],
      };
    });

    // Build part output
    const output = {
      part: partNum,
      pageRange: [partPages[0].pageNum, partPages[partPages.length - 1].pageNum],
      totalPages: partPages.length,
      metadata: {
        processedAt: new Date().toISOString(),
        translationMethod: 'claude-code-subagent-page-by-page',
        imageFormat: config.settings.imageFormat,
        imageDPI: config.settings.imageDPI,
      },
      pages: pageObjects,
    };

    // Write output file
    const outputPath = join(outputDir, `part-${partNum}.json`);
    writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

    const contentPages = pageObjects.filter((p) => p.hasContent).length;
    console.log(`   ✅ Created ${outputPath}`);
    console.log(`   📊 Pages: ${partPages.length}, Content pages: ${contentPages}`);
    console.log('');

    successCount++;
  } catch (error) {
    console.error(`   ❌ Error processing part-${partNum}:`, error.message);
    failCount++;
  }
}

console.log('='.repeat(50));
console.log(`✨ Build complete!`);
console.log(`   ✅ Success: ${successCount} parts`);
if (failCount > 0) {
  console.log(`   ❌ Failed: ${failCount} parts`);
}
console.log(`📁 Output location: ${outputDir}`);
console.log('');
console.log('Next step: Run pdf:manifest to generate manifest.json');
