import { test, expect, type Page } from '@playwright/test';
import { waitForViewerNavReady } from './helpers';

const MANUAL_PATH = '/oxi-one-mk2/page';

/**
 * E2E tests for scroll mode interactions
 *
 * Tests the scroll viewer behavior including:
 * - Page detection as user scrolls
 * - Translation panel syncing with visible page
 * - Thumbs dialog navigation in scroll mode
 * - Sidebar navigation in scroll mode
 * - View mode switch preserving current page
 * - Lazy loading of page images
 * - Page label display
 * - Keyboard navigation disabled in scroll mode
 */

/** Switch from page mode to scroll mode and wait for viewer to be ready */
async function switchToScrollMode(page: Page) {
  // Wait for the island to be interactive first — a click on the SSR'd button
  // before hydration is silently lost (no listener attached yet).
  await waitForViewerNavReady(page);
  const viewModeBtn = page.locator('button[aria-label="Switch to scroll mode"]');
  await viewModeBtn.click();
  const scrollViewer = page.getByTestId('scroll-viewer');
  await expect(scrollViewer).toBeVisible();
  return scrollViewer;
}

test.describe('Scroll Mode: Page Detection', () => {
  test('should update page indicator when scrolling down', async ({ page }) => {
    await page.goto(`${MANUAL_PATH}/1`);
    await switchToScrollMode(page);

    // The translation column header initially shows P.1
    const translationColumn = page.getByTestId('scroll-translation-column');
    await expect(translationColumn).toContainText('P.1');

    // Scroll the image column down significantly to pass several pages
    const imageColumn = page.getByTestId('scroll-image-column');
    await imageColumn.evaluate((el) => {
      el.scrollTop = el.scrollHeight * 0.05;
    });

    // Wait for IntersectionObserver to detect new page (condition-based, not
    // fixed delay). Match "P.1 /" with the boundary — a bare "P.1" is a
    // substring of "P.16 / 302" and would never stop matching.
    await expect(page.getByTestId('scroll-translation-header')).not.toContainText('P.1 /', {
      timeout: 8000,
    });

    // Extract detected page number and verify it advanced
    const headerText = await page.getByTestId('scroll-translation-header').textContent();
    expect(headerText).toBeTruthy();
    const match = headerText?.match(/P\.(\d+)/);
    expect(match).toBeTruthy();
    const detectedPage = parseInt(match?.[1] ?? '0', 10);
    expect(detectedPage).toBeGreaterThan(1);
  });
});

test.describe('Scroll Mode: Translation Panel', () => {
  test('should show translation content matching the current visible page', async ({ page }) => {
    await page.goto(`${MANUAL_PATH}/5`);
    await switchToScrollMode(page);

    // Translation column should be visible
    const translationColumn = page.getByTestId('scroll-translation-column');
    await expect(translationColumn).toBeVisible();

    // Header should show P.5 (since we started on page 5)
    await expect(page.getByTestId('scroll-translation-header')).toContainText('P.5');

    // Translation panel or no-translation message should be present
    const hasTranslation = page.getByTestId('scroll-translation-panel');
    const noTranslation = page.getByTestId('scroll-no-translation');
    const translationVisible = await hasTranslation.isVisible().catch(() => false);
    const noTranslationVisible = await noTranslation.isVisible().catch(() => false);
    expect(translationVisible || noTranslationVisible).toBe(true);
  });
});

