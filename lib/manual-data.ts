import type { ManualManifest, ManualPart, ManualPage, PartInfo } from './types/manual';
import manifestData from '@/data/translations/manifest.json';

// Import all part data (for now, only part-01 exists)
import part01Data from '@/data/translations/part-01.json';

// Cache for loaded parts
const partDataCache: Record<string, ManualPart> = {};

/**
 * Get the manifest
 */
export function getManifest(): ManualManifest {
  return manifestData as ManualManifest;
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
    partData = part01Data as ManualPart;
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
 */
export function getTotalPages(): number {
  const manifest = getManifest();
  return manifest.totalPages;
}

/**
 * Check if a page exists
 */
export function pageExists(pageNum: number): boolean {
  const manifest = getManifest();
  return pageNum >= 1 && pageNum <= manifest.totalPages;
}

/**
 * Get navigation info for a page
 */
export function getPageNavigation(pageNum: number) {
  const manifest = getManifest();
  return {
    hasPrev: pageNum > 1,
    hasNext: pageNum < manifest.totalPages,
    prevPage: pageNum - 1,
    nextPage: pageNum + 1,
    totalPages: manifest.totalPages,
  };
}
