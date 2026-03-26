import { test, expect } from '@playwright/test';

const PAGE_URL = '/manuals/oxi-one-mk2/page/5';

/**
 * E2E tests for viewer UI improvements (issue #78)
 *
 * Tests the new interactive components:
 * - Header utility bar buttons
 * - View mode toggle (page ↔ scroll)
 * - Sidebar thumbnails
 * - Thumbnail grid modal
 */

test.describe('Viewer UI: Header Utility Bar', () => {
  test('should display three utility buttons in header', async ({ page }) => {
    await page.goto(PAGE_URL);

    const viewModeBtn = page.locator(
      'button[aria-label*="scroll mode"], button[aria-label*="page mode"]',
    );
    const sidebarBtn = page.locator('button[aria-label="Toggle sidebar"]');
    const thumbsBtn = page.locator('button[aria-label="Open thumbnail grid"]');

    await expect(viewModeBtn).toBeVisible();
    await expect(sidebarBtn).toBeVisible();
    await expect(thumbsBtn).toBeVisible();
  });
});

test.describe('Viewer UI: Sidebar Thumbnails', () => {
  test('should open and close sidebar on toggle', async ({ page }) => {
    await page.goto(PAGE_URL);

    const sidebar = page.locator('aside[aria-label="Page thumbnails"]');
    const sidebarBtn = page.locator('button[aria-label="Toggle sidebar"]');

    // Initially hidden (translated off-screen)
    await expect(sidebar).toHaveAttribute('aria-hidden', 'true');

    // Open sidebar
    await sidebarBtn.click();
    await expect(sidebar).toHaveAttribute('aria-hidden', 'false');

    // Close sidebar
    await sidebarBtn.click();
    await expect(sidebar).toHaveAttribute('aria-hidden', 'true');
  });

  test('should highlight current page in sidebar', async ({ page }) => {
    await page.goto(PAGE_URL);

    const sidebarBtn = page.locator('button[aria-label="Toggle sidebar"]');
    await sidebarBtn.click();

    // Wait for sidebar animation
    await page.waitForTimeout(400);

    // Current page (5) should have orange border (border-zd-outline)
    const sidebar = page.locator('aside[aria-label="Page thumbnails"]');
    const thumbnailButtons = sidebar.locator('button');
    const count = await thumbnailButtons.count();
    expect(count).toBeGreaterThan(0);

    // The 5th thumbnail should have the active styling
    const activeThumb = sidebar.locator('div.border-zd-outline');
    await expect(activeThumb).toBeVisible();
  });

  test('should navigate when clicking a sidebar thumbnail', async ({ page }) => {
    await page.goto(PAGE_URL);

    const sidebarBtn = page.locator('button[aria-label="Toggle sidebar"]');
    await sidebarBtn.click();
    await page.waitForTimeout(400);

    // Click on the first thumbnail (page 1)
    const sidebar = page.locator('aside[aria-label="Page thumbnails"]');
    const firstThumb = sidebar.locator('button').first();
    await firstThumb.click();

    // Should navigate to page 1
    await page.waitForURL(/\/page\/1$/);
  });
});

test.describe('Viewer UI: Thumbnail Grid Modal', () => {
  test('should open and close modal', async ({ page }) => {
    await page.goto(PAGE_URL);

    const thumbsBtn = page.locator('button[aria-label="Open thumbnail grid"]');
    await thumbsBtn.click();

    // Modal should be visible
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Close button should work
    const closeBtn = modal.locator('button[aria-label="閉じる"]');
    await closeBtn.click();

    // Modal should disappear
    await expect(modal).not.toBeVisible();
  });

  test('should close modal with Escape key', async ({ page }) => {
    await page.goto(PAGE_URL);

    const thumbsBtn = page.locator('button[aria-label="Open thumbnail grid"]');
    await thumbsBtn.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('should close modal when clicking overlay', async ({ page }) => {
    await page.goto(PAGE_URL);

    const thumbsBtn = page.locator('button[aria-label="Open thumbnail grid"]');
    await thumbsBtn.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Click the overlay (the dialog element itself, not its content)
    await modal.click({ position: { x: 5, y: 5 } });
    await expect(modal).not.toBeVisible();
  });

  test('should navigate when clicking a thumbnail in modal', async ({ page }) => {
    await page.goto(PAGE_URL);

    const thumbsBtn = page.locator('button[aria-label="Open thumbnail grid"]');
    await thumbsBtn.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Click page 10 thumbnail
    const thumb10 = modal.locator('button[aria-label="ページ 10"]');
    await thumb10.click();

    // Modal should close and navigate to page 10
    await expect(modal).not.toBeVisible();
    await page.waitForURL(/\/page\/10$/);
  });

  test('should show thumbnail grid with proper aspect ratio', async ({ page }) => {
    await page.goto(PAGE_URL);

    const thumbsBtn = page.locator('button[aria-label="Open thumbnail grid"]');
    await thumbsBtn.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Grid should have multiple thumbnails
    const thumbs = modal.locator('button[aria-label^="ページ"]');
    const count = await thumbs.count();
    expect(count).toBeGreaterThan(10);
  });
});

test.describe('Viewer UI: View Mode Toggle', () => {
  test('should switch to scroll mode and back', async ({ page }) => {
    await page.goto(PAGE_URL);

    // Initially in page mode
    const pageViewer = page.getByTestId('page-image-column');
    await expect(pageViewer).toBeVisible();

    // Click view mode toggle to switch to scroll mode
    const viewModeBtn = page.locator('button[aria-label="Switch to scroll mode"]');
    await viewModeBtn.click();

    // Scroll viewer should appear
    const scrollViewer = page.getByTestId('scroll-viewer');
    await expect(scrollViewer).toBeVisible();

    // Click toggle again to switch back to page mode
    const pageModeBtn = page.locator('button[aria-label="Switch to page mode"]');
    await pageModeBtn.click();

    // Page viewer should be back
    await expect(page.getByTestId('page-image-column')).toBeVisible();
  });

  test('scroll mode should show page images', async ({ page }) => {
    await page.goto(PAGE_URL);

    // Switch to scroll mode
    const viewModeBtn = page.locator('button[aria-label="Switch to scroll mode"]');
    await viewModeBtn.click();

    // Wait for scroll viewer to render
    const scrollViewer = page.getByTestId('scroll-viewer');
    await expect(scrollViewer).toBeVisible();

    // Should have page images
    const scrollImages = page.getByTestId('scroll-image-column');
    await expect(scrollImages).toBeVisible();

    // Translation column should be visible
    const translationCol = page.getByTestId('scroll-translation-column');
    await expect(translationCol).toBeVisible();
  });
});

test.describe('Viewer UI: No Console Errors', () => {
  test('should not have console errors during UI interactions', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(PAGE_URL);
    await page.waitForLoadState('networkidle');

    // Toggle sidebar
    await page.locator('button[aria-label="Toggle sidebar"]').click();
    await page.waitForTimeout(400);
    await page.locator('button[aria-label="Toggle sidebar"]').click();
    await page.waitForTimeout(400);

    // Open and close modal
    await page.locator('button[aria-label="Open thumbnail grid"]').click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Toggle view mode
    await page.locator('button[aria-label="Switch to scroll mode"]').click();
    await page.waitForTimeout(500);
    await page.locator('button[aria-label="Switch to page mode"]').click();
    await page.waitForTimeout(500);

    expect(consoleErrors, `Console errors: ${consoleErrors.join(', ')}`).toHaveLength(0);
  });
});
