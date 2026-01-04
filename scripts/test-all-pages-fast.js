#!/usr/bin/env node

/**
 * Fast smoke test for all manual pages
 * Tests in small batches with progress reporting
 *
 * Environment variables:
 *   BASE_URL - Server URL (default: http://localhost:3100 for production)
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3100/manuals/oxi-one-mk2';
const MANUAL_PATH = '/page';
const TOTAL_PAGES = 272;
const BATCH_SIZE = 10;

const errors = [];
let tested = 0;

async function testBatch(start, end) {
  const promises = [];

  for (let pageNum = start; pageNum <= end && pageNum <= TOTAL_PAGES; pageNum++) {
    const url = `${BASE_URL}${MANUAL_PATH}/${pageNum}`;

    promises.push(
      fetch(url)
        .then((response) => {
          tested++;
          if (response.status !== 200) {
            errors.push({ page: pageNum, status: response.status });
          }
          return response.status === 200;
        })
        .catch((error) => {
          tested++;
          errors.push({ page: pageNum, status: 'ERROR', error: error.message });
          return false;
        }),
    );
  }

  await Promise.all(promises);
}

async function main() {
  console.log(`Testing all ${TOTAL_PAGES} pages...\n`);

  for (let start = 1; start <= TOTAL_PAGES; start += BATCH_SIZE) {
    const end = Math.min(start + BATCH_SIZE - 1, TOTAL_PAGES);
    await testBatch(start, end);
    process.stdout.write(`\rProgress: ${tested}/${TOTAL_PAGES} pages tested`);
  }

  console.log('\n\n=== Test Results ===');
  console.log(`Success: ${TOTAL_PAGES - errors.length}/${TOTAL_PAGES} pages`);
  console.log(`Errors: ${errors.length}/${TOTAL_PAGES} pages`);

  if (errors.length > 0) {
    console.log('\n=== Failed Pages ===');
    errors.forEach(({ page, status }) => {
      console.log(`Page ${page}: HTTP ${status}`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ All pages loaded successfully!');
    process.exit(0);
  }
}

main();
