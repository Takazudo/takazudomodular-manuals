#!/usr/bin/env node

/**
 * Copy original PDFs to build output directory
 *
 * Copies source PDFs from manual-pdf/{slug}/ to out/manuals/{slug}/original.pdf
 * Run this after `next build` to include original PDFs in the static export.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const MANUAL_PDF_DIR = path.join(ROOT_DIR, 'manual-pdf');
const OUT_DIR = path.join(ROOT_DIR, 'out', 'manuals');

function findPdfInDir(dir) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  const pdf = files.find((f) => f.endsWith('.pdf') && !f.startsWith('.'));
  return pdf ? path.join(dir, pdf) : null;
}

function copyOriginalPdfs() {
  console.log('Copying original PDFs to build output...\n');

  if (!fs.existsSync(OUT_DIR)) {
    console.log('Output directory does not exist. Run `next build` first.');
    process.exit(1);
  }

  const slugs = fs
    .readdirSync(MANUAL_PDF_DIR)
    .filter((f) => fs.statSync(path.join(MANUAL_PDF_DIR, f)).isDirectory());

  let copied = 0;
  let skipped = 0;

  for (const slug of slugs) {
    const sourceDir = path.join(MANUAL_PDF_DIR, slug);
    const sourcePdf = findPdfInDir(sourceDir);

    if (!sourcePdf) {
      console.log(`  [SKIP] ${slug}: No PDF found in source directory`);
      skipped++;
      continue;
    }

    const destDir = path.join(OUT_DIR, slug);
    const destPdf = path.join(destDir, 'original.pdf');

    if (!fs.existsSync(destDir)) {
      console.log(`  [SKIP] ${slug}: Output directory does not exist`);
      skipped++;
      continue;
    }

    fs.copyFileSync(sourcePdf, destPdf);
    const size = (fs.statSync(destPdf).size / 1024 / 1024).toFixed(2);
    console.log(`  [OK] ${slug}: ${path.basename(sourcePdf)} → original.pdf (${size} MB)`);
    copied++;
  }

  console.log(`\nDone: ${copied} copied, ${skipped} skipped`);
}

copyOriginalPdfs();
