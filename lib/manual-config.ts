/**
 * Centralized manual configuration
 * All manual-related paths should reference this file
 *
 * IMPORTANT: This site uses basePath: '/manuals' in next.config.js
 * - Route paths (for <Link>, router.push): Don't include /manuals prefix (basePath adds it)
 * - Static asset paths (for <img>, <a href>): Must include full /manuals prefix
 */

/**
 * Get the base route path for a specific manual (for Next.js routing)
 * Used by <Link> component - basePath is automatically prepended
 */
export function getManualBasePath(manualId: string): string {
  return `/${manualId}`;
}

/**
 * Get the full page route path for a given page number in a specific manual
 * Used by <Link> component - basePath is automatically prepended
 */
export function getPagePath(manualId: string, pageNum: number): string {
  return `${getManualBasePath(manualId)}/page/${pageNum}`;
}

/**
 * Get the static asset path for a manual (for static files in /public)
 * Used by <img>, <a href> for static files - needs full path
 */
export function getManualAssetPath(manualId: string, filename: string): string {
  return `/manuals/${manualId}/${filename}`;
}

/**
 * Get the data directory path for a specific manual (filesystem path)
 */
export function getManualDataPath(manualId: string): string {
  return `/public/manuals/${manualId}/data`;
}

/**
 * Get the pages directory path for a specific manual (filesystem path)
 */
export function getManualPagesPath(manualId: string): string {
  return `/public/manuals/${manualId}/pages`;
}

/**
 * Get the processing directory path for a specific manual (filesystem path)
 */
export function getManualProcessingPath(manualId: string): string {
  return `/public/manuals/${manualId}/processing`;
}

/**
 * Get the data file path for a given part in a specific manual (filesystem path)
 */
export function getPartDataPath(manualId: string, partNum: string): string {
  return `${getManualDataPath(manualId)}/part-${partNum}.json`;
}
