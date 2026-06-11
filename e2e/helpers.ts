import { expect, type Page } from '@playwright/test';

/**
 * Wait until the manual-app island has fetched page data and swapped in the
 * interactive viewer. In-manual navigation (arrow keys, prev/next, selector)
 * is gated on that fetch (`navDisabled` in manual-app.tsx), so interacting
 * before this point silently does nothing. The page selector is the
 * deterministic signal: the SSR shell renders no PageNavigation at all, and
 * the selector only appears enabled once the real viewer is mounted.
 */
export async function waitForViewerNavReady(page: Page): Promise<void> {
  await expect(page.getByTestId('page-selector')).toBeEnabled({ timeout: 15000 });
}
