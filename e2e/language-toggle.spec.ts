import { test, expect } from '@playwright/test';

/**
 * Smoke test for the header language toggle (issue #102).
 *
 * Exercises the end-to-end flow:
 *   1. Default render is Japanese.
 *   2. Clicking EN switches the translation column to English and adds
 *      `?lang=en` to the URL.
 *   3. Reloading the page preserves English (URL-driven persistence).
 *
 * The test targets `oxi-coral` page 5 because that manual ships both
 * `pages-ja.json` and `pages-en.json`, so the EN toggle is enabled.
 *
 * Assertions are made against the translation panel's `lang` attribute
 * (`<div lang="ja|en" data-testid="translation-panel">`) rather than comparing
 * raw text. That keeps the assertion stable as translations evolve: the
 * contract we care about here is that language state flows from the toggle
 * through the provider into the viewer, not the specific prose on page 5.
 *
 * How to run:
 *   pnpm exec playwright test e2e/language-toggle.spec.ts
 *
 * By default, Playwright's `webServer` config builds and serves the zfb dist on
 * http://localhost:8030 (see playwright.config.ts). To run against an already-
 * built dist, set SKIP_ZFB_BUILD=1 and start `pnpm serve` first:
 *   SKIP_ZFB_BUILD=1 pnpm exec playwright test e2e/language-toggle.spec.ts
 */

const PAGE_PATH = '/oxi-coral/page/5';

const TRANSLATION_PANEL = '[data-testid="translation-panel"]';
const EN_BUTTON = 'button[aria-label="English"]';
const JA_BUTTON = 'button[aria-label="日本語表示"]';

test.describe('Language toggle: end-to-end', () => {
  test.beforeEach(async ({ context }) => {
    // Each test starts with a clean localStorage so persistence flows are
    // deterministic. `clearCookies` is a cheap way to scope this per-test;
    // we also explicitly clear storage on the target origin below.
    await context.clearCookies();
  });

  test('defaults to JA, toggles to EN, and persists across reload', async ({ page }) => {
    // Start on the target page and ensure storage is clean for this origin.
    await page.goto(PAGE_PATH);
    await page.evaluate(() => {
      window.localStorage.clear();
    });
    await page.reload();

    // --- Step 1: default is JA ---
    const translationPanel = page.locator(TRANSLATION_PANEL);
    await expect(translationPanel).toBeVisible();
    await expect(translationPanel).toHaveAttribute('lang', 'ja');

    const jaButton = page.locator(JA_BUTTON);
    const enButton = page.locator(EN_BUTTON);
    await expect(jaButton).toHaveAttribute('aria-pressed', 'true');
    await expect(enButton).toHaveAttribute('aria-pressed', 'false');

    // URL should not carry `?lang=ja` in the default state (JA is default and
    // the provider strips the param when switching back to default).
    expect(new URL(page.url()).searchParams.get('lang')).toBeNull();

    // --- Step 2: click EN ---
    await enButton.click();

    // Translation panel switches to English.
    await expect(translationPanel).toHaveAttribute('lang', 'en');
    await expect(enButton).toHaveAttribute('aria-pressed', 'true');
    await expect(jaButton).toHaveAttribute('aria-pressed', 'false');

    // URL now carries `?lang=en`.
    expect(new URL(page.url()).searchParams.get('lang')).toBe('en');

    // --- Step 3: reload keeps EN ---
    await page.reload();

    await expect(page.locator(TRANSLATION_PANEL)).toHaveAttribute('lang', 'en');
    await expect(page.locator(EN_BUTTON)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator(JA_BUTTON)).toHaveAttribute('aria-pressed', 'false');
    expect(new URL(page.url()).searchParams.get('lang')).toBe('en');
  });

  test('EN selection survives when the query param is stripped (localStorage fallback)', async ({
    page,
  }) => {
    // Seed EN via the toggle, then navigate back to the same path WITHOUT the
    // query param. localStorage should still resolve the language to EN.
    await page.goto(PAGE_PATH);
    await page.evaluate(() => {
      window.localStorage.clear();
    });
    await page.reload();

    await page.locator(EN_BUTTON).click();
    await expect(page.locator(TRANSLATION_PANEL)).toHaveAttribute('lang', 'en');

    // Re-visit without the query param.
    await page.goto(PAGE_PATH);
    await expect(page.locator(TRANSLATION_PANEL)).toHaveAttribute('lang', 'en');
    await expect(page.locator(EN_BUTTON)).toHaveAttribute('aria-pressed', 'true');
  });
});
