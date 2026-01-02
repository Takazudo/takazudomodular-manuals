#!/usr/bin/env node

/**
 * PDF Text Extraction Script
 * Extracts text from PDF parts with page boundaries preserved
 *
 * Input: manual-pdf/parts/part-*.pdf
 * Output: data/extracted/part-01.txt, part-02.txt, etc.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// Load configuration
const config = JSON.parse(readFileSync(join(ROOT_DIR, 'pdf-config.json'), 'utf-8'));

async function extractTextFromPdf(pdfPath) {
  // pdf-parse v2 API
  const parser = new PDFParse({ data: readFileSync(pdfPath) });
  const result = await parser.getText();
  await parser.destroy();

  return {
    text: result.text,
    numPages: result.numPages,
    metadata: result.metadata || {},
    info: result.info || {},
  };
}

async function extractAllText() {
  console.log('📝 PDF Text Extraction Script');
  console.log('='.repeat(50));

  const partsDir = join(ROOT_DIR, config.output.parts);
  const outputDir = join(ROOT_DIR, config.output.extracted);

  // Check if parts directory exists
  if (!existsSync(partsDir)) {
    console.error(`❌ Parts directory not found: ${partsDir}`);
    console.error('   Please run pdf:split first');
    process.exit(1);
  }

  // Create output directory
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  console.log(`📁 Input directory: ${partsDir}`);
  console.log(`📁 Output directory: ${outputDir}`);
  console.log('');

  // Get all part PDFs
  const partFiles = readdirSync(partsDir)
    .filter((file) => file.startsWith('part-') && file.endsWith('.pdf'))
    .sort();

  if (partFiles.length === 0) {
    console.error(`❌ No part PDFs found in: ${partsDir}`);
    console.error('   Please run pdf:split first');
    process.exit(1);
  }

  console.log(`📚 Found ${partFiles.length} part PDFs`);
  console.log('');

  let totalPartsProcessed = 0;
  let totalPagesExtracted = 0;

  // Process each part
  for (const partFile of partFiles) {
    const partPath = join(partsDir, partFile);
    const partNumber = partFile.match(/part-(\d+)\.pdf/)?.[1];
    const outputFileName = `part-${partNumber}.txt`;

    console.log(`📄 Processing ${partFile}...`);

    try {
      // Extract text
      const result = await extractTextFromPdf(partPath);

      console.log(`   📊 Pages: ${result.numPages}`);
      console.log(`   📏 Text length: ${result.text.length} characters`);

      // Prepare output with metadata
      const output = [
        `=== PART ${partNumber} ===`,
        `Total Pages: ${result.numPages}`,
        `Extracted: ${new Date().toISOString()}`,
        '',
        '=== EXTRACTED TEXT ===',
        '',
        result.text,
      ].join('\n');

      // Save to file
      const outputPath = join(outputDir, outputFileName);
      writeFileSync(outputPath, output, 'utf-8');

      console.log(`   ✅ Saved: ${outputPath}`);
      console.log('');

      totalPartsProcessed++;
      totalPagesExtracted += result.numPages;
    } catch (error) {
      console.error(`   ❌ Error processing ${partFile}:`, error.message);
      process.exit(1);
    }
  }

  console.log('='.repeat(50));
  console.log(`✨ Successfully extracted text from ${totalPartsProcessed} parts`);
  console.log(`📊 Total pages: ${totalPagesExtracted}`);
  console.log(`📁 Output location: ${outputDir}`);
}

// Run script
extractAllText().catch((error) => {
  console.error('');
  console.error('❌ Error extracting text:');
  console.error(error);
  process.exit(1);
});
