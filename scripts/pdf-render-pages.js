#!/usr/bin/env node

/**
 * PDF Page Rendering Script - Page by Page
 * Renders individual page PDFs to PNG images
 *
 * Input: manual-pdf/{slug}/pages/page-*.pdf
 * Output: public/manuals/{slug}/pages/page-001.png, page-002.png, etc.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pdfToPng } from 'pdf-to-png-converter';
import { resolveManualConfig } from './lib/pdf-config-resolver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// Load configuration from shared resolver
const config = resolveManualConfig(ROOT_DIR);

async function renderPdfPages() {
  console.log('🖼️  PDF Page Rendering Script (Page by Page)');
  console.log('='.repeat(50));
  console.log(`📦 Manual: ${config.slug}`);

  const pagesDir = join(ROOT_DIR, config.output.pages);
  const outputDir = join(ROOT_DIR, config.output.images);
  const dpi = config.settings.imageDPI;

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
  console.log(`🎨 DPI: ${dpi}`);
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

  let totalPagesRendered = 0;

  // Process each page
  for (const pageFile of pageFiles) {
    const pagePath = join(pagesDir, pageFile);
    const pageNumber = pageFile.match(/page-(\d+)\.pdf/)?.[1];

    try {
      // Convert PDF to PNG
      const scale = dpi / 72;

      const pngPages = await pdfToPng(pagePath, {
        outputFolder: outputDir,
        viewportScale: scale,
        pngOptions: {
          quality: 100,
          compression: 9,
        },
        verbosityLevel: 0,
      });

      // Should only be one page per file
      if (pngPages.length !== 1) {
        console.error(`\n   ⚠️  Warning: ${pageFile} contains ${pngPages.length} pages`);
      }

      // Save with correct filename
      const finalName = `page-${pageNumber}.png`;
      const finalPath = join(outputDir, finalName);
      writeFileSync(finalPath, pngPages[0].content);

      process.stdout.write(`   ✅ Page ${pageNumber}/${pageFiles.length}: ${finalName}\r`);

      totalPagesRendered++;
    } catch (error) {
      console.error(`\n   ❌ Error processing ${pageFile}:`, error.message);
      process.exit(1);
    }
  }

  console.log(''); // New line after progress
  console.log('');
  console.log('='.repeat(50));
  console.log(`✨ Successfully rendered ${totalPagesRendered} pages`);
  console.log(`📁 Output location: ${outputDir}`);
}

// Run script
renderPdfPages().catch((error) => {
  console.error('');
  console.error('❌ Error rendering pages:');
  console.error(error);
  process.exit(1);
});
