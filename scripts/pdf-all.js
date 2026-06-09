#!/usr/bin/env node

/**
 * PDF All Orchestrator
 * Runs all PDF processing steps in order, forwarding all CLI args (e.g. --slug) to every step.
 *
 * Steps mirror the old pdf:all &&-chain:
 *   split → render → thumbs:generate:slug → extract → translate →
 *   validate → build → clean-en → md-to-html → search-index → manifest
 *
 * If any step exits non-zero the orchestrator propagates that exit code and stops.
 */

import { spawnSync } from 'child_process';

// All args after the script name are forwarded to every step.
// e.g. `node scripts/pdf-all.js --slug oxi-one-mk2` → every step receives `--slug oxi-one-mk2`
const passthroughArgs = process.argv.slice(2);

/**
 * Each entry is [command, [...extraArgs]] where extraArgs are baked into that
 * specific invocation (not user-supplied).  The passthroughArgs from the CLI
 * are appended after extraArgs for every step.
 */
const steps = [
  ['node', ['scripts/pdf-split.js']],
  ['node', ['scripts/pdf-render-pages.js']],
  ['node', ['scripts/generate-thumbs.js']],
  ['node', ['scripts/pdf-extract-text.js']],
  // pdf:translate intentionally exits 1 — translation is handled by /l-pdf-process subagents
  [
    'sh',
    [
      '-c',
      "echo 'Translation is handled by Claude Code Task subagents during /l-pdf-process execution' && exit 1",
    ],
  ],
  ['node', ['scripts/check-page-numbers.js']],
  // pdf:build is check-page-numbers + pdf-build; run both, forwarding args to each
  ['node', ['scripts/check-page-numbers.js']],
  ['node', ['scripts/pdf-build.js']],
  ['node', ['scripts/pdf-clean-en.js']],
  ['node', ['scripts/pdf-md-to-html.js']],
  ['node', ['scripts/pdf-search-index.js']],
  ['node', ['scripts/pdf-manifest.js']],
];

for (const [cmd, cmdArgs] of steps) {
  const allArgs = [...cmdArgs, ...passthroughArgs];
  console.log(`\n> ${cmd} ${allArgs.join(' ')}`);

  const result = spawnSync(cmd, allArgs, { stdio: 'inherit' });

  if (result.error) {
    console.error(`Failed to start: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
