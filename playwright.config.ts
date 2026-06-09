import { defineConfig, devices } from '@playwright/test';

// zfb dist is served on port 8030 via `pnpm serve` (same port as Next.js
// production build). The zfb preview dev server uses 3300 (set in
// zfb.config.ts), but for the full e2e suite we test the production dist
// because `pnpm serve` serves the finalized `out/` directory without a dev
// overlay. Build before running: `pnpm zfb:build && node
// scripts/zfb-finalize-build.js && pnpm serve`.
const ZFB_SERVE_URL = 'http://localhost:8030';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    // Updated from the Next.js dev URL (zmanuals.localhost:3100) to the zfb
    // production-serve URL (localhost:8030). Routes are identical:
    // /manuals/{id}/page/{n}. Asset paths changed from /manuals/_next/static/*
    // to /manuals/assets/* but that is transparent to Playwright page loads.
    baseURL: ZFB_SERVE_URL,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // NOTE: The /manuals/page/N redirect and / 302 are not processed by `serve`
  // locally (they are Cloudflare Pages / Netlify redirect rules). If any e2e
  // tests assert those redirects, mark them with test.skip in non-CI mode or
  // move them to a separate spec that runs only against the deployed preview.
  webServer: {
    // Build the zfb dist + finalize + serve in sequence so the test runner
    // starts against a fully baked production bundle. If a dist already exists
    // and you want to skip the rebuild, set SKIP_ZFB_BUILD=1 and start the
    // server manually before running playwright.
    command: 'pnpm zfb:build && node scripts/zfb-finalize-build.js && pnpm dlx serve dist -l 8030',
    url: ZFB_SERVE_URL,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 120_000, // zfb build can take ~60s
  },
});
