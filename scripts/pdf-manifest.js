#!/usr/bin/env node

/**
 * PDF Manifest Script
 * Generates master manifest.json from all part files
 *
 * Input: public/manuals/{slug}/data/part-*.json
 * Output: public/manuals/{slug}/data/manifest.json
 *
 * This script:
 * - Scans all part JSON files
 * - Extracts section information
 * - Calculates total pages
 * - Generates master index
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
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

const translationsDir = join(ROOT_DIR, config.output.translations);

// Check if translations directory exists
if (!existsSync(translationsDir)) {
  console.error(`❌ Translations directory not found: ${translationsDir}`);
  console.error('   Please run pdf:build first');
  process.exit(1);
}

console.log(`📁 Input directory: ${translationsDir}`);
console.log('');

// Get all part files
const partFiles = readdirSync(translationsDir)
  .filter((file) => file.startsWith('part-') && file.endsWith('.json'))
  .sort();

if (partFiles.length === 0) {
  console.error(`❌ No part files found in: ${translationsDir}`);
  console.error('   Please run pdf:build first');
  process.exit(1);
}

console.log(`📚 Found ${partFiles.length} part files`);
console.log('');

/**
 * Extract unique sections from a part
 */
function extractSections(partData) {
  const sections = new Set();

  for (const page of partData.pages) {
    if (page.sectionName) {
      sections.add(page.sectionName);
    }
  }

  return Array.from(sections);
}

/**
 * Process all part files and build manifest
 */
function buildManifest() {
  const parts = [];
  let totalPages = 0;
  let totalContentPages = 0;
  let earliestProcessedAt = null;

  for (const partFile of partFiles) {
    const partPath = join(translationsDir, partFile);
    const partNum = partFile.match(/part-(\d+)\.json/)?.[1];

    if (!partNum) {
      console.error(`   ❌ Invalid part filename: ${partFile}`);
      continue;
    }

    console.log(`📄 Processing ${partFile}...`);

    try {
      const partData = JSON.parse(readFileSync(partPath, 'utf-8'));

      const sections = extractSections(partData);
      const contentPages = partData.pages.filter((p) => p.hasContent).length;

      const partEntry = {
        part: partData.part,
        pageRange: partData.pageRange,
        file: `/manuals/${config.slug}/data/part-${partNum}.json`,
        sections: sections,
        totalPages: partData.totalPages,
        contentPages: contentPages,
      };

      parts.push(partEntry);

      totalPages += partData.totalPages;
      totalContentPages += contentPages;

      // Track earliest processing time
      if (partData.metadata?.processedAt) {
        const processedAt = new Date(partData.metadata.processedAt);
        if (!earliestProcessedAt || processedAt < earliestProcessedAt) {
          earliestProcessedAt = processedAt;
        }
      }

      console.log(
        `   ✅ Pages ${partData.pageRange[0]}-${partData.pageRange[1]} (${contentPages} with content)`,
      );
    } catch (error) {
      console.error(`   ❌ Error reading ${partFile}:`, error.message);
    }
  }

  console.log('');
  console.log('='.repeat(50));

  // Build manifest
  const manifest = {
    title: slugToTitle(config.slug),
    version: '1.0.0',
    totalPages: totalPages,
    contentPages: totalContentPages,
    lastUpdated: new Date().toISOString(),
    source: {
      filename: basename(config.sourcePdf),
      processedAt: earliestProcessedAt
        ? earliestProcessedAt.toISOString()
        : new Date().toISOString(),
      imageDPI: config.settings.imageDPI,
      imageFormat: config.settings.imageFormat,
    },
    parts: parts,
  };

  return manifest;
}

// Generate manifest
const manifest = buildManifest();

// Write manifest file
const manifestPath = join(translationsDir, 'manifest.json');
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

console.log(`✨ Manifest generated successfully!`);
console.log('');
console.log(`📊 Summary:`);
console.log(`   Total parts: ${manifest.parts.length}`);
console.log(`   Total pages: ${manifest.totalPages}`);
console.log(`   Content pages: ${manifest.contentPages}`);
console.log(`   Version: ${manifest.version}`);
console.log('');
console.log(`📁 Output: ${manifestPath}`);
console.log('');
console.log('✅ PDF processing pipeline complete!');
console.log('   Next.js can now consume this data from data/translations/');
