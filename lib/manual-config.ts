/**
 * Centralized manual configuration
 * All manual-related paths should reference this file
 */

/**
 * Get the base path for a specific manual
 */
export function getManualBasePath(manualId: string): string {
  return `/manuals/${manualId}`;
}

/**
 * Get the full page path for a given page number in a specific manual
 */
export function getPagePath(manualId: string, pageNum: number): string {
  return `${getManualBasePath(manualId)}/page/${pageNum}`;
}

/**
 * Get the data directory path for a specific manual
 */
export function getManualDataPath(manualId: string): string {
  return `/public/manuals/${manualId}/data`;
}

/**
 * Get the pages directory path for a specific manual
 */
export function getManualPagesPath(manualId: string): string {
  return `/public/manuals/${manualId}/pages`;
}

/**
 * Get the processing directory path for a specific manual
 */
export function getManualProcessingPath(manualId: string): string {
  return `/public/manuals/${manualId}/processing`;
}

/**
 * Get the data file path for a given part in a specific manual
 */
export function getPartDataPath(manualId: string, partNum: string): string {
  return `${getManualDataPath(manualId)}/part-${partNum}.json`;
}
