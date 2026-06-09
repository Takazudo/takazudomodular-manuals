#!/usr/bin/env node

// Codegen for the zfb build-time manual registry.
//
// Scans public/*/data/ for directories that contain BOTH manifest.json and
// pages-ja.json, and generates lib/zfb-registry.generated.ts: the static
// import list + REGISTRY map that lib/zfb-registry.ts re-exports through its
// public API (getAvailableManuals / getManifest / getPagesJa / hasEnglish).
//
// Single source of truth: adding a manual means dropping its files under
// public/{slug}/data/ and re-running this script. No hand-editing of the
// import list.
//
// **Bundle constraint (critical — do not change):** this generator imports
// manifest.json (~26KB total) and pages-ja.json (~4MB total) ONLY. pages-en.json
// is intentionally NEVER statically imported — it is ~3.25MB and would push the
// bundle past zfb's ~10MB embedded-V8 limit. EN pages are fetched at runtime by
// ManualApp. Keeping pages-en out of the static graph is what keeps the build
// green; see lib/zfb-registry.ts for the full rationale.
//
// Output is idempotent: the emitted file is already prettier-conformant
// (single quotes, trailing commas, 2-space indent, LF) so running the script,
// formatting, and running again yields zero diff.

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT = join(__dirname, '..');
const PUBLIC_DIR = join(ROOT, 'public');
const OUTPUT_PATH = join(ROOT, 'lib', 'zfb-registry.generated.ts');

// Discover manuals: a directory under public/ qualifies only if it has both
// data/manifest.json and data/pages-ja.json. This naturally excludes non-manual
// dirs such as public/img/.
const slugs = readdirSync(PUBLIC_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .filter((slug) => {
    const dataDir = join(PUBLIC_DIR, slug, 'data');
    return existsSync(join(dataDir, 'manifest.json')) && existsSync(join(dataDir, 'pages-ja.json'));
  })
  .sort();

if (slugs.length === 0) {
  console.error('gen-registry: no manuals found under public/*/data/. Aborting.');
  process.exit(1);
}

// Indexed binding names (m0/p0 …) are collision-proof and deterministic — the
// local import identifiers are cosmetic; only the REGISTRY string keys matter
// at runtime.
const manifestImports = [];
const pagesJaImports = [];

slugs.forEach((slug, i) => {
  manifestImports.push(`import m${i} from '@/public/${slug}/data/manifest.json';`);
  pagesJaImports.push(`import p${i} from '@/public/${slug}/data/pages-ja.json';`);
});

// Emit object keys exactly as prettier would (singleQuote + quoteProps
// "as-needed"): a slug that is a valid bare JS identifier is unquoted, every
// other slug gets single quotes. All slugs here are [a-z0-9-]+ so no escaping
// is ever needed. This keeps the committed file == generator output AND
// prettier-clean, so the generate→format→generate idempotency check is a no-op.
const formatKey = (slug) => (/^[A-Za-z_$][\w$]*$/.test(slug) ? slug : `'${slug}'`);

const registryEntries = slugs
  .map(
    (slug, i) =>
      `  ${formatKey(slug)}: {\n` +
      `    manifest: m${i} as unknown as ManualManifest,\n` +
      `    pagesJa: p${i} as unknown as ManualPagesData,\n` +
      `  },`,
  )
  .join('\n');

const header = `/**
 * GENERATED FILE — DO NOT EDIT BY HAND.
 *
 * Regenerate with: node scripts/gen-registry.js
 *
 * Scans public/<slug>/data for manifest.json + pages-ja.json and emits the
 * static import list + REGISTRY map consumed by lib/zfb-registry.ts.
 *
 * pages-en.json is intentionally NOT imported here (bundle-size constraint;
 * see lib/zfb-registry.ts). Do not add EN page imports to this file.
 */

import type { ManualManifest, ManualPagesData } from './types/manual';

export interface RegistryEntry {
  manifest: ManualManifest;
  pagesJa: ManualPagesData;
}`;

const body = `${header}

// ── Manifests (~26KB total) ────────────────────────────────────────────────
${manifestImports.join('\n')}

// ── pages-ja.json (~4MB total) ─────────────────────────────────────────────
${pagesJaImports.join('\n')}

export const REGISTRY: Record<string, RegistryEntry> = {
${registryEntries}
};
`;

writeFileSync(OUTPUT_PATH, body, 'utf-8');

console.log(`gen-registry: wrote ${slugs.length} manuals to lib/zfb-registry.generated.ts`);
