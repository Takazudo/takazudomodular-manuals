#!/usr/bin/env node

/**
 * Restructure Next.js build output for basePath: '/manuals'
 *
 * Problem: Next.js with basePath puts '/manuals' prefix in all asset URLs,
 * but exports files to the root of out/. This causes 404s because:
 * - HTML references /manuals/_next/static/...
 * - But _next/ is at out/_next/, not out/manuals/_next/
 *
 * Solution: Move all build output under out/manuals/ except for assets
 * that are already correctly placed in public/manuals/
 *
 * Before:
 *   out/
 *   ├── _next/           # Referenced as /manuals/_next/
 *   ├── manuals/         # From public/manuals/ (already correct)
 *   ├── index.html       # Referenced as /manuals/
 *   ├── oxi-one-mk2/     # Page directories
 *   └── ...
 *
 * After:
 *   out/
 *   └── manuals/
 *       ├── _next/       # Now correctly at /manuals/_next/
 *       ├── oxi-one-mk2/ # Manual assets + pages merged
 *       ├── index.html   # Now at /manuals/
 *       └── ...
 */

import { readdirSync, statSync, mkdirSync, renameSync, existsSync, rmSync, cpSync } from 'fs';
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

// Step 2: Save existing manuals/ directory (static assets from public/)
const manualsBackup = join(projectRoot, 'out-manuals-backup');
if (existsSync(targetDir)) {
  console.log('1. Backing up existing manuals/ directory (static assets)...');
  renameSync(targetDir, manualsBackup);
}

// Step 3: Create temp directory and move everything there
console.log('2. Moving build output to temp directory...');
renameSync(outDir, tempDir);

// Step 4: Create new out/manuals/ structure
console.log('3. Creating new out/manuals/ structure...');
mkdirSync(targetDir, { recursive: true });

// Step 5: Move all content from temp to out/manuals/
console.log('4. Moving content to out/manuals/...');
const tempContents = readdirSync(tempDir);
for (const item of tempContents) {
  const srcPath = join(tempDir, item);
  const destPath = join(targetDir, item);
  renameSync(srcPath, destPath);
}

// Step 6: Restore static assets from backup, merging with page directories
if (existsSync(manualsBackup)) {
  console.log('5. Merging static assets back into structure...');
  const assetDirs = readdirSync(manualsBackup);
  for (const manualId of assetDirs) {
    const srcAssetDir = join(manualsBackup, manualId);
    const destManualDir = join(targetDir, manualId);

    if (statSync(srcAssetDir).isDirectory()) {
      // Ensure destination exists
      if (!existsSync(destManualDir)) {
        mkdirSync(destManualDir, { recursive: true });
      }

      // Copy asset subdirectories (pages/, data/, original.pdf)
      const assetContents = readdirSync(srcAssetDir);
      for (const assetItem of assetContents) {
        const srcItem = join(srcAssetDir, assetItem);
        const destItem = join(destManualDir, assetItem);

        // Don't overwrite existing page directories from build
        if (!existsSync(destItem)) {
          if (statSync(srcItem).isDirectory()) {
            cpSync(srcItem, destItem, { recursive: true });
          } else {
            cpSync(srcItem, destItem);
          }
        } else if (statSync(srcItem).isDirectory() && statSync(destItem).isDirectory()) {
          // Merge directory contents
          const subContents = readdirSync(srcItem);
          for (const subItem of subContents) {
            const srcSubItem = join(srcItem, subItem);
            const destSubItem = join(destItem, subItem);
            if (!existsSync(destSubItem)) {
              cpSync(srcSubItem, destSubItem, { recursive: statSync(srcSubItem).isDirectory() });
            }
          }
        }
      }
    }
  }
}

// Step 7: Cleanup
console.log('6. Cleaning up temporary directories...');
if (existsSync(tempDir)) {
  rmSync(tempDir, { recursive: true });
}
if (existsSync(manualsBackup)) {
  rmSync(manualsBackup, { recursive: true });
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
