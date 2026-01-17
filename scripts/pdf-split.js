#!/usr/bin/env node

/**
 * PDF Split Script - Page by Page
 * Splits PDF into individual page files
 *
 * Input: manual-pdf/{slug}/*.pdf
 * Output: temp-processing/{slug}/split-pdf/page-001.pdf, page-002.pdf, etc.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument } from 'pdf-lib';
import { resolveManualConfig } from './lib/pdf-config-resolver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// Load configuration from shared resolver
const config = resolveManualConfig(ROOT_DIR);

async function splitPDF() {
  console.log('🔪 PDF Split Script (Page by Page)');
  console.log('='.repeat(50));
  console.log(`📦 Manual: ${config.slug}`);
  console.log(`📄 Input PDF: ${config.sourcePdf}`);

  // Load PDF
  const pdfBytes = readFileSync(config.sourcePdf);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const totalPages = pdfDoc.getPageCount();

  console.log(`📊 Total pages: ${totalPages}`);

  // Create output directory
  const outputDir = join(ROOT_DIR, config.output.splitPdf);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  console.log(`📁 Output directory: ${outputDir}`);
  console.log('');

  // Split into individual page files
  let processedPages = 0;

  for (let i = 0; i < totalPages; i++) {
    const pageNumber = i + 1;
    const fileName = `page-${String(pageNumber).padStart(3, '0')}.pdf`;

    // Create new PDF for this page
    const pagePdf = await PDFDocument.create();
    const [copiedPage] = await pagePdf.copyPages(pdfDoc, [i]);
    pagePdf.addPage(copiedPage);

    // Save page PDF
    const pagePdfBytes = await pagePdf.save();
    const outputPath = join(outputDir, fileName);
    writeFileSync(outputPath, pagePdfBytes);

    process.stdout.write(`   ✅ Page ${pageNumber}/${totalPages}: ${fileName}\r`);
    processedPages++;
  }

  console.log(''); // New line after progress
  console.log('');
  console.log('='.repeat(50));
  console.log(`✨ Successfully split PDF into ${processedPages} individual pages`);
  console.log(`📁 Output location: ${outputDir}`);
}

// Run script
splitPDF().catch((error) => {
  console.error('');
  console.error('❌ Error splitting PDF:');
  console.error(error);
  process.exit(1);
});
