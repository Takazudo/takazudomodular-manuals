/**
 * Get the base path from Next.js config
 * This is used to prefix asset URLs in static export mode
 */
export const BASE_PATH = '/manuals/oxi-one-mk2';

/**
 * Add base path to an asset URL
 * For static export, Next.js doesn't automatically add basePath to Image src
 * This utility ensures all asset URLs include the basePath
 *
 * @param url - The asset URL (e.g., "/manual/part-01/pages/page_001.svg")
 * @returns URL with basePath prefix (e.g., "/manuals/oxi-one-mk2/manual/part-01/pages/page_001.svg")
 */
export function withBasePath(url: string): string {
  // If URL already has basePath or is external, return as-is
  if (url.startsWith(BASE_PATH) || url.startsWith('http')) {
    return url;
  }

  // Ensure URL starts with /
  const normalizedUrl = url.startsWith('/') ? url : `/${url}`;

  // Add basePath prefix
  return `${BASE_PATH}${normalizedUrl}`;
}
