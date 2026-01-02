#!/usr/bin/env node

/**
 * PDF Clean Script
 * Removes all generated files before reprocessing
 *
 * This script deletes:
 * - public/manual/pages/* (rendered images)
 * - data/extracted/* (extracted text)
 * - data/translations-draft/* (translation drafts)
 * - data/translations/* (final JSON files)
 * - manual-pdf/parts/* (split PDFs)
 *
 * Keeps:
 * - Source PDF in manual-pdf/
 * - Configuration files
 */

import { rmSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// Load configuration
const config = JSON.parse(
  await import('fs').then((fs) => fs.readFileSync(join(ROOT_DIR, 'pdf-config.json'), 'utf-8')),
);

console.log('🧹 PDF Clean Script');
console.log('='.repeat(50));
console.log('');
console.log('⚠️  This will remove all generated files from PDF processing:');
console.log('   - Rendered images (public/manual/pages/)');
console.log('   - Extracted text (data/extracted/)');
console.log('   - Translation drafts (data/translations-draft/)');
console.log('   - Final translations (data/translations/)');
console.log('   - Page PDFs (manual-pdf/pages/)');
console.log('');
console.log('   Source PDFs in manual-pdf/ will be kept.');
console.log('');

/**
 * Remove directory contents (not the directory itself)
 */
function cleanDirectory(dirPath, description) {
  if (!existsSync(dirPath)) {
    console.log(`⏭️  ${description}: Directory doesn't exist, skipping`);
    return;
  }

  try {
    const files = readdirSync(dirPath);
    let removedCount = 0;
    let removedSize = 0;

    for (const file of files) {
      const filePath = join(dirPath, file);
      const stats = statSync(filePath);

      // Calculate size before removing
      if (stats.isFile()) {
        removedSize += stats.size;
      } else if (stats.isDirectory()) {
        // Recursively calculate directory size
        const dirSize = calculateDirectorySize(filePath);
        removedSize += dirSize;
      }

      // Remove file or directory
      rmSync(filePath, { recursive: true, force: true });
      removedCount++;
    }

    const sizeMB = (removedSize / (1024 * 1024)).toFixed(2);
    console.log(`✅ ${description}: Removed ${removedCount} items (${sizeMB} MB)`);
  } catch (error) {
    console.error(`❌ ${description}: Error - ${error.message}`);
  }
}

/**
 * Calculate total size of directory
 */
function calculateDirectorySize(dirPath) {
  let totalSize = 0;

  try {
    const files = readdirSync(dirPath);

    for (const file of files) {
      const filePath = join(dirPath, file);
      const stats = statSync(filePath);

      if (stats.isFile()) {
        totalSize += stats.size;
      } else if (stats.isDirectory()) {
        totalSize += calculateDirectorySize(filePath);
      }
    }
  } catch (error) {
    // Ignore errors
  }

  return totalSize;
}

/**
 * Ensure directory exists (create if missing)
 */
function ensureDirectory(dirPath, description) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
    console.log(`📁 ${description}: Created directory`);
  }
}

// Clean all directories
console.log('Starting cleanup...');
console.log('');

cleanDirectory(join(ROOT_DIR, config.output.images), 'Rendered images');
cleanDirectory(join(ROOT_DIR, config.output.extracted), 'Extracted text');
cleanDirectory(join(ROOT_DIR, config.output.translationsDraft), 'Translation drafts');
cleanDirectory(join(ROOT_DIR, config.output.translations), 'Final translations');
cleanDirectory(join(ROOT_DIR, config.output.pages), 'Page PDFs');

console.log('');
console.log('Ensuring directories exist...');
console.log('');

// Recreate empty directories
ensureDirectory(join(ROOT_DIR, config.output.images), 'Rendered images');
ensureDirectory(join(ROOT_DIR, config.output.extracted), 'Extracted text');
ensureDirectory(join(ROOT_DIR, config.output.translationsDraft), 'Translation drafts');
ensureDirectory(join(ROOT_DIR, config.output.translations), 'Final translations');
ensureDirectory(join(ROOT_DIR, config.output.pages), 'Page PDFs');

console.log('');
console.log('='.repeat(50));
console.log('✨ Cleanup complete!');
console.log('');
console.log('All generated files have been removed.');
console.log('Directories are ready for fresh PDF processing.');
console.log('');
console.log('Next step: Run pdf:all to regenerate everything');
