#!/usr/bin/env node

/**
 * PDF Build Script
 * Transforms translation drafts into Next.js-consumable format
 *
 * Input: data/translations-draft/part-*.json
 * Output: data/translations/part-*.json
 *
 * This script:
 * - Splits translations into individual pages
 * - Extracts page titles from markdown headings
 * - Detects section names from content
 * - Adds metadata (tags, hasContent flags)
 * - Structures data for Next.js consumption
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// Load configuration
const config = JSON.parse(readFileSync(join(ROOT_DIR, 'pdf-config.json'), 'utf-8'));

console.log('🔨 PDF Build Script');
console.log('='.repeat(50));
console.log('');

const draftsDir = join(ROOT_DIR, config.output.translationsDraft);
const outputDir = join(ROOT_DIR, config.output.translations);

// Check if drafts directory exists
if (!existsSync(draftsDir)) {
  console.error(`❌ Drafts directory not found: ${draftsDir}`);
  console.error('   Please run pdf:translate first');
  process.exit(1);
}

// Create output directory
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

console.log(`📁 Input directory: ${draftsDir}`);
console.log(`📁 Output directory: ${outputDir}`);
console.log('');

// Get all draft files
const draftFiles = readdirSync(draftsDir)
  .filter((file) => file.startsWith('part-') && file.endsWith('.json'))
  .sort();

if (draftFiles.length === 0) {
  console.error(`❌ No draft files found in: ${draftsDir}`);
  console.error('   Please run pdf:translate first');
  process.exit(1);
}

console.log(`📚 Found ${draftFiles.length} draft files to process`);
console.log('');

/**
 * Extract title from markdown content
 * Looks for first heading (# or ##) in the text
 */
