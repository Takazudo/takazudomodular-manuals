import { test, expect } from '@playwright/test';
import manifest from '../public/oxi-one-mk2/data/manifest.json';

const MANUAL_ID = 'oxi-one-mk2';
const MANUAL_PATH = `/manuals/${MANUAL_ID}/page`;
const TOTAL_PAGES = manifest.totalPages;

/**
 * E2E tests for oxi-one-mk2 manual viewer
 *
 * Verifies backward compatibility after multi-PDF refactoring:
 * - Page loading
 * - Navigation (arrow keys)
 * - Images display
 * - Translations display
 * - URL structure unchanged
 */

test.describe('OXI ONE MKII Manual Viewer', () => {
  test.describe('Index Pages', () => {
    test('should load manuals index page', async ({ page }) => {
      await page.goto('/manuals');
      await expect(page).toHaveTitle(/Manual Index/i);

      // Should show link to oxi-one-mk2
      const manualLink = page.getByRole('link', { name: /OXI ONE MKII/i });
      await expect(manualLink).toBeVisible();
    });

    test('should load oxi-one-mk2 manual index', async ({ page }) => {
      await page.goto(`/manuals/${MANUAL_ID}`);
      await expect(page).toHaveTitle(/OXI ONE MKII.*日本語訳/i);

      // Should have "マニュアルを読む" link
      const readLink = page.getByRole('link', { name: /マニュアルを読む/i });
      await expect(readLink).toBeVisible();
    });

    test('manuals index should load', async ({ page }) => {
      // With basePath: '/manuals', the app root is at /manuals
      await page.goto('/manuals');

      await expect(page).toHaveURL('/manuals');
    });
  });

  test.describe('Page Loading', () => {
    test('should load page 1', async ({ page }) => {
      await page.goto(`${MANUAL_PATH}/1`);
      await expect(page).toHaveTitle(/OXI ONE/i);
    });

    test('should load page 100 (middle)', async ({ page }) => {
      const response = await page.goto(`${MANUAL_PATH}/100`);
      expect(response?.status()).toBe(200);
    });

    test('should load page 272 (last)', async ({ page }) => {
      const response = await page.goto(`${MANUAL_PATH}/${TOTAL_PAGES}`);
      expect(response?.status()).toBe(200);
    });

    test('should return 404 for page 0', async ({ page }) => {
      const response = await page.goto(`${MANUAL_PATH}/0`, {
        waitUntil: 'domcontentloaded',
      });
      expect(response?.status()).toBe(404);
    });

    test('should return 404 for page beyond last', async ({ page }) => {
      const response = await page.goto(`${MANUAL_PATH}/${TOTAL_PAGES + 1}`, {
        waitUntil: 'domcontentloaded',
      });
      expect(response?.status()).toBe(404);
    });
  });

  test.describe('Page Content', () => {
    test('should display page image on page 1', async ({ page }) => {
      await page.goto(`${MANUAL_PATH}/1`);

      // Check that the page image exists and is visible
      const pageImage = page.getByTestId('page-image');
      await expect(pageImage).toBeVisible();

      // Verify image src points to correct path
      const src = await pageImage.getAttribute('src');
      expect(src).toContain('/manuals/oxi-one-mk2/pages/page-001.png');

      // Verify alt text
      const alt = await pageImage.getAttribute('alt');
      expect(alt).toContain('Page 1');
    });

    test('should display translation content on page 1', async ({ page }) => {
      await page.goto(`${MANUAL_PATH}/1`);

      // Wait for translation content to load
      const translationPanel = page.getByTestId('translation-panel');

      // Check translation panel is visible
      await expect(translationPanel).toBeVisible({ timeout: 10000 });
    });

    test('should display correct page number in navigation', async ({ page }) => {
      await page.goto(`${MANUAL_PATH}/42`);

      // Check page selector shows correct page
      const pageSelector = page.getByTestId('page-selector');
      await expect(pageSelector).toHaveValue('42');

      // Check total pages is displayed
      const totalPages = page.getByTestId('total-pages');
      await expect(totalPages).toHaveText(`/ ${TOTAL_PAGES}`);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should navigate to next page with ArrowRight', async ({ page }) => {
      await page.goto(`${MANUAL_PATH}/1`);

      // Press ArrowRight
      await page.keyboard.press('ArrowRight');

      // Wait for navigation
      await page.waitForURL(`${MANUAL_PATH}/2`);

      // Verify we're on page 2
      await expect(page).toHaveURL(`${MANUAL_PATH}/2`);
    });

    test('should navigate to previous page with ArrowLeft', async ({ page }) => {
      await page.goto(`${MANUAL_PATH}/2`);

      // Press ArrowLeft
      await page.keyboard.press('ArrowLeft');

      // Wait for navigation
      await page.waitForURL(`${MANUAL_PATH}/1`);

      // Verify we're on page 1
      await expect(page).toHaveURL(`${MANUAL_PATH}/1`);
    });

    test('should not navigate before page 1 with ArrowLeft', async ({ page }) => {
      await page.goto(`${MANUAL_PATH}/1`);
      const initialUrl = page.url();

      // Press ArrowLeft (should not navigate)
      await page.keyboard.press('ArrowLeft');

      // Verify URL hasn't changed
      await expect(page).toHaveURL(initialUrl);
    });

    test('should not navigate beyond last page with ArrowRight', async ({ page }) => {
      await page.goto(`${MANUAL_PATH}/${TOTAL_PAGES}`);
      const initialUrl = page.url();

      // Press ArrowRight (should not navigate)
      await page.keyboard.press('ArrowRight');

      // Verify URL hasn't changed
      await expect(page).toHaveURL(initialUrl);
    });
  });

  test.describe('URL Structure (Backward Compatibility)', () => {
    test('existing URLs should work unchanged', async ({ page }) => {
      const testPages = [1, 10, 50, 100, 150, 200, 250, TOTAL_PAGES];

      for (const pageNum of testPages) {
        const response = await page.goto(`${MANUAL_PATH}/${pageNum}`);
        expect(response?.status()).toBe(200);
      }
    });

    test('URL pattern /manuals/oxi-one-mk2/page/{num} should work', async ({ page }) => {
      await page.goto(`/manuals/oxi-one-mk2/page/1`);
      await expect(page).toHaveURL('/manuals/oxi-one-mk2/page/1');
    });
  });

  test.describe('Console Errors', () => {
    test('should not have console errors on page load', async ({ page }) => {
      const consoleErrors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto(`${MANUAL_PATH}/1`);

      // Wait for page to fully load
      await page.waitForLoadState('networkidle');

      // Should have no console errors
      expect(consoleErrors, `Console errors found: ${consoleErrors.join(', ')}`).toHaveLength(0);
    });
  });

  test.describe('Images Loading', () => {
    test('page images should load successfully', async ({ page }) => {
      await page.goto(`${MANUAL_PATH}/1`);

      // Find all images on the page
      const images = page.locator('img');
      const count = await images.count();

      expect(count).toBeGreaterThan(0);

      // Check that at least one image loaded successfully
      const firstImage = images.first();
      await expect(firstImage).toBeVisible();

      // Check image is loaded (has natural width/height)
      const naturalWidth = await firstImage.evaluate((img: HTMLImageElement) => img.naturalWidth);
      expect(naturalWidth).toBeGreaterThan(0);
    });

    test('should load images from correct path', async ({ page }) => {
      await page.goto(`${MANUAL_PATH}/5`);

      // Check image paths
      const pageImage = page.locator('img[src*="/manuals/oxi-one-mk2/pages/"]').first();
      await expect(pageImage).toBeVisible();

      const src = await pageImage.getAttribute('src');
      expect(src).toMatch(/\/manuals\/oxi-one-mk2\/pages\/page-\d{3}\.png/);
    });
  });

  test.describe('Translation Display', () => {
    test('translation content should be visible', async ({ page }) => {
      await page.goto(`${MANUAL_PATH}/1`);

      // Look for translation text content
      // Translation panel should contain some text
      const body = page.locator('body');
      const textContent = await body.textContent();

      // Should have some content (not empty)
      expect(textContent?.length).toBeGreaterThan(100);
    });

    test('should display Japanese text', async ({ page }) => {
      await page.goto(`${MANUAL_PATH}/1`);

      // Check for Japanese characters in the page
      const body = page.locator('body');
      const textContent = await body.textContent();

      // Japanese text should contain hiragana, katakana, or kanji
      const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(textContent || '');
      expect(hasJapanese).toBe(true);
    });
  });

  test.describe('Navigation UI', () => {
    test('should show page navigation controls', async ({ page }) => {
      await page.goto(`${MANUAL_PATH}/10`);

      // Check navigation component is visible
      const navigation = page.getByTestId('page-navigation');
      await expect(navigation).toBeVisible();

      // Check prev/next buttons exist
      const prevButton = page.getByTestId('prev-page-button');
      const nextButton = page.getByTestId('next-page-button');

      await expect(prevButton).toBeVisible();
      await expect(nextButton).toBeVisible();

      // Check page selector exists
      const pageSelector = page.getByTestId('page-selector');
      await expect(pageSelector).toBeVisible();
    });

    test('should disable prev button on first page', async ({ page }) => {
      await page.goto(`${MANUAL_PATH}/1`);

      // Prev button should be disabled
      const prevButtonDisabled = page.getByTestId('prev-page-button-disabled');
      await expect(prevButtonDisabled).toBeVisible();

      // Next button should be enabled
      const nextButton = page.getByTestId('next-page-button');
      await expect(nextButton).toBeVisible();
    });

    test('should disable next button on last page', async ({ page }) => {
      await page.goto(`${MANUAL_PATH}/${TOTAL_PAGES}`);

      // Next button should be disabled
      const nextButtonDisabled = page.getByTestId('next-page-button-disabled');
      await expect(nextButtonDisabled).toBeVisible();

      // Prev button should be enabled
      const prevButton = page.getByTestId('prev-page-button');
      await expect(prevButton).toBeVisible();
    });

    test('should navigate using prev/next buttons', async ({ page }) => {
      await page.goto(`${MANUAL_PATH}/10`);

      // Click next button
      const nextButton = page.getByTestId('next-page-button');
      await nextButton.click();

      // Wait for navigation
      await page.waitForURL(`${MANUAL_PATH}/11`);
      expect(page.url()).toBe(`${MANUAL_PATH}/11`);

      // Click prev button
      const prevButton = page.getByTestId('prev-page-button');
      await prevButton.click();

      // Wait for navigation
      await page.waitForURL(`${MANUAL_PATH}/10`);
      expect(page.url()).toBe(`${MANUAL_PATH}/10`);
    });

    test('should navigate using page selector', async ({ page }) => {
      await page.goto(`${MANUAL_PATH}/1`);

      // Select page 50
      const pageSelector = page.getByTestId('page-selector');
      await pageSelector.selectOption('50');

      // Wait for navigation
      await page.waitForURL(`${MANUAL_PATH}/50`);
      expect(page.url()).toBe(`${MANUAL_PATH}/50`);

      // Verify page selector shows correct page
      await expect(pageSelector).toHaveValue('50');
    });
  });
});
