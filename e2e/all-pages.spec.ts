import { test, expect } from '@playwright/test';
import { getAvailableManuals, getManifest } from '../lib/manual-registry';

const BASE_URL = 'http://zmanuals.localhost:3100';

/**
 * Dynamic E2E Smoke Tests for All Manuals
 *
 * This test suite automatically discovers all manuals from the manual-registry
 * and tests every page of every manual for:
 * - HTTP 200 status
 * - No loading errors
 *
 * Benefits:
 * - Adding new manuals to the registry automatically includes them in tests
 * - No manual test updates required for new PDFs
 * - Comprehensive coverage across all manual projects
 *
 * Current manuals:
 * - oxi-one-mk2 (272 pages)
 * - oxi-coral (46 pages)
 */

// Discover all manuals from registry
const manualIds = getAvailableManuals();

// Create test suite for each manual
for (const manualId of manualIds) {
  const manifest = getManifest(manualId);
  const totalPages = manifest.totalPages;

  test.describe(`${manifest.title} - Smoke Test (${totalPages} pages)`, () => {
    test(`all ${totalPages} pages should load without errors`, async ({ page }) => {
      const errors: Array<{ page: number; status: number; url: string }> = [];
      const successes: number[] = [];

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const url = `${BASE_URL}/manuals/${manualId}/page/${pageNum}`;
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
          console.log(`[${manualId}] Progress: ${pageNum}/${totalPages} pages checked`);
        }
      }

      console.log(`\n=== ${manifest.title} Test Results ===`);
      console.log(`Success: ${successes.length}/${totalPages} pages`);
      console.log(`Errors: ${errors.length}/${totalPages} pages`);

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
}
