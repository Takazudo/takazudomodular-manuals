/**
 * Centralized manual configuration
 * All manual-related paths and IDs should reference this file
 */

export const MANUAL_ID = 'oxi-one-mk2';
export const MANUAL_BASE_PATH = `/manuals/${MANUAL_ID}`;
export const MANUAL_DATA_PATH = `/public/manuals/${MANUAL_ID}/data`;
export const MANUAL_PAGES_PATH = `/public/manuals/${MANUAL_ID}/pages`;
export const MANUAL_PROCESSING_PATH = `/public/manuals/${MANUAL_ID}/processing`;

/**
 * Get the full page path for a given page number
 */
export function getPagePath(pageNum: number): string {
  return `${MANUAL_BASE_PATH}/page/${pageNum}`;
}

/**
 * Get the data file path for a given part
 */
export function getPartDataPath(partNum: string): string {
  return `${MANUAL_DATA_PATH}/part-${partNum}.json`;
}
