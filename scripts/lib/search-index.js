/**
 * Search Index Shared Helpers
 *
 * Common helpers used by both the single-slug search index generator
 * (`scripts/pdf-search-index.js`) and the all-manuals mode
 * (`scripts/pdf-search-index-all.js`) so that both emit byte-identical
 * output for identical input.
 */

import { createHash } from 'crypto';

/**
 * Serialize an array of search index entries to the canonical pretty-formatted
 * JSON string we commit to disk: 2-space indent, trailing newline.
 *
 * Determinism matters here — the content hash stamped into manifest.json is
 * derived from exactly this string, so all producers MUST go through this
 * function (no ad-hoc JSON.stringify with different settings).
 *
 * @param {Array<object>} entries
 * @returns {string}
 */
export function serializeSearchIndex(entries) {
  return JSON.stringify(entries, null, 2) + '\n';
}

/**
 * Serialize a manifest object to the canonical pretty-formatted JSON string
 * we commit to disk: 2-space indent, trailing newline. Matches Prettier's
 * default JSON output.
 *
 * @param {object} manifest
 * @returns {string}
 */
export function serializeManifest(manifest) {
  return JSON.stringify(manifest, null, 2) + '\n';
}

/**
 * Compute the SHA-1 hex digest of an arbitrary string. Used as the search
 * index content version stamped into manifest.json so that static clients
 * can cache-bust reliably whenever the index content changes.
 *
 * @param {string} str
 * @returns {string} hex-encoded SHA-1 hash
 */
export function sha1(str) {
  return createHash('sha1').update(str).digest('hex');
}

/**
 * Return a shallow-copied manifest object with `searchIndexVersion` set to the
 * given hash. All other existing fields — including arbitrary extras and
 * timestamp fields like `lastUpdated`, `updatedAt`, and `source.processedAt` —
 * are preserved unchanged. If the input is not an object, an object with only
 * `searchIndexVersion` is returned.
 *
 * This function intentionally does NOT touch `source` (no deep copy needed) —
 * callers who plan to mutate nested fields should do so themselves.
 *
 * @param {object} manifest - parsed manifest.json contents (may lack searchIndexVersion)
 * @param {string} hash - SHA-1 hex digest from `sha1(serializeSearchIndex(entries))`
 * @returns {object} updated manifest (shallow copy)
 */
export function updateManifestSearchIndexVersion(manifest, hash) {
  const base = manifest && typeof manifest === 'object' ? manifest : {};
  return { ...base, searchIndexVersion: hash };
}
