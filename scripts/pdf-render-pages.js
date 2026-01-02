#!/usr/bin/env node

/**
 * PDF Page Rendering Script
 * Renders PDF pages to PNG images at specified DPI
 *
 * Input: manual-pdf/parts/part-*.pdf
 * Output: public/manual/pages/page_001.png, page_002.png, etc.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, renameSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pdfToPng } from 'pdf-to-png-converter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// Load configuration
const config = JSON.parse(readFileSync(join(ROOT_DIR, 'pdf-config.json'), 'utf-8'));

async function renderPdfPages() {
  console.log('🖼️  PDF Page Rendering Script');
  console.log('='.repeat(50));

  const partsDir = join(ROOT_DIR, config.output.parts);
  const outputDir = join(ROOT_DIR, config.output.images);
  const dpi = config.settings.imageDPI;

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
  console.log(`🎨 DPI: ${dpi}`);
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

  let globalPageNumber = 1;
  let totalPagesRendered = 0;

  // Process each part
  for (const partFile of partFiles) {
    const partPath = join(partsDir, partFile);
    const partNumber = partFile.match(/part-(\d+)\.pdf/)?.[1];

    console.log(`📄 Processing ${partFile}...`);

    try {
      // Convert PDF to PNG images
      const pngPages = await pdfToPng(partPath, {
        outputFolder: outputDir,
        pngOptions: {
          quality: 100,
          compression: 9,
        },
        verbosityLevel: 0,
      });

      console.log(`   📊 Pages in this part: ${pngPages.length}`);

      // Save images with global page numbering
      for (let i = 0; i < pngPages.length; i++) {
        const finalName = `page_${String(globalPageNumber).padStart(3, '0')}.png`;
        const finalPath = join(outputDir, finalName);

        // Write the PNG buffer to file
        writeFileSync(finalPath, pngPages[i].content);

        process.stdout.write(`   ✅ Rendered page ${globalPageNumber} (${partFile} p.${i + 1})\r`);

        globalPageNumber++;
        totalPagesRendered++;
      }

      console.log(''); // New line after progress
      console.log(`   ✨ Completed ${partFile}`);
      console.log('');
    } catch (error) {
      console.error(`   ❌ Error processing ${partFile}:`, error.message);
      process.exit(1);
    }
  }

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
