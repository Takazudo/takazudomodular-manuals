#!/usr/bin/env node

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse --slug argument
const args = process.argv.slice(2);
const slugIndex = args.indexOf('--slug');
const slug = slugIndex !== -1 ? args[slugIndex + 1] : 'oxi-one-mk2';

const draftsDir = join(__dirname, `../public/manuals/${slug}/processing/translations-draft`);

// Get list of translation files to determine page count
let pageFiles;
try {
  pageFiles = readdirSync(draftsDir)
    .filter((f) => f.startsWith('page-') && f.endsWith('.json'))
    .sort();
} catch (error) {
  console.log(`Error reading directory ${draftsDir}: ${error.message}`);
  process.exit(0); // Exit gracefully if directory doesn't exist
}

const totalPages = pageFiles.length;

if (totalPages === 0) {
  console.log(`No translation files found in ${draftsDir}`);
  process.exit(0);
}

console.log(`Checking ${totalPages} pages for manual: ${slug}`);

const mismatches = [];

for (let i = 1; i <= totalPages; i++) {
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
