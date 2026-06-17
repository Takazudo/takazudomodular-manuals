#!/usr/bin/env node

/**
 * Fast smoke test for all manual pages — zfb dist target.
 *
 * Migrated from Next.js dev (http://zmanuals.localhost:3100) to zfb
 * production-serve (http://localhost:8030). Build + serve the dist first:
 *   pnpm zfb:build && node scripts/zfb-finalize-build.js && pnpm serve
 *
 * CF Workers root scheme: routes are /{id}/page/{n} (no /manuals prefix).
 * This script tests page HTTP status, not asset presence.
 *
 * Manuals are discovered dynamically by scanning `public/<slug>/data/manifest.json`
 * (the same approach as `discoverManualSlugs()` in scripts/pdf-search-index-all.js),
 * so EVERY manual registered under public/ is smoke-tested — there is no
 * hardcoded list to drift out of sync with lib/zfb-registry.generated.ts.
 *
 * Environment variables:
 *   BASE_URL - Server base URL (default: http://localhost:8030)
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');

/**
 * Discover every manual under `publicDir` that has a `data/manifest.json`,
 * returning a map of slug -> parsed manifest. Mirrors the discovery pattern in
 * scripts/pdf-search-index-all.js but keys on manifest.json (this crawler needs
 * `totalPages`, not the search-index's pages-ja.json). Non-directory entries
 * (`_headers`, `_redirects`) and dirs without a manifest (`img/`) are skipped.
 *
 * @param {string} publicDir
 * @returns {Record<string, { totalPages: number }>} slug -> manifest
 */
function discoverManuals(publicDir) {
  const manuals = {};
  if (!existsSync(publicDir)) return manuals;

  for (const name of readdirSync(publicDir)) {
    const abs = join(publicDir, name);
    let st;
    try {
      st = statSync(abs);
    } catch {
      continue;
    }
    if (!st.isDirectory()) continue;
    const manifestPath = join(abs, 'data', 'manifest.json');
    if (!existsSync(manifestPath)) continue;
    manuals[name] = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  }

  return manuals;
}

const MANUALS = discoverManuals(PUBLIC_DIR);

// Default changed from zmanuals.localhost:3100 (Next.js dev) to localhost:8030
// (zfb production-serve / pnpm serve). Override with BASE_URL env var if needed.
const BASE_URL = process.env.BASE_URL || 'http://localhost:8030';
const BATCH_SIZE = 10;

const errors = [];
let totalTested = 0;
let totalPages = 0;

async function testBatch(manualId, start, end, maxPages) {
  const promises = [];

  for (let pageNum = start; pageNum <= end && pageNum <= maxPages; pageNum++) {
    const url = `${BASE_URL}/${manualId}/page/${pageNum}`;

    promises.push(
      fetch(url)
        .then((response) => {
          totalTested++;
          if (response.status !== 200) {
            errors.push({ manual: manualId, page: pageNum, status: response.status });
          }
          return response.status === 200;
        })
        .catch((error) => {
          totalTested++;
          errors.push({ manual: manualId, page: pageNum, status: 'ERROR', error: error.message });
          return false;
        }),
    );
  }

  await Promise.all(promises);
}

async function testManual(manualId, manifest) {
  const pages = manifest.totalPages;
  console.log(`\n📘 Testing ${manualId} (${pages} pages)...`);

  for (let start = 1; start <= pages; start += BATCH_SIZE) {
    const end = Math.min(start + BATCH_SIZE - 1, pages);
    await testBatch(manualId, start, end, pages);
    process.stdout.write(`\r   Progress: ${totalTested}/${totalPages} pages tested`);
  }

  console.log('');
}

async function main() {
  console.log('🧪 Smoke Test - All Manual Pages');
  console.log('=====================================\n');

  // Get all manuals
  const manualIds = Object.keys(MANUALS).sort();

  // Fail loudly on an empty discovery — otherwise a misconfigured public/ dir
  // would silently "pass" with zero pages tested.
  if (manualIds.length === 0) {
    console.error('❌ No manuals discovered under public/*/data/manifest.json — nothing to test.');
    process.exit(1);
  }

  // Calculate total pages
  for (const manualId of manualIds) {
    totalPages += MANUALS[manualId].totalPages;
  }

  console.log(`📚 Found ${manualIds.length} manuals with ${totalPages} total pages\n`);

  // Test each manual
  for (const manualId of manualIds) {
    await testManual(manualId, MANUALS[manualId]);
  }

  // Report results
  console.log('\n=====================================');
  console.log('=== Test Results ===');
  console.log(`Success: ${totalPages - errors.length}/${totalPages} pages`);
  console.log(`Errors: ${errors.length}/${totalPages} pages`);

  if (errors.length > 0) {
    console.log('\n=== Failed Pages ===');
    errors.forEach(({ manual, page, status, error }) => {
      if (error) {
        console.log(`${manual}/page/${page}: ${status} - ${error}`);
      } else {
        console.log(`${manual}/page/${page}: HTTP ${status}`);
      }
    });
    console.log('');
    process.exit(1);
  } else {
    console.log('\n✅ All pages loaded successfully!');
    console.log('=====================================\n');
    process.exit(0);
  }
}

main();
