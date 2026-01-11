#!/usr/bin/env node

/**
 * Fast smoke test for all manual pages
 * Dynamically tests all manuals from the registry
 *
 * Environment variables:
 *   BASE_URL - Server base URL (default: http://localhost:3100)
 */

import { createRequire } from 'module';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Read all manifests directly from the data directories
const oxiOneMk2Manifest = require('../public/oxi-one-mk2/data/manifest.json');
const oxiCoralManifest = require('../public/oxi-coral/data/manifest.json');
const oxiE16QuickStartManifest = require('../public/oxi-e16-quick-start/data/manifest.json');
const oxiE16ManualManifest = require('../public/oxi-e16-manual/data/manifest.json');
const addac112LooperManifest = require('../public/addac112-looper/data/manifest.json');

const MANUALS = {
  'addac112-looper': addac112LooperManifest,
  'oxi-coral': oxiCoralManifest,
  'oxi-e16-manual': oxiE16ManualManifest,
  'oxi-e16-quick-start': oxiE16QuickStartManifest,
  'oxi-one-mk2': oxiOneMk2Manifest,
};

const BASE_URL = process.env.BASE_URL || 'http://localhost:3100';
const BATCH_SIZE = 10;

const errors = [];
let totalTested = 0;
let totalPages = 0;

async function testBatch(manualId, start, end, maxPages) {
  const promises = [];

  for (let pageNum = start; pageNum <= end && pageNum <= maxPages; pageNum++) {
    const url = `${BASE_URL}/manuals/${manualId}/page/${pageNum}`;

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
