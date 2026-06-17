/**
 * Centralized manual configuration
 * All manual-related paths should reference this file
 *
 * The site is deployed at the domain root (`/`).
 * - Route paths: root-relative, no base prefix needed
 * - Static asset paths: root-relative (e.g. `/{manualId}/pages/page-001.png`)
 * - Filesystem paths: Use /public/{manualId}/...
 */

/**
 * Get the base route path for a specific manual.
 */
export function getManualBasePath(manualId: string): string {
  return `/${manualId}`;
}

/**
 * Get the full page route path for a given page number in a specific manual.
 */
export function getPagePath(manualId: string, pageNum: number): string {
  return `${getManualBasePath(manualId)}/page/${pageNum}`;
}

/**
 * Get the static asset path for a manual (for static files in /public).
 */
export function getManualAssetPath(manualId: string, filename: string): string {
  return `/${manualId}/${filename}`;
}

/**
 * Get the data directory path for a specific manual (filesystem path)
 */
export function getManualDataPath(manualId: string): string {
  return `/public/${manualId}/data`;
}

/**
 * Get the pages directory path for a specific manual (filesystem path)
 */
export function getManualPagesPath(manualId: string): string {
  return `/public/${manualId}/pages`;
}

/**
 * Get the processing directory path for a specific manual (filesystem path)
 */
export function getManualProcessingPath(manualId: string): string {
  return `/public/${manualId}/processing`;
}

/**
 * Get the pages data file path for a specific manual (filesystem path)
 */
export function getPagesDataPath(manualId: string): string {
  return `${getManualDataPath(manualId)}/pages.json`;
}
