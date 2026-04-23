/**
 * Manual Data Access Layer
 *
 * Provides functions to access manual data from the registry.
 * All functions accept manualId parameter for multi-manual support.
 *
 * Page data is language-scoped. Public readers accept an optional `lang`
 * argument that defaults to 'ja' to stay backwards-compatible with callers
 * that pre-date the bilingual rollout.
 */

import type { ManualLanguage } from './manual-registry';
import type { ManualManifest, ManualPage } from './types/manual';
import { getManifest as getManifestFromRegistry, getPagesData } from './manual-registry';

// Cache for loaded pages, keyed by `${manualId}::${lang}` so JA and EN
// don't evict each other.
const pagesCache: Record<string, ManualPage[]> = {};

function cacheKey(manualId: string, lang: ManualLanguage): string {
  return `${manualId}::${lang}`;
}

/**
 * Get the manifest for a specific manual
 */
export function getManifest(manualId: string): ManualManifest {
  return getManifestFromRegistry(manualId);
}

/**
 * Get all pages for a manual in the given language (with caching per
 * `(manualId, lang)` tuple).
 *
 * Defaults to 'ja'. Falls back to JA when 'en' is requested but the manual
 * has no EN translation — see `getPagesData` for fallback semantics.
 */
export function getAllPages(manualId: string, lang: ManualLanguage = 'ja'): ManualPage[] {
  const key = cacheKey(manualId, lang);
  if (pagesCache[key]) {
    return pagesCache[key];
  }
  const pagesData = getPagesData(manualId, lang);
  pagesCache[key] = pagesData.pages;
  return pagesData.pages;
}

/**
 * Get a specific page by global page number.
 * Defaults to 'ja'.
 */
export function getManualPage(
  manualId: string,
  pageNum: number,
  lang: ManualLanguage = 'ja',
): ManualPage | null {
  const pages = getAllPages(manualId, lang);
  return pages.find((p) => p.pageNum === pageNum) || null;
}

/**
 * Get total pages in the manual
 */
export function getTotalPages(manualId: string): number {
  const manifest = getManifest(manualId);
  return manifest.totalPages;
}

/**
 * Check if a page exists
 */
export function pageExists(manualId: string, pageNum: number): boolean {
  const totalPages = getTotalPages(manualId);
  return pageNum >= 1 && pageNum <= totalPages;
}

/**
 * Get navigation capabilities for a given page
 */
export function getNavigationState(currentPage: number, totalPages: number) {
  return {
    canGoToPrev: currentPage > 1,
    canGoToNext: currentPage < totalPages,
  };
}

/**
 * Get all page numbers for a manual (for generateStaticParams)
 */
export function getAllPageNumbers(manualId: string): { pageNum: string }[] {
  const totalPages = getTotalPages(manualId);
  return Array.from({ length: totalPages }, (_, i) => ({
    pageNum: (i + 1).toString(),
  }));
}