test.describe('Scroll Mode: Thumbs Dialog Navigation', () => {
  test('should navigate to selected page via thumbs dialog', async ({ page }) => {
    await page.goto(`${MANUAL_PATH}/1`);
    await switchToScrollMode(page);

    // Open thumbs dialog
    const thumbsBtn = page.locator('button[aria-label="Open thumbnail grid"]');
    await thumbsBtn.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Click page 20 thumbnail
    const thumb20 = modal.locator('button[aria-label="ページ 20"]');
    await thumb20.click();

    // Modal should close
    await expect(modal).not.toBeVisible();

    // Wait for scroll to reach page 20 (IntersectionObserver fires when page is in viewport)
    await expect(page.getByTestId('scroll-translation-header')).toContainText('P.20', {
      timeout: 8000,
    });

    // Image should now be loaded (lazy loader triggered when page scrolled into view)
    const page20Image = page.getByTestId('scroll-page-image-20');
    await expect(page20Image).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Scroll Mode: Sidebar Navigation', () => {
  test('should navigate to selected page via sidebar thumbnail', async ({ page }) => {
    await page.goto(`${MANUAL_PATH}/1`);
    await switchToScrollMode(page);

    // Open sidebar
    const sidebarBtn = page.locator('button[aria-label="Toggle sidebar"]');
    await sidebarBtn.click();

    // Wait for sidebar to appear
    const sidebar = page.locator('aside[aria-label="Page thumbnails"]');
    await expect(sidebar).toBeVisible();

    // Click a thumbnail in the sidebar (page 10)
    // Sidebar buttons show page number text, find the one with "10"
    const thumb10 = sidebar.locator('button').filter({ hasText: /^10$/ });
    await thumb10.click();

    // Wait for scroll to reach page 10 (condition-based via page indicator)
    await expect(page.getByTestId('scroll-translation-header')).toContainText('P.10', {
      timeout: 8000,
    });

    // Image should now be loaded (lazy loader triggered when page scrolled into view)
    const page10Image = page.getByTestId('scroll-page-image-10');
    await expect(page10Image).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Scroll Mode: View Mode Switch Preserves Page', () => {
  test('should start scroll mode at the same page as page mode', async ({ page }) => {
    // Navigate to page 15 in page mode
    await page.goto(`${MANUAL_PATH}/15`);

    // Verify we're on page 15 in page mode
    const pageSelector = page.getByTestId('page-selector');
    await expect(pageSelector).toHaveValue('15');

    // Switch to scroll mode
    await switchToScrollMode(page);

    // The translation column header should show P.15
    await expect(page.getByTestId('scroll-translation-header')).toContainText('P.15');

    // Page 15's image should be visible (scroll viewer starts at page 15)
    const page15Image = page.getByTestId('scroll-page-image-15');
    await expect(page15Image).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Scroll Mode: Lazy Loading', () => {
  test('should only load images near the current page', async ({ page }) => {
    await page.goto(`${MANUAL_PATH}/1`);
    await switchToScrollMode(page);

    // Page 1 image should be loaded (has img element with data-testid)
    const page1Image = page.getByTestId('scroll-page-image-1');
    await expect(page1Image).toBeVisible();

    // A far-away page (e.g., page 100) should NOT have its image loaded yet —
    // when unloaded, no <img> element is rendered at all (only the placeholder)
    const page100Image = page.getByTestId('scroll-page-image-100');
    await expect(page100Image).not.toBeAttached();

    // Verify the placeholder is present for page 100 instead
    const placeholder = page.getByTestId('scroll-page-placeholder-100');
    await expect(placeholder).toBeAttached();
  });
});

test.describe('Scroll Mode: Page Labels', () => {
  test('should display page labels (P.1, P.2, etc.)', async ({ page }) => {
    await page.goto(`${MANUAL_PATH}/1`);
    await switchToScrollMode(page);

    // Check that page labels are visible for nearby pages
    // Page 1 label should be visible
    const page1Label = page.getByTestId('scroll-page-label-1');
    await expect(page1Label).toBeVisible();
    await expect(page1Label).toContainText('P.1');

    // Page 2 label should also be present in the DOM
    const page2Label = page.getByTestId('scroll-page-label-2');
    await expect(page2Label).toBeAttached();
    await expect(page2Label).toContainText('P.2');
  });
});

test.describe('Scroll Mode: Keyboard Navigation Disabled', () => {
  test('should not trigger page-mode navigation with arrow keys', async ({ page }) => {
    await page.goto(`${MANUAL_PATH}/5`);
    await switchToScrollMode(page);

    const initialUrl = page.url();

    // Press ArrowRight (which would navigate in page mode)
    await page.keyboard.press('ArrowRight');

    // Wait briefly to ensure no navigation happens
    await page.waitForTimeout(300);

    // URL should not change (no page-mode navigation)
    expect(page.url()).toBe(initialUrl);

    // Press ArrowLeft as well
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(300);

    // URL should still not change
    expect(page.url()).toBe(initialUrl);

    // Scroll viewer should still be visible (we didn't leave scroll mode)
    const scrollViewer = page.getByTestId('scroll-viewer');
    await expect(scrollViewer).toBeVisible();
  });
});
