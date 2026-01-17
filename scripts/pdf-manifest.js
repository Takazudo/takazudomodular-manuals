#!/usr/bin/env node

/**
 * PDF Manifest Script
 * Generates master manifest.json from pages.json
 *
 * Input: public/{slug}/data/pages.json
 * Output: public/{slug}/data/manifest.json
 *
 * This script:
 * - Reads pages.json file
 * - Calculates total pages and content pages
 * - Generates master manifest
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { resolveManualConfig } from './lib/pdf-config-resolver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// Load configuration from shared resolver
const config = resolveManualConfig(ROOT_DIR);

/**
 * Convert slug to manual title
 * @param {string} slug - Manual slug (e.g., 'oxi-one-mk2')
 * @returns {string} Manual title (e.g., 'OXI ONE MKII Manual')
 */
function slugToTitle(slug) {
  const titleMap = {
    'oxi-one-mk2': 'OXI ONE MKII Manual',
    'oxi-coral': 'OXI Coral Manual',
  };

  return titleMap[slug] || slug.toUpperCase().replace(/-/g, ' ') + ' Manual';
}

console.log('📋 PDF Manifest Generator');
console.log('='.repeat(50));
console.log(`📦 Manual: ${config.slug}`);
console.log('');

const dataDir = join(ROOT_DIR, config.output.data);
const pagesPath = join(dataDir, 'pages-ja.json');

// Check if pages.json exists
if (!existsSync(pagesPath)) {
  console.error(`❌ pages.json not found: ${pagesPath}`);
  console.error('   Please run pdf:build first');
  process.exit(1);
}

console.log(`📁 Input file: ${pagesPath}`);
console.log('');

/**
 * Process pages.json and build manifest
 */
function buildManifest() {
  console.log(`📄 Processing pages.json...`);

  try {
    const pagesData = JSON.parse(readFileSync(pagesPath, 'utf-8'));

    const totalPages = pagesData.pages.length;
    const contentPages = pagesData.pages.filter((p) => p.hasContent).length;
    const processedAt = pagesData.metadata?.processedAt || new Date().toISOString();

    console.log(`   ✅ Found ${totalPages} pages (${contentPages} with content)`);
    console.log('');
    console.log('='.repeat(50));

    // Build manifest
    const manifest = {
      title: slugToTitle(config.slug),
      version: '1.0.0',
      totalPages: totalPages,
      contentPages: contentPages,
      lastUpdated: new Date().toISOString(),
      source: {
        filename: basename(config.sourcePdf),
        processedAt: processedAt,
        imageDPI: config.settings.imageDPI,
        imageFormat: config.settings.imageFormat,
      },
    };

    return manifest;
  } catch (error) {
    console.error(`   ❌ Error reading pages.json:`, error.message);
    process.exit(1);
  }
}

// Generate manifest
const manifest = buildManifest();

// Write manifest file
const manifestPath = join(dataDir, 'manifest.json');
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

console.log(`✨ Manifest generated successfully!`);
console.log('');
console.log(`📊 Summary:`);
console.log(`   Total pages: ${manifest.totalPages}`);
console.log(`   Content pages: ${manifest.contentPages}`);
console.log(`   Version: ${manifest.version}`);
console.log('');
console.log(`📁 Output: ${manifestPath}`);
console.log('');
console.log('✅ PDF processing pipeline complete!');
console.log('   Next.js can now consume this data from public/{slug}/data/');
