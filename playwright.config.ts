import { defineConfig, devices } from '@playwright/test';

// zfb dist is served on port 8030 via `pnpm serve` (same port as Next.js
// production build). The zfb preview dev server uses 3300 (set in
// zfb.config.ts), but for the full e2e suite we test the production dist
// because `pnpm serve` serves the finalized `out/` directory without a dev
// overlay. Build before running: `pnpm zfb:build && node
// scripts/zfb-finalize-build.js && pnpm serve`.
const ZFB_SERVE_URL = 'http://localhost:8030';

// Serve the already-finalized dist/ without rebuilding. CI builds the site
// once via the build-zfb composite action, then runs Playwright with
// SKIP_ZFB_BUILD=1 so the test runner doesn't rebuild from scratch.
const SERVE_DIST_CMD = 'pnpm dlx serve dist -l 8030';
// Full build chain (zfb build + finalize) before serving — the default for
// local runs where no dist exists yet.
const BUILD_AND_SERVE_CMD = `pnpm zfb:build && node scripts/zfb-finalize-build.js && ${SERVE_DIST_CMD}`;
const SKIP_ZFB_BUILD = process.env.SKIP_ZFB_BUILD === '1';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    // Updated from the Next.js dev URL (zmanuals.localhost:3100) to the zfb
    // production-serve URL (localhost:8030). CF Workers root scheme: routes are
    // now /{id}/page/{n} (no /manuals prefix). Asset paths live under
    // /{id}/pages/*.
    baseURL: ZFB_SERVE_URL,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // NOTE: The /manuals/{id}/page/{n} → /{id}/page/{n} 301 redirect is a CF
  // Workers redirect rule not replicated by `serve` locally. Tests that assert
  // it run against the served dist and follow redirects via Playwright's default
  // redirect-following behavior; no skip is needed for the 301 test because
  // `serve` will simply 404 the old path (the redirect test will fail locally
  // unless run against the CF Workers deployment).
  webServer: {
    // Build the zfb dist + finalize + serve in sequence so the test runner
    // starts against a fully baked production bundle. Set SKIP_ZFB_BUILD=1 to
    // skip the rebuild and serve an existing dist/ directly — Playwright still
    // owns the server lifecycle (start/stop), so no manual server step is
    // needed. CI uses this after building once via the build-zfb action.
    command: SKIP_ZFB_BUILD ? SERVE_DIST_CMD : BUILD_AND_SERVE_CMD,
    url: ZFB_SERVE_URL,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 120_000, // zfb build can take ~60s
  },
});
