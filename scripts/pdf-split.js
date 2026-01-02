#!/usr/bin/env node

/**
 * PDF Split Script
 * Splits a large PDF into smaller parts based on configuration
 *
 * Input: manual-pdf/*.pdf
 * Output: manual-pdf/parts/part-01.pdf, part-02.pdf, etc.
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
  console.log('🔪 PDF Split Script');
  console.log('='.repeat(50));

  // Find input PDF
  const pdfPattern = join(ROOT_DIR, config.input.pdfDirectory, config.input.pdfPattern);
  const pdfFiles = glob.sync(pdfPattern);

  if (pdfFiles.length === 0) {
    console.error(`❌ No PDF found matching: ${pdfPattern}`);
    console.error(`   Please place your PDF in: ${join(ROOT_DIR, config.input.pdfDirectory)}/`);
    process.exit(1);
  }

  // If multiple PDFs found, use the first one (sorted alphabetically)
  // This allows processing regardless of filename
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
  const outputDir = join(ROOT_DIR, config.output.parts);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  console.log(`📁 Output directory: ${outputDir}`);
  console.log('');

  // Split into parts based on partConfig
  const partConfig = config.partConfig;
  let processedParts = 0;

  for (const [partKey, partInfo] of Object.entries(partConfig)) {
    const partNumber = partKey.replace('part', '');
    const startPage = partInfo.startPage - 1; // 0-indexed
    const endPage = startPage + partInfo.pages;

    if (startPage >= totalPages) {
      console.log(`⏭️  Skipping ${partKey}: start page ${partInfo.startPage} exceeds total pages`);
      continue;
    }

    console.log(
      `✂️  Processing ${partKey}: pages ${partInfo.startPage}-${Math.min(endPage, totalPages)}`,
    );

    // Create new PDF for this part
    const partPdf = await PDFDocument.create();

    // Copy pages
    const pagesToCopy = Math.min(partInfo.pages, totalPages - startPage);
    const pageIndices = Array.from({ length: pagesToCopy }, (_, i) => startPage + i);
    const copiedPages = await partPdf.copyPages(pdfDoc, pageIndices);

    copiedPages.forEach((page) => {
      partPdf.addPage(page);
    });

    // Save part PDF
    const partPdfBytes = await partPdf.save();
    const outputPath = join(outputDir, `part-${partNumber}.pdf`);
    writeFileSync(outputPath, partPdfBytes);

    console.log(`   ✅ Saved: ${outputPath} (${pagesToCopy} pages)`);
    processedParts++;
  }

  console.log('');
  console.log('='.repeat(50));
  console.log(`✨ Successfully split PDF into ${processedParts} parts`);
  console.log(`📁 Output location: ${outputDir}`);
}

// Run script
splitPDF().catch((error) => {
  console.error('');
  console.error('❌ Error splitting PDF:');
  console.error(error);
  process.exit(1);
});
