/**
 * zfb build-time registry for all manuals.
 *
 * **Single source of truth (codegen)**
 *
 * The static import list + REGISTRY map live in `zfb-registry.generated.ts`,
 * produced by `node scripts/gen-registry.js` (a.k.a. `pnpm run gen:registry`),
 * which scans `public/<slug>/data/` for manifest.json + pages-ja.json. Adding a
 * manual means dropping its files under `public/` and regenerating — never hand-
 * editing an import list. This file owns only the public API below.
 *
 * **Bundle-size design (critical — do not break this)**
 *
 * The embedded V8 renderer evaluates the bundled module graph to run paths().
 * Importing too much JSON (~10MB+) in static imports causes a silent V8 500.
 * The generated module is carefully scoped to avoid that:
 *
 *   - Manifests only: ~500 bytes × 52 = ~26KB total. Always safe.
 *   - pages-ja.json: ~4MB total across 52 manuals. Safe (well under 10MB).
 *   - pages-en.json: ~3.25MB — NOT imported. EN is fetched at runtime by
 *     ManualApp via fetch(), never needed in the bundle.
 *
 * Combined bundle: manifests (~26KB) + pages-ja (~4MB) + JS overhead ≈ 4–5MB.
 * This is comfortably under the ~10MB V8 silent-500 threshold observed in #131.
 * The codegen NEVER emits a pages-en.json import — do not add one.
 *
 * **Why no node:fs in paths()**
 * The embedded V8 host stubs node:fs — every fs call throws at runtime.
 * Static imports are the only reliable way to load data in the V8 context.
 *
 * **hasEnglish**
 * All 52 current manuals have pages-en.json and carry `hasEnglish: true` in
 * their manifest (backfilled by scripts/backfill-has-english.js; new manuals
 * get the field from the PDF pipeline at manifest generation time).
 * hasEnglish() reads manifest.hasEnglish and falls back to false so a future
 * JA-only manual (no pages-en.json) will not have its EN toggle enabled.
 */

import type { ManualManifest, ManualPage } from './types/manual';
import { REGISTRY } from './zfb-registry.generated';

// ── Public API ─────────────────────────────────────────────────────────────

/** All manual IDs, sorted alphabetically. */
export function getAvailableManuals(): string[] {
  return Object.keys(REGISTRY).sort();
}

/** Get manifest for a specific manual. Throws for unknown IDs. */
export function getManifest(manualId: string): ManualManifest {
  const entry = REGISTRY[manualId];
  if (!entry) throw new Error(`Manual not found: ${manualId}`);
  return entry.manifest;
}

/**
 * Get JA pages array for a specific manual.
 * Used by paths() in [pageNum].tsx to enumerate all viewer routes.
 */
export function getPagesJa(manualId: string): ManualPage[] {
  const entry = REGISTRY[manualId];
  if (!entry) throw new Error(`Manual not found: ${manualId}`);
  return entry.pagesJa.pages;
}

/**
 * Check if a manual has English pages available.
 *
 * Reads `manifest.hasEnglish` so a future JA-only manual (no pages-en.json)
 * correctly returns false even though it is present in REGISTRY.
 * Falls back to false for unknown manual IDs.
 */
export function hasEnglish(manualId: string): boolean {
  return REGISTRY[manualId]?.manifest.hasEnglish ?? false;
}
