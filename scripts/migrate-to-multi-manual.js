#!/usr/bin/env node

/**
 * Migration script: Single manual → Multi-manual structure
 *
 * Migrates files from legacy structure to new multi-manual structure:
 * - /data/translations/* → /public/oxi-one-mk2/data/*
 * - /public/manual/pages/* → /public/oxi-one-mk2/pages/*
 * - /data/extracted/* → /public/oxi-one-mk2/processing/extracted/*
 * - /data/translations-draft/* → /public/oxi-one-mk2/processing/translations-draft/*
 *
 * Also updates image paths in JSON files from /manual/pages/ → /manuals/oxi-one-mk2/pages/
 *
 * Usage:
 *   node scripts/migrate-to-multi-manual.js --dry-run  # Preview changes
 *   node scripts/migrate-to-multi-manual.js            # Execute migration
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, cpSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');

const DRY_RUN = process.argv.includes('--dry-run');
const MANUAL_ID = 'oxi-one-mk2';

console.log('========================================');
console.log('Multi-Manual Migration Script');
console.log('========================================');
console.log(`Mode: ${DRY_RUN ? 'DRY RUN (preview only)' : 'EXECUTE'}`);
console.log(`Manual ID: ${MANUAL_ID}`);
console.log('');

// Migration mapping
const MIGRATIONS = [
  {
    name: 'Translation JSON files',
    from: 'data/translations',
    to: `public/${MANUAL_ID}/data`,
    pattern: '*.json',
  },
  {
    name: 'Page images',
    from: 'public/manual/pages',
    to: `public/${MANUAL_ID}/pages`,
    pattern: '*.png',
  },
  {
    name: 'Extracted text (processing)',
    from: 'data/extracted',
    to: `public/${MANUAL_ID}/processing/extracted`,
    pattern: '*.txt',
  },
  {
    name: 'Translation drafts (processing)',
    from: 'data/translations-draft',
    to: `public/${MANUAL_ID}/processing/translations-draft`,
    pattern: '*.json',
  },
];

/**
 * Get all files in a directory matching a pattern
 */
function getFiles(dir, pattern) {
  const fullPath = join(ROOT_DIR, dir);

  try {
    const entries = readdirSync(fullPath);
    const files = entries.filter((entry) => {
      const entryPath = join(fullPath, entry);
      const stat = statSync(entryPath);

      // Match pattern
      if (pattern === '*.json') return stat.isFile() && entry.endsWith('.json');
      if (pattern === '*.png') return stat.isFile() && entry.endsWith('.png');
      if (pattern === '*.txt') return stat.isFile() && entry.endsWith('.txt');

      return stat.isFile();
    });

    return files;
  } catch (error) {
    // Directory doesn't exist
    return [];
  }
}

/**
 * Create directory if it doesn't exist
 */
function ensureDir(dir) {
  const fullPath = join(ROOT_DIR, dir);

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would create directory: ${dir}`);
    return;
  }

  mkdirSync(fullPath, { recursive: true });
  console.log(`  ✓ Created directory: ${dir}`);
}

/**
 * Move file from source to destination
 */
function moveFile(fromDir, toDir, filename) {
  const fromPath = join(ROOT_DIR, fromDir, filename);
  const toPath = join(ROOT_DIR, toDir, filename);

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would move: ${fromDir}/${filename} → ${toDir}/${filename}`);
    return;
  }

  // Use copy + delete instead of rename for cross-filesystem compatibility
  cpSync(fromPath, toPath);
  rmSync(fromPath, { force: true });
  console.log(`  ✓ Moved: ${filename}`);
}

/**
 * Update image paths in JSON files
 */
function updateImagePaths() {
  console.log('\n📝 Updating image paths in JSON files...');

  const jsonDir = DRY_RUN ? 'data/translations' : `public/${MANUAL_ID}/data`;
  const jsonFiles = getFiles(jsonDir, '*.json');

  for (const filename of jsonFiles) {
    const fullPath = join(ROOT_DIR, jsonDir, filename);

    try {
      const content = readFileSync(fullPath, 'utf-8');
      const updated = content.replace(/\/manual\/pages\//g, `/manuals/${MANUAL_ID}/pages/`);

      if (content !== updated) {
        if (DRY_RUN) {
          console.log(`  [DRY RUN] Would update paths in: ${filename}`);
        } else {
          writeFileSync(fullPath, updated, 'utf-8');
          console.log(`  ✓ Updated paths in: ${filename}`);
        }
      }
    } catch (error) {
      console.error(`  ✗ Error updating ${filename}:`, error.message);
    }
  }
}

/**
 * Main migration function
 */
function migrate() {
  console.log('Starting migration...\n');

  // Execute each migration
  for (const migration of MIGRATIONS) {
    console.log(`\n📦 ${migration.name}`);
    console.log(`   From: ${migration.from}`);
    console.log(`   To:   ${migration.to}`);

    // Get files to migrate
    const files = getFiles(migration.from, migration.pattern);

    if (files.length === 0) {
      console.log(`   ⚠️  No files found in ${migration.from}`);
      continue;
    }

    console.log(`   Found ${files.length} files`);

    // Create destination directory
    ensureDir(migration.to);

    // Move each file
    for (const file of files) {
      moveFile(migration.from, migration.to, file);
    }
  }

  // Update image paths in JSON files
  updateImagePaths();

  // Summary
  console.log('\n========================================');
  if (DRY_RUN) {
    console.log('✅ DRY RUN COMPLETE');
    console.log('');
    console.log('No files were modified.');
    console.log('Run without --dry-run to execute migration.');
  } else {
    console.log('✅ MIGRATION COMPLETE');
    console.log('');
    console.log('Next steps:');
    console.log('1. Update lib/manual-data.ts import paths');
    console.log('2. Update pdf-config.json output paths');
    console.log('3. Update .gitignore to ignore processing files');
    console.log('4. Update scripts (pdf-build.js, pdf-clean.js)');
    console.log('5. Run: pnpm build');
    console.log('6. Run: pnpm run b4push');
  }
  console.log('========================================\n');
}

// Execute migration
migrate();
