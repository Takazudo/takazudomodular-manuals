// Runtime URL + route helpers for the zfb mega-island.
//
// The Next.js app relies on `basePath: '/manuals'` to prefix every route and
// asset automatically. zfb has no equivalent runtime injection, so the island
// builds fully-qualified paths itself. The base segment must match
// `zfb.config.ts` `base: '/manuals/'`.
//
// Sub 5 (#131) does the full asset-url adaptation; this is the minimal subset
// the island needs for client-side navigation and runtime data/asset fetches.

/** Leading path segment matching `base` in zfb.config.ts. No trailing slash. */
const BASE_PATH = '/manuals';

/**
 * Prefix a root-relative asset/data URL with the zfb base path. External URLs
 * (http/https) and already-prefixed URLs pass through unchanged. Mirrors the
 * Next.js `withBasePath` so page-image `src` and JSON fetch URLs resolve under
 * the proxied `/manuals/*` mount.
 */
export function withBasePath(url: string): string {
  if (url.startsWith('http')) {
    return url;
  }
  if (url === BASE_PATH || url.startsWith(`${BASE_PATH}/`)) {
    return url;
  }
  const normalized = url.startsWith('/') ? url : `/${url}`;
  return `${BASE_PATH}${normalized}`;
}

/** Base route for a manual's index page, including the base path. */
export function getManualBasePath(manualId: string): string {
  return `${BASE_PATH}/${manualId}`;
}

/** Full page route for a manual page, including the base path. */
export function getPagePath(manualId: string, pageNum: number): string {
  return `${getManualBasePath(manualId)}/page/${pageNum}`;
}

/**
 * Navigation capabilities for the current page. Mirrors
 * `lib/manual-data.getNavigationState` so the ported nav components keep
 * identical prev/next gating without importing the Next-app data layer.
 */
export function getNavigationState(currentPage: number, totalPages: number) {
  return {
    canGoToPrev: currentPage > 1,
    canGoToNext: currentPage < totalPages,
  };
}

/**
 * Derive thumbnail image path from a full page image path. Thumbnails are
 * language-independent and always derived from the JA page list.
 * `/oxi-one-mk2/pages/page-001.png` → `/oxi-one-mk2/thumbs/thumb-001.png`
 */
export function getThumbImage(image: string): string {
  return image.replace('/pages/page-', '/thumbs/thumb-');
}
