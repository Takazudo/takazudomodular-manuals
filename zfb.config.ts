// zfb project config — coexists with next.config.js during the POC migration.
// The Next.js app (app/) and zfb app (pages/) build independently;
// promotion to sole renderer happens in Sub 9.
//
// `base: "/manuals/"` matches Next.js `basePath: '/manuals'`; the site is
// proxied through takazudomodular.com/manuals/* via a Netlify redirect.
// `site` is set so layouts can build canonical <link> tags and OpenGraph
// meta with correct absolute hrefs.

import { defineConfig } from '@takazudo/zfb/config';

export default defineConfig({
  framework: 'preact',
  base: '/manuals/',
  outDir: 'dist',
  publicDir: 'public',
  tailwind: { enabled: true },
  site: 'https://takazudomodular.com',
  // No `collections`: we keep the JSON data model + lib/manual-registry.ts
  // throughout the POC. Content collections can be added later if needed.
});
