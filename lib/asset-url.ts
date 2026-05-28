/**
 * Add base path to an asset URL.
 *
 * In the Next.js app: basePath: '/manuals' in next.config.js does this automatically.
 * In the zfb app: the link rewriter handles static literal href/src, but runtime-built
 * URLs (page.image from JSON, fetch('/{id}/data/pages-*.json'), history.pushState URLs)
 * must be prefixed explicitly. This utility mirrors `components/zfb/routing.ts`
 * `withBasePath` for the lib layer consumed by server-render page modules.
 *
 * Base value matches `base: '/manuals/'` in zfb.config.ts (no trailing slash stored).
 *
 * @param url - The asset URL (e.g., "/oxi-one-mk2/pages/page-001.png")
 * @returns URL with /manuals prefix (e.g., "/manuals/oxi-one-mk2/pages/page-001.png")
 */
const BASE_PATH = '/manuals';

export function withBasePath(url: string): string {
  // External URLs don't need prefix
  if (url.startsWith('http')) {
    return url;
  }

  // Already has /manuals prefix
  if (url === BASE_PATH || url.startsWith(`${BASE_PATH}/`)) {
    return url;
  }

  // Add /manuals prefix for static assets
  const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
  return `${BASE_PATH}${normalizedUrl}`;
}