function extractTitle(markdown) {
  if (!markdown || markdown.trim() === '') return null;

  const lines = markdown.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    // Match ## heading or # heading
    const match = trimmed.match(/^#{1,3}\s+(.+)$/);
    if (match) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Detect section name from content
 * This is a simple heuristic - can be improved
 */
function detectSection(title, pageNum) {
  if (!title) return null;

  // Cover pages
  if (pageNum <= 2 || title.includes('表紙') || title.includes('目次')) {
    return '表紙・目次';
  }

  // Workflow section
  if (title.includes('ワークフロー') || title.includes('Workflow')) {
    return 'ワークフロー';
  }

  // Sequencer basics
  if (title.includes('シーケンサー') || title.includes('Sequencer')) {
    return 'シーケンサーの基礎';
  }

  return null;
}

/**
 * Generate tags from content
 */
function generateTags(title, sectionName) {
  const tags = [];

  if (!title) return tags;

  // Section-based tags
  if (sectionName?.includes('表紙')) tags.push('cover');
  if (sectionName?.includes('目次')) tags.push('table-of-contents');
  if (sectionName?.includes('ワークフロー')) tags.push('workflow');
  if (sectionName?.includes('シーケンサー')) tags.push('sequencer');

  // Content-based tags
  if (title.includes('Mono')) tags.push('mono-sequencer');
  if (title.includes('Chord') || title.includes('コード')) tags.push('chords');
  if (title.includes('Drum') || title.includes('ドラム')) tags.push('drums');
  if (title.includes('Mod') || title.includes('モジュレーション')) tags.push('modulation');

  return tags;
}

/**
 * Split translation text into individual pages
 * Uses page markers like "-- 1 of 30 --" as delimiters
 */
function splitTranslationIntoPages(translationText, totalPages) {
  const pages = [];

  // Split by page markers
  // Marker "-- N of 30 --" comes BEFORE the content for page N
  const pageMarkerRegex = /--\s*(\d+)\s+of\s+\d+\s*--/g;
  let matches = [];

  let match;
  while ((match = pageMarkerRegex.exec(translationText)) !== null) {
    matches.push({
      pageNum: parseInt(match[1]),
      index: match.index,
      length: match[0].length,
    });
  }

  // Process each page marker
  for (let i = 0; i < matches.length; i++) {
    const currentMatch = matches[i];
    const nextMatch = matches[i + 1];

    // Start position: right after current marker
    const startPos = currentMatch.index + currentMatch.length;
    // End position: at next marker, or end of text
    const endPos = nextMatch ? nextMatch.index : translationText.length;

    // Extract content between markers
    const content = translationText.substring(startPos, endPos).trim();

    if (content) {
      pages.push({
        pageNum: currentMatch.pageNum,
        content: content,
      });
    }
  }

  // If no page markers found, treat entire text as single page
  if (pages.length === 0 && translationText.trim()) {
    pages.push({
      pageNum: 1,
      content: translationText.trim(),
    });
  }

  return pages;
}

/**
 * Process a single draft file
 */
function processDraftFile(draftFile) {
  const draftPath = join(draftsDir, draftFile);
  const partNum = draftFile.match(/part-(\d+)\.json/)?.[1];

  if (!partNum) {
    console.error(`   ❌ Invalid draft filename: ${draftFile}`);
    return false;
  }

  console.log(`📄 Processing ${draftFile}...`);

  try {
    // Read draft file
    const draft = JSON.parse(readFileSync(draftPath, 'utf-8'));
    const { part, pageRange, translation, metadata: draftMetadata } = draft;

    if (!translation) {
      console.error(`   ❌ No translation found in ${draftFile}`);
      return false;
    }

    const totalPages = pageRange[1] - pageRange[0] + 1;

    // Split translation into individual pages
    const translationPages = splitTranslationIntoPages(translation, totalPages);

    console.log(`   📊 Split into ${translationPages.length} pages`);

    // Build page objects
    const pages = [];
    for (let i = 0; i < totalPages; i++) {
      const globalPageNum = pageRange[0] + i;
      const pageContent = translationPages.find((p) => p.pageNum === i + 1);

      const title = pageContent ? extractTitle(pageContent.content) : null;
      const sectionName = detectSection(title, globalPageNum);
      const tags = generateTags(title, sectionName);
      const hasContent = !!(pageContent && pageContent.content && pageContent.content.trim());

      const pageObj = {
        pageNum: globalPageNum,
        image: `/manual/pages/page_${String(globalPageNum).padStart(3, '0')}.png`,
        title: title || `Page ${globalPageNum}`,
        sectionName: sectionName,
        translation: pageContent ? pageContent.content : '',
        hasContent: hasContent,
        tags: tags,
      };

      pages.push(pageObj);
    }

    // Build final output
    const output = {
      part: part,
      pageRange: pageRange,
      totalPages: totalPages,
      metadata: {
        processedAt: new Date().toISOString(),
        translationMethod: draftMetadata?.method || 'claude-code-subagent',
        imageFormat: config.settings.imageFormat,
        imageDPI: config.settings.imageDPI,
      },
      pages: pages,
    };

    // Write output file
    const outputPath = join(outputDir, `part-${partNum}.json`);
    writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

    console.log(`   ✅ Created ${outputPath}`);
    console.log(
      `   📊 Pages: ${totalPages}, Content pages: ${pages.filter((p) => p.hasContent).length}`,
    );
    console.log('');

    return true;
  } catch (error) {
    console.error(`   ❌ Error processing ${draftFile}:`, error.message);
    return false;
  }
}

// Process all draft files
let successCount = 0;
let failCount = 0;

for (const draftFile of draftFiles) {
  const success = processDraftFile(draftFile);
  if (success) {
    successCount++;
  } else {
    failCount++;
  }
}

console.log('='.repeat(50));
console.log(`✨ Build complete!`);
console.log(`   ✅ Success: ${successCount} files`);
if (failCount > 0) {
  console.log(`   ❌ Failed: ${failCount} files`);
}
console.log(`📁 Output location: ${outputDir}`);
console.log('');
console.log('Next step: Run pdf:manifest to generate manifest.json');
