#!/usr/bin/env node

/**
 * Finalize the zfb build for the root `/` deploy on Cloudflare Workers.
 *
 * WHY THIS EXISTS
 * ---------------
 * With `base: '/'` (lib/base-path.ts → zfb.config.ts), zfb emits the complete
 * site directly under dist/ root — HTML routes, hashed asset bundles, public/
 * contents (_headers, _redirects, images, JSON), and the CF adapter outputs
 * (_worker.js, _zfb_inner.mjs) all land at dist/ with no intermediate subdirectory.
 *
 * This script handles the two remaining tasks that zfb does NOT do:
 *
 *  1. Copy original source PDFs to `dist/<slug>/original.pdf`.
 *     (The landing page links to `/<slug>/original.pdf`; zfb has no equivalent.)
 *
 *  2. Emit `dist/.assetsignore` listing `_worker.js` and `_zfb_inner.mjs` so
 *     those files are NOT uploaded as public static assets (wrangler would serve
 *     them as downloadable files otherwise).
 *
 * DUAL OWNERSHIP OF .assetsignore
 * --------------------------------
 * This script writes dist/.assetsignore locally so `wrangler dev` and
 * `wrangler deploy --dry-run` work without a CI run. The CI deploy step (S5)
 * ALSO writes / verifies it unconditionally and MUST NOT assume this script
 * already ran — treat the two as independent writes of the same idempotent file.
 *
 * What this script does NOT do (no longer needed at base `/`):
 *  - Merge dist-root HTML into a dist/manuals/ subdirectory (was needed at
 *    base '/manuals/'; obsolete now that the site lives at root).
 *  - Copy _headers/_redirects up from a sub-path (they land at dist/ directly).
 */

import { readdirSync, mkdirSync, existsSync, copyFileSync, statSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const distDir = join(projectRoot, 'dist');
const manualPdfDir = join(projectRoot, 'manual-pdf');

if (!existsSync(distDir)) {
  console.error('dist/ does not exist. Run `zfb build` first.');
  process.exit(1);
}

console.log('Finalizing zfb build for root `/` Cloudflare Workers deploy...\n');

// ---------------------------------------------------------------------------
// Step 1: copy original source PDFs to dist/<slug>/original.pdf.
// ---------------------------------------------------------------------------
console.log('1. Copying original PDFs to dist/<slug>/original.pdf...');
let pdfCopied = 0;
if (existsSync(manualPdfDir)) {
  const slugs = readdirSync(manualPdfDir).filter((f) =>
    statSync(join(manualPdfDir, f)).isDirectory(),
  );
  for (const slug of slugs) {
    const sourceDir = join(manualPdfDir, slug);
    const pdf = readdirSync(sourceDir).find((f) => f.endsWith('.pdf') && !f.startsWith('.'));
    const destDir = join(distDir, slug);
    // Only copy where the manual was actually rendered (zfb emitted its pages).
    if (pdf && existsSync(destDir)) {
      copyFileSync(join(sourceDir, pdf), join(destDir, 'original.pdf'));
      pdfCopied++;
    } else if (pdf && !existsSync(destDir)) {
      // The landing page links to /<slug>/original.pdf unconditionally.
      // A missing dest dir means the manual was not emitted by zfb, so that
      // link will 404. This is likely a registry omission — add the manual to
      // both lib/manual-registry.ts and lib/zfb-registry.ts.
      console.warn(
        `   WARNING: manual-pdf/${slug}/${pdf} found but dist/${slug}/ was not emitted — ` +
          `skipping original.pdf copy. The landing-page link to /${slug}/original.pdf will 404.`,
      );
    }
  }
}
console.log(`   Copied ${pdfCopied} original PDF(s)`);

// ---------------------------------------------------------------------------
// Step 2: emit dist/.assetsignore to exclude CF adapter internals from the
// public asset directory. Dual ownership: CI (S5) also writes this file
// unconditionally — do NOT treat this local write as authoritative.
// ---------------------------------------------------------------------------
console.log('2. Writing dist/.assetsignore (belt-and-suspenders; CI also writes this)...');
const assetsIgnoreContent = `# Files emitted by @takazudo/zfb-adapter-cloudflare that must NOT be uploaded
# as public static assets — they are the worker's runtime bundle.
# Dual ownership: scripts/zfb-finalize-build.js (local) and the CI deploy-prep
# step (S5) both write this file. Neither side may assume the other already ran.
_worker.js
_zfb_inner.mjs
`;
writeFileSync(join(distDir, '.assetsignore'), assetsIgnoreContent);
console.log('   Wrote dist/.assetsignore');

console.log('\nFinalize complete.');

// ---------------------------------------------------------------------------
// Verify the resulting shape.
// ---------------------------------------------------------------------------
console.log('\nVerifying structure:');

// Sample manuals to spot-check: largest (oxi-one-mk2), smallest (ai022-harmonic-mixer),
// bilingual (oxi-one-mk2), and a few small manuals.
const SAMPLE_MANUALS = [
  { slug: 'oxi-one-mk2', page: 1, hasPdf: true },
  { slug: 'ai022-harmonic-mixer', page: 1, hasPdf: false },
  { slug: 'addac106-tnoise', page: 1, hasPdf: false },
  { slug: 'weston-2v2', page: 1, hasPdf: false },
];

// At base `/`, everything is directly under dist/ root — no `manuals/` prefix.
const checks = ['index.html', '_headers', '_redirects'];
for (const { slug, page, hasPdf } of SAMPLE_MANUALS) {
  checks.push(`${slug}/index.html`);
  checks.push(`${slug}/page/${page}/index.html`);
  checks.push(`${slug}/pages/page-001.png`);
  if (hasPdf) {
    checks.push(`${slug}/original.pdf`);
  }
}

let ok = true;
for (const rel of checks) {
  const exists = existsSync(join(distDir, rel));
  if (!exists) ok = false;
  console.log(`  ${exists ? 'OK ' : 'MISSING '} dist/${rel}`);
}
if (!ok) {
  console.error('\nFinalize verification FAILED.');
  process.exit(1);
}

// Count emitted HTML files for the build report.
let htmlCount = 0;
function countHtml(dir) {
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        countHtml(join(dir, entry.name));
      } else if (entry.name.endsWith('.html')) {
        htmlCount++;
      }
    }
  } catch {
    // ignore unreadable dirs
  }
}
countHtml(distDir);
console.log(`\nEmitted HTML count: ${htmlCount} files under dist/`);
