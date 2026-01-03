import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3100';
const MANUAL_PATH = '/manuals/oxi-one-mk2/page';
const TOTAL_PAGES = 272;

test.describe('Manual Pages Smoke Test', () => {
  test('all pages should load without errors', async ({ page }) => {
    const errors: Array<{ page: number; status: number; url: string }> = [];
    const successes: number[] = [];

    for (let pageNum = 1; pageNum <= TOTAL_PAGES; pageNum++) {
      const url = `${BASE_URL}${MANUAL_PATH}/${pageNum}`;
      const response = await page.goto(url, { waitUntil: 'domcontentloaded' });

      if (!response) {
        errors.push({ page: pageNum, status: 0, url });
        continue;
      }

      const status = response.status();

      if (status !== 200) {
        errors.push({ page: pageNum, status, url });
      } else {
        successes.push(pageNum);
      }

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
    }

    // Fail the test if there are any errors
    expect(errors, `${errors.length} pages failed to load`).toHaveLength(0);
  });
});
