#!/usr/bin/env node

/**
 * PDF Search Index Generator (All Manuals)
 *
 * Iterates every manual directory under `public/`, reads its `pages-ja.json`,
 * writes a deterministic pretty-formatted `search-index.json` beside it, and
 * stamps a SHA-1 content hash of that file into the sibling `manifest.json`
 * as `searchIndexVersion`.
 *
 * Unlike `scripts/pdf-search-index.js`, this script does NOT use
 * `resolveManualConfig` — it does not require a source PDF or a `--slug`
 * argument. Index generation is orthogonal to PDF processing.
 *
 * Skips entries that are not manuals (e.g. `img/`, `_headers`, `_redirects`,
 * or any dir without a `data/pages-ja.json`). Logs one line per manual; skips
 * silently when `pages-ja.json` is missing.
 *
 * Usage:
 *   node scripts/pdf-search-index-all.js
 *   # or
 *   pnpm run pdf:search-index:all
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { buildIndex } from './pdf-search-index.js';
import {
  serializeSearchIndex,
  serializeManifest,
  sha1,
  updateManifestSearchIndexVersion,
} from './lib/search-index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');
const PUBLIC_DIR = join(ROOT_DIR, 'public');

/**
 * Discover candidate manual slugs by scanning direct children of `publicDir`.
 * Returns only directory names that contain a `data/pages-ja.json` file.
 *
 * Non-directory entries (`_headers`, `_redirects`) and directories without
 * a pages file (`img/`) are skipped. Safe to call on a public directory that
 * is empty or contains zero matching manuals — returns an empty array rather
 * than throwing.
 *
 * @param {string} publicDir
 * @returns {string[]} sorted list of manual slugs
 */
export function discoverManualSlugs(publicDir) {
  if (!existsSync(publicDir)) return [];

  const entries = readdirSync(publicDir);
  const slugs = [];

  for (const name of entries) {
    const abs = join(publicDir, name);
    let st;
    try {
      st = statSync(abs);
    } catch {
      continue;
    }
    if (!st.isDirectory()) continue;
    const pagesPath = join(abs, 'data', 'pages-ja.json');
    if (!existsSync(pagesPath)) continue;
    slugs.push(name);
  }

  slugs.sort();
  return slugs;
}

/**
 * Generate the search-index.json + manifest.json update for a single manual.
 *
 * Reads `public/{slug}/data/pages-ja.json`, builds the index, serializes it
 * deterministically, writes it to disk, computes its SHA-1, and stamps that
 * hash into the sibling `manifest.json` as `searchIndexVersion` while
 * preserving every other field.
 *
 * @param {string} rootDir - repo root
 * @param {string} slug - manual slug (directory name under public/)
 * @returns {{ entries: number, hash: string } | null} result, or null if pages-ja.json is missing
 */
export function writeSearchIndexForSlug(rootDir, slug) {
  const dataDir = join(rootDir, 'public', slug, 'data');
  const pagesPath = join(dataDir, 'pages-ja.json');
  const indexPath = join(dataDir, 'search-index.json');
  const manifestPath = join(dataDir, 'manifest.json');

  if (!existsSync(pagesPath)) {
    return null;
  }

  const pagesDoc = JSON.parse(readFileSync(pagesPath, 'utf-8'));
  const entries = buildIndex(pagesDoc, slug);
  const serialized = serializeSearchIndex(entries);
  writeFileSync(indexPath, serialized);

  const hash = sha1(serialized);

  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    const updated = updateManifestSearchIndexVersion(manifest, hash);
    writeFileSync(manifestPath, serializeManifest(updated));
  }

  return { entries: entries.length, hash };
}

// --------------------------------------------------------------------------
// CLI entrypoint — only run when invoked directly.
// --------------------------------------------------------------------------

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  try {
    const slugs = discoverManualSlugs(PUBLIC_DIR);

    console.log('🔎 PDF Search Index Generator (all manuals)');
    console.log('='.repeat(50));
    console.log(`📦 Discovered ${slugs.length} manual(s) under public/`);
    console.log('');

    let processed = 0;
    for (const slug of slugs) {
      const result = writeSearchIndexForSlug(ROOT_DIR, slug);
      if (!result) {
        console.log(`[search-index:all] ${slug}: skipped (no pages-ja.json)`);
        continue;
      }
      const short = result.hash.slice(0, 8);
      console.log(`[search-index:all] ${slug}: ${result.entries} entries, version ${short}`);
      processed++;
    }

    console.log('');
    console.log(`✨ Generated search indexes for ${processed} manual(s)`);
  } catch (err) {
    console.error('');
    console.error('❌ Error generating search indexes:');
    console.error(err);
    process.exit(1);
  }
}
