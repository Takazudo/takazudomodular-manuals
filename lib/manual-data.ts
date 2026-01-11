/**
 * Manual Data Access Layer
 *
 * Provides functions to access manual data from the registry.
 * All functions accept manualId parameter for multi-manual support.
 */

import type { ManualManifest, ManualPage } from './types/manual';
import { getManifest as getManifestFromRegistry, getPagesData } from './manual-registry';

// Cache for loaded pages (per manual)
const pagesCache: Record<string, ManualPage[]> = {};

/**
 * Get the manifest for a specific manual
 */
export function getManifest(manualId: string): ManualManifest {
  return getManifestFromRegistry(manualId);
}

/**
 * Get all pages for a manual (with caching)
 */
export function getAllPages(manualId: string): ManualPage[] {
  if (pagesCache[manualId]) {
    return pagesCache[manualId];
  }
  const pagesData = getPagesData(manualId);
  pagesCache[manualId] = pagesData.pages;
  return pagesData.pages;
}

/**
 * Get a specific page by global page number
 */
export function getManualPage(manualId: string, pageNum: number): ManualPage | null {
  const pages = getAllPages(manualId);
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
