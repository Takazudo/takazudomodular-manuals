#!/usr/bin/env node

/**
 * PDF Text Extraction Script - Page by Page
 * Extracts text from individual page PDFs
 *
 * Input: temp-processing/{slug}/split-pdf/page-*.pdf
 * Output: temp-processing/{slug}/extracted/page-001.txt, page-002.txt, etc.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { resolveManualConfig } from './lib/pdf-config-resolver.js';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// Load configuration from shared resolver
const config = resolveManualConfig(ROOT_DIR);

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
  console.log('📝 PDF Text Extraction Script (Page by Page)');
  console.log('='.repeat(50));
  console.log(`📦 Manual: ${config.slug}`);

  const pagesDir = join(ROOT_DIR, config.output.splitPdf);
  const outputDir = join(ROOT_DIR, config.output.extracted);

  // Check if pages directory exists
  if (!existsSync(pagesDir)) {
    console.error(`❌ Pages directory not found: ${pagesDir}`);
    console.error('   Please run pdf:split first');
    process.exit(1);
  }

  // Create output directory
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  console.log(`📁 Input directory: ${pagesDir}`);
  console.log(`📁 Output directory: ${outputDir}`);
  console.log('');

  // Get all page PDFs
  const pageFiles = readdirSync(pagesDir)
    .filter((file) => file.startsWith('page-') && file.endsWith('.pdf'))
    .sort();

  if (pageFiles.length === 0) {
    console.error(`❌ No page PDFs found in: ${pagesDir}`);
    console.error('   Please run pdf:split first');
    process.exit(1);
  }

  console.log(`📚 Found ${pageFiles.length} page PDFs`);
  console.log('');

  let totalPagesExtracted = 0;

  // Process each page
  for (const pageFile of pageFiles) {
    const pagePath = join(pagesDir, pageFile);
    const pageNumber = pageFile.match(/page-(\d+)\.pdf/)?.[1];
    const outputFileName = `page-${pageNumber}.txt`;

    try {
      // Extract text
      const result = await extractTextFromPdf(pagePath);

      // Save to file (just the raw text, no metadata wrapper)
      const outputPath = join(outputDir, outputFileName);
      writeFileSync(outputPath, result.text.trim(), 'utf-8');

      process.stdout.write(`   ✅ Page ${pageNumber}/${pageFiles.length}: ${outputFileName}\r`);

      totalPagesExtracted++;
    } catch (error) {
      console.error(`\n   ❌ Error processing ${pageFile}:`, error.message);
      process.exit(1);
    }
  }

  console.log(''); // New line after progress
  console.log('');
  console.log('='.repeat(50));
  console.log(`✨ Successfully extracted text from ${totalPagesExtracted} pages`);
  console.log(`📁 Output location: ${outputDir}`);
}

// Run script
extractAllText().catch((error) => {
  console.error('');
  console.error('❌ Error extracting text:');
  console.error(error);
  process.exit(1);
});
