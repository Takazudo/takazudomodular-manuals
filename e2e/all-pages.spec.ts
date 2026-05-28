/**
 * Dynamic E2E Smoke Tests for All Manuals — zfb dist target.
 *
 * Migrated from Next.js dev (port 3100 / zmanuals.localhost) to zfb
 * production-serve (port 8030 / localhost). playwright.config.ts webServer
 * builds the zfb dist before starting this suite.
 *
 * Route structure is identical to the Next.js app:
 *   /manuals/{id}/page/{n}
 *
 * Asset path change: static assets now live under /manuals/assets/* instead of
 * /manuals/_next/static/*. This is transparent to page-load assertions (we
 * check HTTP status and DOM, not asset URLs).
 *
 * NOTE: The /manuals/page/N redirect and root / 302 rules are Cloudflare Pages
 * redirect rules that are NOT replicated by `pnpm dlx serve`. Tests that
 * assert those redirects must be skipped locally or run against the deployed
 * preview URL. Mark such tests: `test.skip(!!process.env.CI, 'redirect rules
 * only apply on CF Pages')`.
 */
import { test, expect } from '@playwright/test';
import { getAvailableManuals, getManifest } from '../lib/manual-registry';

// Uses playwright.config.ts baseURL (http://localhost:8030 for zfb serve).
// Hard-coding the URL here is intentional so it is visible next to the
// assertions and so the tests work even if baseURL changes later.
const BASE_URL = 'http://localhost:8030';

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
