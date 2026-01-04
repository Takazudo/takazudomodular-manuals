#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const draftsDir = join(__dirname, '../data/translations-draft');

const mismatches = [];

for (let i = 1; i <= 272; i++) {
  const filename = `page-${String(i).padStart(3, '0')}.json`;
  const filepath = join(draftsDir, filename);

  try {
    const data = JSON.parse(readFileSync(filepath, 'utf-8'));
    if (data.pageNum !== i) {
      mismatches.push({
        file: filename,
        expected: i,
        actual: data.pageNum,
        diff: data.pageNum - i,
      });
    }
  } catch (error) {
    console.log(`Error reading ${filename}: ${error.message}`);
  }
}

if (mismatches.length === 0) {
  console.log('✓ All page numbers match their filenames');
} else {
  console.log(`❌ Found ${mismatches.length} mismatches:\n`);
  mismatches.forEach(({ file, expected, actual, diff }) => {
    console.log(`${file}: expected ${expected}, got ${actual} (diff: ${diff})`);
  });
}
