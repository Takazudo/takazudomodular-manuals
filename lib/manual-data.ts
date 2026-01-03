import type { ManualManifest, ManualPart, ManualPage, PartInfo } from './types/manual';
import manifestDataRaw from '@/data/translations/manifest.json';

// Import all part data
import part01DataRaw from '@/data/translations/part-01.json';
import part02DataRaw from '@/data/translations/part-02.json';
import part03DataRaw from '@/data/translations/part-03.json';
import part04DataRaw from '@/data/translations/part-04.json';
import part05DataRaw from '@/data/translations/part-05.json';
import part06DataRaw from '@/data/translations/part-06.json';
import part07DataRaw from '@/data/translations/part-07.json';
import part08DataRaw from '@/data/translations/part-08.json';
import part09DataRaw from '@/data/translations/part-09.json';
import part10DataRaw from '@/data/translations/part-10.json';

// Type-safe wrappers for JSON imports
const manifestData = manifestDataRaw as unknown as ManualManifest;
const part01Data = part01DataRaw as unknown as ManualPart;
const part02Data = part02DataRaw as unknown as ManualPart;
const part03Data = part03DataRaw as unknown as ManualPart;
const part04Data = part04DataRaw as unknown as ManualPart;
const part05Data = part05DataRaw as unknown as ManualPart;
const part06Data = part06DataRaw as unknown as ManualPart;
const part07Data = part07DataRaw as unknown as ManualPart;
const part08Data = part08DataRaw as unknown as ManualPart;
const part09Data = part09DataRaw as unknown as ManualPart;
const part10Data = part10DataRaw as unknown as ManualPart;

// Part data mapping
const partDataMap: Record<string, ManualPart> = {
  '01': part01Data,
  '02': part02Data,
  '03': part03Data,
  '04': part04Data,
  '05': part05Data,
  '06': part06Data,
  '07': part07Data,
  '08': part08Data,
  '09': part09Data,
  '10': part10Data,
};

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

  // Load from part data map
  const partData = partDataMap[partNum];

  if (!partData) {
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
