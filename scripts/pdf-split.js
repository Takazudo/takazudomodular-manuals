#!/usr/bin/env node

/**
 * PDF Split Script - Page by Page
 * Splits PDF into individual page files
 *
 * Input: manual-pdf/*.pdf
 * Output: manual-pdf/pages/page-001.pdf, page-002.pdf, etc.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument } from 'pdf-lib';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// Load configuration
const config = JSON.parse(readFileSync(join(ROOT_DIR, 'pdf-config.json'), 'utf-8'));

async function splitPDF() {
  console.log('🔪 PDF Split Script (Page by Page)');
  console.log('='.repeat(50));

  // Find input PDF
  const pdfPattern = join(ROOT_DIR, config.input.pdfDirectory, config.input.pdfPattern);
  const pdfFiles = glob.sync(pdfPattern);

  if (pdfFiles.length === 0) {
    console.error(`❌ No PDF found matching: ${pdfPattern}`);
    console.error(`   Please place your PDF in: ${join(ROOT_DIR, config.input.pdfDirectory)}/`);
    process.exit(1);
  }

  const inputPdfPath = pdfFiles[0];

  if (pdfFiles.length > 1) {
    console.log(`📋 Multiple PDFs found, using: ${inputPdfPath}`);
    console.log(`   Other files: ${pdfFiles.slice(1).join(', ')}`);
    console.log('');
  } else {
    console.log(`📄 Input PDF: ${inputPdfPath}`);
  }

  // Load PDF
  const pdfBytes = readFileSync(inputPdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const totalPages = pdfDoc.getPageCount();

  console.log(`📊 Total pages: ${totalPages}`);

  // Create output directory
  const outputDir = join(ROOT_DIR, config.output.pages);
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
