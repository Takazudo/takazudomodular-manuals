// `base` matches the Netlify proxy mount: takazudomodular.com/manuals/*.
// `site` is used by layouts for canonical <link> and OpenGraph meta.
// The base value is shared with `components/zfb/routing.ts` via
// `lib/base-path.ts` to keep the two in sync without importing this config
// (which may pull build-only deps) into client islands.

import { defineConfig } from '@takazudo/zfb/config';
import { ZFB_BASE } from './lib/base-path.js';

export default defineConfig({
  framework: 'preact',
  base: ZFB_BASE,
  outDir: 'dist',
  publicDir: 'public',
  tailwind: { enabled: true },
  site: 'https://takazudomodular.com',
  // Port 3300 avoids collision with Next.js (3100) and serve (8030).
  port: 3300,
  // No `collections`: we keep the JSON data model + lib/zfb-registry.ts
  // (code-generated from public/*/data via scripts/gen-registry.js).
  // Content collections can be added later if needed.
});
