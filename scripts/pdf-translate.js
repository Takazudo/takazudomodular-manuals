#!/usr/bin/env node

/**
 * PDF Translation Script
 * Translates extracted text using Claude Code manual-translator subagents (parallel processing)
 *
 * Input: temp-processing/{slug}/extracted/page-*.txt
 * Output: temp-processing/{slug}/translations-draft/page-*.json
 *
 * This script uses Claude Code's Task tool to spawn manual-translator subagents.
 * It runs 4 translations in parallel to maximize throughput.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { resolveManualConfig } from './lib/pdf-config-resolver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// Load configuration from shared resolver
const config = resolveManualConfig(ROOT_DIR);

console.log('🌐 PDF Translation Script (Claude Code Subagents)');
console.log('='.repeat(50));
console.log('');
console.log(
  '⚠️  IMPORTANT: This script must be run from Claude Code CLI, not as a standalone Node script.',
);
console.log('');
console.log('This script is designed to be invoked by Claude Code agents that can:');
console.log('1. Spawn manual-translator subagents using the Task tool');
console.log('2. Run 4 parallel translations');
console.log(`3. Save results to temp-processing/${config.slug}/translations-draft/`);
console.log('');
console.log('To run translation, ask Claude Code:');
console.log('  "Run pdf translation using 4 parallel manual-translator subagents"');
console.log('');
console.log('Or use the slash command:');
console.log('  /pdf-process translate');
console.log('');
console.log('='.repeat(50));
console.log('');
console.log('❌ This script cannot run standalone.');
console.log('   Please invoke via Claude Code agent or skill.');
process.exit(1);

/**
 * NOTE: The actual translation logic should be implemented by a Claude Code agent
 * that has access to the Task tool. The agent will:
 *
 * 1. Read all page-*.txt files from temp-processing/{slug}/extracted/
 * 2. For each batch of 4 pages:
 *    - Spawn 4 manual-translator subagents in parallel using Task tool
 *    - Each subagent receives one page's text with the prompt:
 *      "Translate the following English text from the manual to Japanese: [text]"
 *    - Wait for all 4 agents to complete
 *    - Save each translation to temp-processing/{slug}/translations-draft/page-*.json
 * 3. Continue with next batch until all pages are translated
 *
 * Example Task tool invocation (parallel):
 *
 * // Batch 1: Parts 01-04
 * <invoke name="Task">
 *   <parameter name="subagent_type">manual-translator</parameter>
 *   <parameter name="prompt">Translate this text: [part-01 text]</parameter>
 *   <parameter name="run_in_background">true</parameter>
 * </invoke>
 * <invoke name="Task">
 *   <parameter name="subagent_type">manual-translator</parameter>
 *   <parameter name="prompt">Translate this text: [part-02 text]</parameter>
 *   <parameter name="run_in_background">true</parameter>
 * </invoke>
 * ... (spawn 4 total)
 *
 * // Then use TaskOutput to collect results
 */
