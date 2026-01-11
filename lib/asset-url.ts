/**
 * Add base path to an asset URL
 * With basePath: '/manuals' in next.config.js, static files in public/
 * are served with the basePath prefix. This utility adds /manuals prefix
 * for img src and other static asset references.
 *
 * @param url - The asset URL (e.g., "/oxi-one-mk2/pages/page-001.png")
 * @returns URL with /manuals prefix (e.g., "/manuals/oxi-one-mk2/pages/page-001.png")
 */
export function withBasePath(url: string): string {
  // External URLs don't need prefix
  if (url.startsWith('http')) {
    return url;
  }

  // Already has /manuals prefix
  if (url.startsWith('/manuals/')) {
    return url;
  }

  // Add /manuals prefix for static assets
  const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
  return `/manuals${normalizedUrl}`;
}
