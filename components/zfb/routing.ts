// Runtime URL + route helpers for the zfb mega-island.
//
// zfb has no automatic runtime base-path injection, so the island builds
// fully-qualified paths itself. BASE_PATH is derived from the single source of
// truth in `lib/base-path.ts` (also used by `zfb.config.ts`) with the trailing
// slash stripped — the island contract is "no trailing slash".

import { ZFB_BASE } from '@/lib/base-path';

/** Leading path segment matching `base` in zfb.config.ts. No trailing slash. */
const BASE_PATH = ZFB_BASE.replace(/\/$/, '');

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
 * Navigation capabilities for the current page. This is the single source of
 * the prev/next gating consumed by the nav/keyboard islands (the former
 * `lib/manual-data.getNavigationState` copy was removed in the zfb follow-ups).
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
