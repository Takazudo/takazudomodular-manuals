#!/usr/bin/env node

/**
 * PDF Translation Script
 * Translates extracted text using Anthropic API (parallel processing)
 *
 * Input: data/extracted/part-*.txt
 * Output: data/translations-draft/part-*.json
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const Anthropic = require('@anthropic-ai/sdk');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// Load configuration
const config = JSON.parse(readFileSync(join(ROOT_DIR, 'pdf-config.json'), 'utf-8'));

const PARALLEL_TRANSLATIONS = 4; // Process 4 parts at a time

// Initialize Anthropic client
const anthropic = new Anthropic.Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Translate text using Anthropic API
 */
async function translateWithAPI(textContent, partNumber, retries = 3) {
  const prompt = `Translate the following English text from the OXI ONE MKII hardware synthesizer manual to Japanese.

Use technical documentation style (です・ます調). Preserve technical terms like MIDI, CV, Gate, Sequencer, BPM, LFO in English. Keep markdown formatting intact.

Output ONLY the Japanese translation without any preamble.

---

${textContent}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const message = await anthropic.messages.create({
        model: config.settings.translationModel,
        max_tokens: 16000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const translation = message.content[0].text;

      return {
        translation,
        metadata: {
          translatedAt: new Date().toISOString(),
          method: 'anthropic-api',
          model: config.settings.translationModel,
          attempt,
        },
      };
    } catch (error) {
      console.error(`   ⚠️  Attempt ${attempt}/${retries} failed: ${error.message}`);
      if (attempt < retries) {
        const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`   ⏳ Waiting ${waitTime / 1000}s before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      } else {
        throw error;
      }
    }
  }
}

/**
 * Process a batch of parts in parallel
 */
async function processBatch(batch, extractedDir, outputDir) {
  const promises = batch.map(async (textFile) => {
    const textPath = join(extractedDir, textFile);
    const partNumber = textFile.match(/part-(\d+)\.txt/)?.[1];
    const outputFileName = `part-${partNumber}.json`;
    const outputPath = join(outputDir, outputFileName);

    // Skip if already translated
    if (existsSync(outputPath)) {
      console.log(`⏭️  Skipping part ${partNumber} (already translated)`);
      return { partNumber, status: 'skipped' };
    }

    try {
      console.log(`📄 Processing part ${partNumber}...`);

      // Read extracted text
      const extractedText = readFileSync(textPath, 'utf-8');

      // Extract just the text content (skip metadata header)
      const textStartIndex = extractedText.indexOf('=== EXTRACTED TEXT ===');
      const textContent =
        textStartIndex !== -1
          ? extractedText.substring(textStartIndex).replace('=== EXTRACTED TEXT ===', '').trim()
          : extractedText;

      console.log(`   📏 Part ${partNumber}: ${textContent.length} characters`);

      // Translate using API
      const result = await translateWithAPI(textContent, partNumber);

      // Save to JSON
      const output = {
        part: partNumber,
        originalText: textContent,
        translation: result.translation,
        metadata: result.metadata,
      };

      writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

      console.log(`   ✅ Part ${partNumber} completed`);

      return { partNumber, status: 'success' };
    } catch (error) {
      console.error(`   ❌ Part ${partNumber} failed: ${error.message}`);

      // Save error report
      const errorReport = {
        part: partNumber,
        error: error.message,
        timestamp: new Date().toISOString(),
      };

      const errorPath = join(ROOT_DIR, '__inbox', `translation-error-part-${partNumber}.json`);
      mkdirSync(join(ROOT_DIR, '__inbox'), { recursive: true });
      writeFileSync(errorPath, JSON.stringify(errorReport, null, 2), 'utf-8');

      return { partNumber, status: 'failed', error: error.message };
    }
  });

  return Promise.all(promises);
}

async function translateAllParts() {
  console.log('🌐 PDF Translation Script (Anthropic API)');
  console.log('='.repeat(50));

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ Error: ANTHROPIC_API_KEY environment variable not set');
    console.error('');
    console.error('To fix this, either:');
    console.error('1. Set the environment variable: export ANTHROPIC_API_KEY=your_key_here');
    console.error(
      '2. Create a .env file in the project root with: ANTHROPIC_API_KEY=your_key_here',
    );
    console.error('');
    console.error('Get your API key from: https://console.anthropic.com/settings/keys');
    process.exit(1);
  }

  const extractedDir = join(ROOT_DIR, config.output.extracted);
  const outputDir = join(ROOT_DIR, config.output.translationsDraft);

  // Check if extracted directory exists
  if (!existsSync(extractedDir)) {
    console.error(`❌ Extracted directory not found: ${extractedDir}`);
    console.error('   Please run pdf:extract first');
    process.exit(1);
  }

  // Create output directory
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  console.log(`📁 Input directory: ${extractedDir}`);
  console.log(`📁 Output directory: ${outputDir}`);
  console.log(`🤖 Model: ${config.settings.translationModel}`);
  console.log(`🔄 Parallel translations: ${PARALLEL_TRANSLATIONS}`);
  console.log('');

  // Get all extracted text files
  const textFiles = readdirSync(extractedDir)
    .filter((file) => file.startsWith('part-') && file.endsWith('.txt'))
    .sort();

  if (textFiles.length === 0) {
    console.error(`❌ No extracted text files found in: ${extractedDir}`);
    console.error('   Please run pdf:extract first');
    process.exit(1);
  }

  console.log(`📚 Found ${textFiles.length} parts to translate`);
  console.log(`🔄 Processing in batches of ${PARALLEL_TRANSLATIONS}`);
  console.log('');

  // Split into batches
  const batches = [];
  for (let i = 0; i < textFiles.length; i += PARALLEL_TRANSLATIONS) {
    batches.push(textFiles.slice(i, i + PARALLEL_TRANSLATIONS));
  }

  let totalSuccess = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  // Process batches sequentially (but parts within batch run in parallel)
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(
      `📦 Batch ${i + 1}/${batches.length}: Processing ${batch.length} parts in parallel...`,
    );
    console.log('');

    const results = await processBatch(batch, extractedDir, outputDir);

    // Count results
    results.forEach((result) => {
      if (result.status === 'success') totalSuccess++;
      else if (result.status === 'skipped') totalSkipped++;
      else if (result.status === 'failed') totalFailed++;
    });

    console.log('');
  }

  console.log('='.repeat(50));
  console.log(`✨ Translation complete`);
  console.log(`   ✅ Success: ${totalSuccess}`);
  console.log(`   ⏭️  Skipped: ${totalSkipped}`);
  console.log(`   ❌ Failed: ${totalFailed}`);
  console.log(`📁 Output location: ${outputDir}`);

  if (totalFailed > 0) {
    console.log('');
    console.log('⚠️  Some translations failed. Check __inbox/ for error reports.');
    process.exit(1);
  }
}

// Run script
translateAllParts().catch((error) => {
  console.error('');
  console.error('❌ Error translating:');
  console.error(error);
  process.exit(1);
});
