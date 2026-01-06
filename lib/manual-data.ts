/**
 * Manual Data Access Layer
 *
 * Provides functions to access manual data from the registry.
 * All functions now accept manualId parameter for multi-manual support.
 */

import type { ManualManifest, ManualPart, ManualPage, PartInfo } from './types/manual';
import { getManifest as getManifestFromRegistry, getPartData } from './manual-registry';

// Cache for loaded parts (per manual)
const partDataCache: Record<string, Record<string, ManualPart>> = {};

/**
 * Get the manifest for a specific manual
 */
export function getManifest(manualId: string): ManualManifest {
  return getManifestFromRegistry(manualId);
}

/**
 * Get the part info for a given global page number
 */
export function getPartInfoForPage(manualId: string, pageNum: number): PartInfo | null {
  const manifest = getManifest(manualId);
  const partInfo = manifest.parts.find(
    (part) => pageNum >= part.pageRange[0] && pageNum <= part.pageRange[1],
  );
  return partInfo || null;
}

/**
 * Get manual data for a specific part
 */
export function getManualPart(manualId: string, partNum: string): ManualPart {
  // Initialize cache for this manual if needed
  if (!partDataCache[manualId]) {
    partDataCache[manualId] = {};
  }

  // Check cache first
  if (partDataCache[manualId][partNum]) {
    return partDataCache[manualId][partNum];
  }

  // Load from registry (throws if not found)
  const partData = getPartData(manualId, partNum);

  // Cache the loaded part
  partDataCache[manualId][partNum] = partData;
  return partData;
}

/**
 * Get a specific page by global page number
 */
export function getManualPage(manualId: string, pageNum: number): ManualPage | null {
  // Find which part contains this page
  const partInfo = getPartInfoForPage(manualId, pageNum);
  if (!partInfo) {
    return null;
  }

  // Load the part data
  const part = getManualPart(manualId, partInfo.part);

  // Find the page within the part
  const page = part.pages.find((p) => p.pageNum === pageNum);
  return page || null;
}

/**
 * Get part data for a specific page number
 */
export function getPartForPage(manualId: string, pageNum: number): ManualPart | null {
  const partInfo = getPartInfoForPage(manualId, pageNum);
  if (!partInfo) {
    return null;
  }
  return getPartData(manualId, partInfo.part);
}

/**
 * Get total pages in the manual
 * Derived from the maximum page range in the manifest
 */
export function getTotalPages(manualId: string): number {
  const manifest = getManifest(manualId);
  // Calculate total pages from actual part ranges
  if (manifest.parts.length === 0) {
    return 0;
  }
  return Math.max(...manifest.parts.map((part) => part.pageRange[1]));
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
  const manifest = getManifest(manualId);
  const pageNumbers: { pageNum: string }[] = [];

  for (const part of manifest.parts) {
    const [startPage, endPage] = part.pageRange;
    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      pageNumbers.push({ pageNum: pageNum.toString() });
    }
  }

  return pageNumbers;
}
