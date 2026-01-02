#!/usr/bin/env node

/**
 * PDF Translation Script
 * Translates extracted text using Claude Code subagents (parallel processing)
 *
 * Input: data/extracted/part-*.txt
 * Output: data/translations-draft/part-*.json
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// Load configuration
const config = JSON.parse(readFileSync(join(ROOT_DIR, 'pdf-config.json'), 'utf-8'));

const PARALLEL_AGENTS = 4; // Process 4 parts at a time

/**
 * Translate text using Claude Code subagent
 */
async function translateWithSubagent(textContent, partNumber) {
  return new Promise((resolve, reject) => {
    const prompt = `Translate the following English text from the OXI ONE MKII hardware synthesizer manual to Japanese.

Use technical documentation style (です・ます調). Preserve technical terms like MIDI, CV, Gate, Sequencer, BPM, LFO in English. Keep markdown formatting intact.

Output ONLY the Japanese translation without any preamble.

---

${textContent}`;

    // Spawn Claude Code agent
    const claude = spawn('claude', ['--agent', 'manual-translator', '--output', 'text'], {
      cwd: ROOT_DIR,
    });

    let stdout = '';
    let stderr = '';

    // Send prompt to stdin
    claude.stdin.write(prompt);
    claude.stdin.end();

    claude.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    claude.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    claude.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Agent failed with code ${code}: ${stderr}`));
      } else {
        resolve({
          translation: stdout.trim(),
          metadata: {
            translatedAt: new Date().toISOString(),
            method: 'claude-code-subagent',
            agent: 'manual-translator',
          },
        });
      }
    });

    claude.on('error', (error) => {
      reject(new Error(`Failed to spawn Claude Code: ${error.message}`));
    });
  });
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

      // Translate using subagent
      const result = await translateWithSubagent(textContent, partNumber);

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
  console.log('🌐 PDF Translation Script (Subagent Mode)');
  console.log('='.repeat(50));

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
  console.log(`🤖 Agents: ${PARALLEL_AGENTS} parallel manual-translator subagents`);
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
  console.log(`🔄 Processing in batches of ${PARALLEL_AGENTS}`);
  console.log('');

  // Split into batches
  const batches = [];
  for (let i = 0; i < textFiles.length; i += PARALLEL_AGENTS) {
    batches.push(textFiles.slice(i, i + PARALLEL_AGENTS));
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
