import type { ManualManifest, ManualPart, ManualPage, PartInfo } from './types/manual';
import manifestDataRaw from '@/data/translations/manifest.json';

// Import all part data (for now, only part-01 exists)
import part01DataRaw from '@/data/translations/part-01.json';

// Type-safe wrappers for JSON imports
const manifestData = manifestDataRaw as unknown as ManualManifest;
const part01Data = part01DataRaw as unknown as ManualPart;

// Cache for loaded parts
const partDataCache: Record<string, ManualPart> = {};

/**
 * Get the manifest
 */
export function getManifest(): ManualManifest {
  return manifestData;
}

/**
 * Get the part info for a given global page number
 */
export function getPartInfoForPage(pageNum: number): PartInfo | null {
  const manifest = getManifest();
  const partInfo = manifest.parts.find(
    (part) => pageNum >= part.pageRange[0] && pageNum <= part.pageRange[1],
  );
  return partInfo || null;
}

/**
 * Get manual data for a specific part
 */
export function getManualPart(partNum: string): ManualPart {
  // Check cache first
  if (partDataCache[partNum]) {
    return partDataCache[partNum];
  }

  // For now, we only have part 01
  // In the future, this will dynamically import based on partNum
  let partData: ManualPart;

  if (partNum === '01') {
    partData = part01Data;
  } else {
    throw new Error(`Manual part ${partNum} not found`);
  }

  // Cache the loaded part
  partDataCache[partNum] = partData;
  return partData;
}

/**
 * Get a specific page by global page number (1-280)
 */
export function getManualPage(pageNum: number): ManualPage | null {
  // Find which part contains this page
  const partInfo = getPartInfoForPage(pageNum);
  if (!partInfo) {
    return null;
  }

  // Load the part data
  const part = getManualPart(partInfo.part);

  // Find the page within the part
  const page = part.pages.find((p) => p.pageNum === pageNum);
  return page || null;
}

/**
 * Get total pages in the manual
 * Derived from the maximum page range in the manifest
 */
export function getTotalPages(): number {
  const manifest = getManifest();
  // Calculate total pages from actual part ranges
  if (manifest.parts.length === 0) {
    return 0;
  }
  return Math.max(...manifest.parts.map((part) => part.pageRange[1]));
}

/**
 * Check if a page exists
 */
export function pageExists(pageNum: number): boolean {
  const totalPages = getTotalPages();
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
