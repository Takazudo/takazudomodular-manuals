#!/usr/bin/env node

/**
 * Smoke test for all manual pages
 * Checks that all 272 pages return HTTP 200
 */

const BASE_URL = 'http://zmanuals.localhost:3100';
const MANUAL_PATH = '/manuals/oxi-one-mk2/page';
const TOTAL_PAGES = 272;

const errors = [];
const successes = [];

async function checkPage(pageNum) {
  const url = `${BASE_URL}${MANUAL_PATH}/${pageNum}`;

  try {
    const response = await fetch(url);
    const status = response.status;

    if (status !== 200) {
      errors.push({ page: pageNum, status, url });
      return false;
    } else {
      successes.push(pageNum);
      return true;
    }
  } catch (error) {
    errors.push({ page: pageNum, status: 'ERROR', url, error: error.message });
    return false;
  }
}

async function main() {
  console.log(`Testing all ${TOTAL_PAGES} pages...\n`);

  for (let pageNum = 1; pageNum <= TOTAL_PAGES; pageNum++) {
    await checkPage(pageNum);

    // Log progress every 10 pages
    if (pageNum % 10 === 0) {
      console.log(`Progress: ${pageNum}/${TOTAL_PAGES} pages checked`);
    }
  }

  console.log(`\n=== Test Results ===`);
  console.log(`Success: ${successes.length}/${TOTAL_PAGES} pages`);
  console.log(`Errors: ${errors.length}/${TOTAL_PAGES} pages`);

  if (errors.length > 0) {
    console.log('\n=== Failed Pages ===');
    errors.forEach(({ page, status, url }) => {
      console.log(`Page ${page}: HTTP ${status} - ${url}`);
    });

    // Group errors by status code
    const errorsByStatus = {};
    errors.forEach(({ page, status }) => {
      if (!errorsByStatus[status]) {
        errorsByStatus[status] = [];
      }
      errorsByStatus[status].push(page);
    });

    console.log('\n=== Errors by Status Code ===');
    Object.entries(errorsByStatus).forEach(([status, pages]) => {
      console.log(`${status}: ${pages.length} pages - ${pages.join(', ')}`);
    });

    process.exit(1);
  } else {
    console.log('\n✓ All pages loaded successfully!');
    process.exit(0);
  }
}

main();
