#!/usr/bin/env node

/**
 * Fix page number mismatches in translation draft files
 * Updates pageNum field to match the filename
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const draftsDir = join(__dirname, '../public/manuals/oxi-one-mk2/processing/translations-draft');

console.log('🔧 Fixing page numbers in translation drafts...\n');

let fixedCount = 0;
let skippedCount = 0;

for (let i = 1; i <= 272; i++) {
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
