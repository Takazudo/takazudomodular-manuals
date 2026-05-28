#!/usr/bin/env node

/**
 * Finalize the zfb build for the `/manuals` sub-path deploy on Cloudflare Pages.
 *
 * WHY THIS EXISTS
 * ---------------
 * zfb's `base: '/manuals/'` (zfb.config.ts) only prefixes *asset URLs* and the
 * copy destination of `public/` — it does NOT nest the rendered HTML route
 * output. (Confirmed by zfb docs: api/define-config.mdx — "`base` prefixes
 * asset URLs"; concepts/static-assets.mdx — `copy_public_dir` honours the
 * prefix.) So a raw `zfb build` produces a SPLIT tree:
 *
 *   dist/<slug>/index.html          HTML routes      — NO base prefix in path
 *   dist/<slug>/page/<n>/index.html viewer HTML       — NO base prefix in path
 *   dist/index.html                 manual index      — NO base prefix in path
 *   dist/assets/<hash>.{css,js}     hashed bundles     — NO base prefix in path
 *   dist/manuals/<slug>/{data,pages,thumbs}/  public/ assets — base prefix
 *   dist/manuals/_headers, _redirects          public/ Cloudflare files
 *
 * but every URL referenced inside the HTML is absolute `/manuals/*`
 * (assets at `/manuals/assets/*`, public assets at `/manuals/<slug>/...`).
 * Served as-is, `/manuals/oxi-one-mk2/page/1` and `/manuals/assets/*` 404
 * because the HTML and hashed bundles physically sit at dist root, not under
 * dist/manuals/.
 *
 * WHAT THIS DOES (mirrors the proven Next.js restructure-build.js model)
 * ---------------------------------------------------------------------
 *  1. Merge every stranded dist-root entry (HTML route dirs, `assets/`,
 *     `index.html`, `__zfb/`) INTO the existing `dist/manuals/` tree, so the
 *     whole site lives under dist/manuals/ and matches the `/manuals/*` URLs.
 *     `cpSync({recursive})` merges into existing dirs; the HTML subtree
 *     (`page/`) and the public subtree (`pages/`, `data/`, `thumbs/`) are
 *     disjoint, so nothing clobbers.
 *  2. Copy original source PDFs to `dist/manuals/<slug>/original.pdf`
 *     (the landing page links to `/manuals/<slug>/original.pdf`). zfb has no
 *     equivalent of copy-original-pdfs.js, so this step carries it over.
 *  3. Copy `_headers` and `_redirects` from `dist/manuals/` UP TO `dist/` root.
 *     Cloudflare Pages requires these control files at the DEPLOYMENT ROOT,
 *     not under the base path. (Same requirement restructure-build.js handles
 *     for the Next path — base nesting does not make this obsolete.)
 *
 * NOTE FOR #136 CUTOVER: this is the zfb replacement for restructure-build.js
 * + copy-original-pdfs.js. It is NOT wired into `package.json` `build` yet
 * (Next still owns that). Sub 9 (#136) replaces the build script to run
 * `zfb build && node scripts/zfb-finalize-build.js`.
 */

import { readdirSync, mkdirSync, existsSync, rmSync, copyFileSync, statSync, cpSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const distDir = join(projectRoot, 'dist');
const manualsDir = join(distDir, 'manuals');
const manualPdfDir = join(projectRoot, 'manual-pdf');

// Files Cloudflare Pages requires at the deployment ROOT (not under base).
const CF_FILES = ['_headers', '_redirects'];

if (!existsSync(distDir)) {
  console.error('dist/ does not exist. Run `zfb build` first.');
  process.exit(1);
}

console.log('Finalizing zfb build for /manuals sub-path deploy...\n');

// ---------------------------------------------------------------------------
// Step 1: merge stranded dist-root output into dist/manuals/.
// ---------------------------------------------------------------------------
if (!existsSync(manualsDir)) {
  // No public/ assets were emitted under base — create the target so the
  // merge has a destination.
  mkdirSync(manualsDir, { recursive: true });
}

console.log('1. Merging dist-root HTML + assets into dist/manuals/...');
const rootEntries = readdirSync(distDir).filter((name) => name !== 'manuals');
for (const name of rootEntries) {
  const src = join(distDir, name);
  const dest = join(manualsDir, name);
  // recursive cpSync merges into existing directories rather than failing.
  cpSync(src, dest, { recursive: true });
  rmSync(src, { recursive: true, force: true });
}
console.log(`   Merged ${rootEntries.length} entries into dist/manuals/`);

// Guard against the classic double-nest bug.
if (existsSync(join(manualsDir, 'manuals'))) {
  console.error('   ERROR: dist/manuals/manuals/ exists — double-nest bug.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Step 2: copy original source PDFs to dist/manuals/<slug>/original.pdf.
// ---------------------------------------------------------------------------
console.log('2. Copying original PDFs to dist/manuals/<slug>/original.pdf...');
let pdfCopied = 0;
if (existsSync(manualPdfDir)) {
  const slugs = readdirSync(manualPdfDir).filter((f) =>
    statSync(join(manualPdfDir, f)).isDirectory(),
  );
  for (const slug of slugs) {
    const sourceDir = join(manualPdfDir, slug);
    const pdf = readdirSync(sourceDir).find((f) => f.endsWith('.pdf') && !f.startsWith('.'));
    const destDir = join(manualsDir, slug);
    // Only copy where the manual was actually rendered (POC = oxi-one-mk2).
    if (pdf && existsSync(destDir)) {
      copyFileSync(join(sourceDir, pdf), join(destDir, 'original.pdf'));
      pdfCopied++;
    }
  }
}
console.log(`   Copied ${pdfCopied} original PDF(s)`);

// ---------------------------------------------------------------------------
// Step 3: copy Cloudflare control files up to dist/ root.
// ---------------------------------------------------------------------------
console.log('3. Copying Cloudflare files to dist/ root...');
for (const file of CF_FILES) {
  const src = join(manualsDir, file);
  if (existsSync(src)) {
    copyFileSync(src, join(distDir, file));
    console.log(`   Copied ${file} to dist/ root`);
  } else {
    console.warn(`   WARNING: ${file} not found under dist/manuals/ — skipped`);
  }
}

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

const checks = ['manuals/index.html', '_headers', '_redirects'];
for (const { slug, page, hasPdf } of SAMPLE_MANUALS) {
  checks.push(`manuals/${slug}/index.html`);
  checks.push(`manuals/${slug}/page/${page}/index.html`);
  checks.push(`manuals/${slug}/pages/page-001.png`);
  if (hasPdf) {
    checks.push(`manuals/${slug}/original.pdf`);
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
countHtml(manualsDir);
console.log(`\nEmitted HTML count: ${htmlCount} files under dist/manuals/`);
