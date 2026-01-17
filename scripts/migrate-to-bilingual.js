#!/usr/bin/env node

/**
 * Migration Script: Convert pages.json to bilingual format
 *
 * This script migrates existing pages.json files to the new bilingual format:
 * - Renames pages.json → pages-ja.json
 * - Converts 'translation' field → 'content' field
 * - Adds 'language: ja' to metadata
 * - Creates pages-en.json from extracted text (if available)
 *
 * Usage: node scripts/migrate-to-bilingual.js
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, renameSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');
const PUBLIC_DIR = join(ROOT_DIR, 'public');

console.log('🔄 Migration Script: Convert to Bilingual Format');
console.log('='.repeat(60));
console.log('');

// Find all manual directories
const manualDirs = readdirSync(PUBLIC_DIR, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name)
  .filter((name) => !name.startsWith('.')); // Ignore hidden dirs

console.log(`📚 Found ${manualDirs.length} manual directories`);
console.log('');

let migratedCount = 0;
let skippedCount = 0;
let errorCount = 0;

for (const manualId of manualDirs) {
  const dataDir = join(PUBLIC_DIR, manualId, 'data');
  const oldPagesPath = join(dataDir, 'pages.json');
  const newJaPath = join(dataDir, 'pages-ja.json');
  const newEnPath = join(dataDir, 'pages-en.json');

  // Check if data directory exists
  if (!existsSync(dataDir)) {
    console.log(`   ⏭️  ${manualId}: No data directory, skipping`);
    skippedCount++;
    continue;
  }

  // Check if already migrated (pages-ja.json exists)
  if (existsSync(newJaPath)) {
    console.log(`   ✅ ${manualId}: Already migrated (pages-ja.json exists)`);
    skippedCount++;
    continue;
  }

  // Check if old pages.json exists
  if (!existsSync(oldPagesPath)) {
    console.log(`   ⏭️  ${manualId}: No pages.json found, skipping`);
    skippedCount++;
    continue;
  }

  try {
    // Read old pages.json
    const oldData = JSON.parse(readFileSync(oldPagesPath, 'utf-8'));

    // Convert to new Japanese format
    const jaData = {
      metadata: {
        ...oldData.metadata,
        language: 'ja',
      },
      pages: oldData.pages.map((page) => ({
        pageNum: page.pageNum,
        image: page.image,
        title: page.title,
        sectionName: page.sectionName,
        content: page.translation || '', // Rename translation → content
        hasContent: page.hasContent,
        tags: page.tags || [],
      })),
    };

    // Write pages-ja.json
    writeFileSync(newJaPath, JSON.stringify(jaData, null, 2), 'utf-8');
    console.log(`   ✅ ${manualId}: Created pages-ja.json`);

    // Try to create pages-en.json from extracted text
    const extractedDir = join(PUBLIC_DIR, manualId, 'processing', 'extracted');
    if (existsSync(extractedDir)) {
      const extractedFiles = readdirSync(extractedDir)
        .filter((f) => f.startsWith('page-') && f.endsWith('.txt'))
        .sort();

      if (extractedFiles.length > 0) {
        const enPages = jaData.pages.map((page) => {
          const txtFile = `page-${String(page.pageNum).padStart(3, '0')}.txt`;
          const txtPath = join(extractedDir, txtFile);
          const content = existsSync(txtPath) ? readFileSync(txtPath, 'utf-8').trim() : '';

          return {
            pageNum: page.pageNum,
            image: page.image,
            title: page.title,
            sectionName: page.sectionName,
            content: content,
            hasContent: !!(content && content.trim()),
            tags: page.tags || [],
          };
        });

        const enData = {
          metadata: {
            processedAt: new Date().toISOString(),
            language: 'en',
            extractionMethod: 'pdf-parse',
            imageFormat: jaData.metadata.imageFormat,
            imageDPI: jaData.metadata.imageDPI,
          },
          pages: enPages,
        };

        writeFileSync(newEnPath, JSON.stringify(enData, null, 2), 'utf-8');
        console.log(
          `   ✅ ${manualId}: Created pages-en.json (from ${extractedFiles.length} extracted files)`,
        );
      }
    }

    // Remove old pages.json (optional - comment out to keep backup)
    // unlinkSync(oldPagesPath);
    // console.log(`   🗑️  ${manualId}: Removed old pages.json`);

    migratedCount++;
  } catch (error) {
    console.log(`   ❌ ${manualId}: Error - ${error.message}`);
    errorCount++;
  }
}

console.log('');
console.log('='.repeat(60));
console.log('📊 Migration Summary:');
console.log(`   ✅ Migrated: ${migratedCount}`);
console.log(`   ⏭️  Skipped: ${skippedCount}`);
console.log(`   ❌ Errors: ${errorCount}`);
console.log('');

if (migratedCount > 0) {
  console.log('⚠️  Next steps:');
  console.log('   1. Update lib/manual-registry.ts to import from pages-ja.json');
  console.log('   2. Delete old pages.json files (if migration successful)');
  console.log('   3. Run pnpm typecheck to verify');
  console.log('   4. Run pnpm build to test');
}
