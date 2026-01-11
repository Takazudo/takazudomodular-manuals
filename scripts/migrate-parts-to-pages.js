#!/usr/bin/env node
/**
 * Migration Script: Convert part-XX.json files to single pages.json
 *
 * For each manual:
 * 1. Read all part-XX.json files
 * 2. Extract and merge all pages into single array
 * 3. Write pages.json
 * 4. Update manifest.json (remove parts array)
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const MANUALS = [
  'oxi-one-mk2',
  'oxi-coral',
  'oxi-e16-manual',
  'oxi-e16-quick-start',
  'addac112-looper',
];

console.log('🔄 Starting migration: parts → pages.json\n');

for (const slug of MANUALS) {
  console.log(`📦 Migrating ${slug}...`);

  const dataDir = join('public', slug, 'data');

  if (!existsSync(dataDir)) {
    console.log(`   ⚠️  Directory not found: ${dataDir}, skipping`);
    continue;
  }

  // Read all part files
  const files = readdirSync(dataDir);
  const partFiles = files.filter((f) => f.startsWith('part-') && f.endsWith('.json')).sort();

  if (partFiles.length === 0) {
    console.log(`   ⚠️  No part files found in ${dataDir}, skipping`);
    continue;
  }

  let allPages = [];
  let metadata = null;

  for (const partFile of partFiles) {
    const partPath = join(dataDir, partFile);
    const partData = JSON.parse(readFileSync(partPath, 'utf-8'));
    allPages.push(...partData.pages);
    if (!metadata && partData.metadata) {
      metadata = partData.metadata;
    }
  }

  // Sort pages by pageNum to ensure correct order
  allPages.sort((a, b) => a.pageNum - b.pageNum);

  // Write pages.json
  const pagesData = {
    metadata: metadata || {
      processedAt: new Date().toISOString(),
      translationMethod: 'claude-code-subagent-page-by-page',
      imageFormat: 'png',
      imageDPI: 300,
    },
    pages: allPages,
  };

  const pagesPath = join(dataDir, 'pages.json');
  writeFileSync(pagesPath, JSON.stringify(pagesData, null, 2), 'utf-8');
  console.log(`   ✅ Created pages.json with ${allPages.length} pages`);

  // Update manifest.json (remove parts array)
  const manifestPath = join(dataDir, 'manifest.json');
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    delete manifest.parts;
    delete manifest._future_parts;
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
    console.log(`   ✅ Updated manifest.json (removed parts array)`);
  }

  console.log('');
}

console.log('✅ Migration complete!\n');
console.log('Next steps:');
console.log('1. Update lib/types/manual.ts');
console.log('2. Update lib/manual-registry.ts');
console.log('3. Update lib/manual-data.ts');
console.log('4. Run pnpm typecheck');
console.log('5. Test the application');
console.log('6. Delete old part-XX.json files');
