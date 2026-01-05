/**
 * Add base path to an asset URL if needed
 * In the multi-manual architecture, image paths in JSON data already include
 * the full correct path (e.g., "/manuals/oxi-one-mk2/pages/page-001.png")
 * This utility only adds prefix for legacy paths that don't include it
 *
 * @param url - The asset URL
 * @returns URL with proper prefix if needed
 */
export function withBasePath(url: string): string {
  // If URL already has a manual path or is external, return as-is
  if (url.startsWith('/manuals/') || url.startsWith('http')) {
    return url;
  }

  // For legacy paths without /manuals/ prefix, add oxi-one-mk2 base path
  // (This maintains backward compatibility with old data)
  const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
  return `/manuals/oxi-one-mk2${normalizedUrl}`;
}
