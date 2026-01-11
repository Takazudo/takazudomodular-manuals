#!/usr/bin/env node

/**
 * Restructure Next.js build output for basePath: '/manuals'
 *
 * Problem: Next.js with basePath puts '/manuals' prefix in all asset URLs,
 * but exports files to the root of out/. This causes 404s because:
 * - HTML references /manuals/_next/static/...
 * - But _next/ is at out/_next/, not out/manuals/_next/
 *
 * Solution: Move all build output under out/manuals/
 *
 * Before:
 *   out/
 *   ├── _next/           # Referenced as /manuals/_next/
 *   ├── oxi-one-mk2/     # Manual assets from public/oxi-one-mk2/
 *   ├── index.html       # Referenced as /manuals/
 *   └── ...
 *
 * After:
 *   out/
 *   └── manuals/
 *       ├── _next/       # Now correctly at /manuals/_next/
 *       ├── oxi-one-mk2/ # Manual assets at /manuals/oxi-one-mk2/
 *       ├── index.html   # Now at /manuals/
 *       └── ...
 */

import { readdirSync, mkdirSync, renameSync, existsSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const outDir = join(projectRoot, 'out');
const tempDir = join(projectRoot, 'out-temp');
const targetDir = join(outDir, 'manuals');

console.log('Restructuring build output for basePath...\n');

// Step 1: Check if already restructured (idempotent)
if (!existsSync(join(outDir, '_next')) && existsSync(join(targetDir, '_next'))) {
  console.log('Build output already restructured. Skipping.\n');
  process.exit(0);
}

// Step 2: Move everything to temp directory
console.log('1. Moving build output to temp directory...');
renameSync(outDir, tempDir);

// Step 3: Create new out/manuals/ structure
console.log('2. Creating new out/manuals/ structure...');
mkdirSync(targetDir, { recursive: true });

// Step 4: Move all content from temp to out/manuals/
console.log('3. Moving content to out/manuals/...');
const tempContents = readdirSync(tempDir);
for (const item of tempContents) {
  const srcPath = join(tempDir, item);
  const destPath = join(targetDir, item);
  renameSync(srcPath, destPath);
}

// Step 5: Cleanup
console.log('4. Cleaning up temporary directories...');
if (existsSync(tempDir)) {
  rmSync(tempDir, { recursive: true });
}

console.log('\nBuild restructured successfully!');
console.log(`Output: ${targetDir}/`);

// Verify structure
console.log('\nVerifying structure:');
const verifyItems = ['_next', 'index.html', 'oxi-one-mk2', 'oxi-one-mk2/pages'];
for (const item of verifyItems) {
  const itemPath = join(targetDir, item);
  const exists = existsSync(itemPath);
  console.log(`  ${exists ? '✓' : '✗'} ${item}`);
}
