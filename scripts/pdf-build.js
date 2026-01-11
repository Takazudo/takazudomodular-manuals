#!/usr/bin/env node

/**
 * PDF Build Script - Page by Page
 * Combines individual page translations into a single pages.json file
 *
 * Input: public/{slug}/processing/translations-draft/page-*.json
 * Output: public/{slug}/data/pages.json
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { resolveManualConfig } from './lib/pdf-config-resolver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// Load configuration from shared resolver
const config = resolveManualConfig(ROOT_DIR);

console.log('🔨 PDF Build Script (Page by Page)');
console.log('='.repeat(50));
console.log(`📦 Manual: ${config.slug}`);
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

// Sort by pageNum to ensure correct order
pages.sort((a, b) => a.pageNum - b.pageNum);

console.log(`📊 Total pages: ${pages.length}`);
console.log('');

try {
  // Build page objects
  const pageObjects = pages.map((pageData) => {
    const pageNum = pageData.pageNum;

    return {
      pageNum: pageNum,
      image: `/${config.slug}/pages/page-${String(pageNum).padStart(3, '0')}.png`,
      title: `Page ${pageNum}`,
      sectionName: null,
      translation: pageData.translation || '',
      hasContent: !!(pageData.translation && pageData.translation.trim()),
      tags: [],
    };
  });

  // Build output
  const output = {
    metadata: {
      processedAt: new Date().toISOString(),
      translationMethod: 'claude-code-subagent-page-by-page',
      imageFormat: config.settings.imageFormat,
      imageDPI: config.settings.imageDPI,
    },
    pages: pageObjects,
  };

  // Write output file
  const outputPath = join(outputDir, 'pages.json');
  writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

  const contentPages = pageObjects.filter((p) => p.hasContent).length;
  console.log(`✅ Created ${outputPath}`);
  console.log(`📊 Total pages: ${pages.length}, Content pages: ${contentPages}`);
  console.log('');

  console.log('='.repeat(50));
  console.log(`✨ Build complete!`);
  console.log(`📁 Output location: ${outputPath}`);
  console.log('');
  console.log('Next step: Run pdf:manifest to generate manifest.json');
} catch (error) {
  console.error(`❌ Error building pages.json:`, error.message);
  process.exit(1);
}
