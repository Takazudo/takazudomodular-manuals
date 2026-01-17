#!/usr/bin/env node

/**
 * Fix page number mismatches in translation draft files
 * Updates pageNum field to match the filename
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse --slug argument
const args = process.argv.slice(2);
const slugIndex = args.indexOf('--slug');
const slug = slugIndex !== -1 ? args[slugIndex + 1] : 'oxi-one-mk2';

const draftsDir = join(__dirname, `../temp-processing/${slug}/translations-draft`);

console.log(`🔧 Fixing page numbers in translation drafts for: ${slug}\n`);

// Get page count from files
let pageFiles;
try {
  pageFiles = readdirSync(draftsDir)
    .filter((f) => f.startsWith('page-') && f.endsWith('.json'))
    .sort();
} catch (error) {
  console.log(`Error reading directory ${draftsDir}: ${error.message}`);
  process.exit(1);
}

const totalPages = pageFiles.length;
console.log(`Found ${totalPages} translation files\n`);

let fixedCount = 0;
let skippedCount = 0;

for (let i = 1; i <= totalPages; i++) {
  const filename = `page-${String(i).padStart(3, '0')}.json`;
  const filepath = join(draftsDir, filename);

  try {
    const data = JSON.parse(readFileSync(filepath, 'utf-8'));

    if (data.pageNum !== i) {
      console.log(`Fixing ${filename}: ${data.pageNum} → ${i}`);
      data.pageNum = i;
      writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
      fixedCount++;
    } else {
      skippedCount++;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filename}: ${error.message}`);
  }
}

console.log(`\n✅ Fixed ${fixedCount} files`);
console.log(`✓ Skipped ${skippedCount} files (already correct)`);
