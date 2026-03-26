#!/usr/bin/env node

/**
 * Generate thumbnail images from existing full-size page PNGs.
 *
 * Reads from public/{slug}/pages/page-XXX.png
 * Outputs to public/{slug}/thumbs/thumb-XXX.png
 *
 * Usage:
 *   node scripts/generate-thumbs.js --slug oxi-one-mk2
 *   node scripts/generate-thumbs.js --all
 */

import { readdirSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

const THUMB_WIDTH = 150;

async function generateThumbsForManual(slug) {
  const pagesDir = join(ROOT_DIR, 'public', slug, 'pages');
  const thumbsDir = join(ROOT_DIR, 'public', slug, 'thumbs');

  if (!existsSync(pagesDir)) {
    console.log(`   Skipping ${slug} — no pages/ directory`);
    return 0;
  }

  const pageFiles = readdirSync(pagesDir)
    .filter((f) => f.startsWith('page-') && f.endsWith('.png'))
    .sort();

  if (pageFiles.length === 0) {
    console.log(`   Skipping ${slug} — no page images`);
    return 0;
  }

  mkdirSync(thumbsDir, { recursive: true });

  let count = 0;
  for (const file of pageFiles) {
    const pageNum = file.match(/page-(\d+)\.png/)?.[1];
    if (!pageNum) continue;

    const inputPath = join(pagesDir, file);
    const outputPath = join(thumbsDir, `thumb-${pageNum}.png`);

    await sharp(inputPath)
      .resize(THUMB_WIDTH)
      .png({ quality: 80, compressionLevel: 9 })
      .toFile(outputPath);

    count++;
  }

  process.stdout.write(`   ${slug}: ${count} thumbnails\n`);
  return count;
}

async function main() {
  const args = process.argv.slice(2);
  const allFlag = args.includes('--all');
  const slugIndex = args.indexOf('--slug');
  const slug = slugIndex !== -1 ? args[slugIndex + 1] : null;

  if (!allFlag && !slug) {
    console.error('Usage: node scripts/generate-thumbs.js --slug <manual-slug>');
    console.error('       node scripts/generate-thumbs.js --all');
    process.exit(1);
  }

  console.log('Generating thumbnails...');
  console.log(`   Width: ${THUMB_WIDTH}px`);
  console.log('');

  let totalThumbs = 0;

  if (allFlag) {
    const publicDir = join(ROOT_DIR, 'public');
    const dirs = readdirSync(publicDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && existsSync(join(publicDir, d.name, 'pages')))
      .map((d) => d.name)
      .sort();

    console.log(`   Found ${dirs.length} manuals with pages`);
    console.log('');

    for (const dir of dirs) {
      totalThumbs += await generateThumbsForManual(dir);
    }
  } else {
    totalThumbs = await generateThumbsForManual(slug);
  }

  console.log('');
  console.log(`Done. Generated ${totalThumbs} thumbnails.`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
