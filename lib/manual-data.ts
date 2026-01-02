import type { ManualPart, ManualPage } from './types/manual';
import part01Data from '@/data/part-01/manual.json';

/**
 * Get manual data for a specific part
 */
export function getManualPart(partNum: string): ManualPart {
  // For now, we only have part 01
  if (partNum === '01') {
    return part01Data as ManualPart;
  }

  throw new Error(`Manual part ${partNum} not found`);
}

/**
 * Get a specific page from a manual part
 */
export function getManualPage(partNum: string, pageNum: number): ManualPage | null {
  const part = getManualPart(partNum);
  const page = part.pages.find((p) => p.pageNum === pageNum);
  return page || null;
}

/**
 * Get all available parts
 */
export function getAvailableParts(): string[] {
  return ['01'];
}

/**
 * Get total pages for a part
 */
export function getTotalPages(partNum: string): number {
  const part = getManualPart(partNum);
  return part.totalPages;
}
