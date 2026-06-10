/**
 * Shared layout class constants for the manual viewer components.
 *
 * Consumers:
 *   - viewer-shell.tsx (SSR shell — must be byte-identical to page-viewer for
 *     hydration to produce zero class drift)
 *   - page-viewer.tsx (page mode interactive island)
 *   - scroll-viewer.tsx (scroll mode — imports container + contentColumn only;
 *     its imageColumn differs: no `flex flex-col items-center`, adds `relative`)
 */
import ctl from './ctl';

/** Outer two-column flex container (shared by all three viewer components). */
export const viewerContainerStyles = ctl(`
  flex flex-col lg:flex-row
  h-full
`);

/**
 * Outer positioning wrapper for the page-mode image column (viewer-shell +
 * page-viewer only). Carries the flex-child role and anchors the loading
 * overlay OUTSIDE the scroll container so the overlay covers the visible
 * pane regardless of scroll position (#180).
 */
export const viewerImageColumnOuterStyles = ctl(`
  relative
  flex-1
  min-h-0
  min-w-0
`);

/**
 * Image column for page mode (viewer-shell + page-viewer only); the scroll
 * container nested inside viewerImageColumnOuterStyles.
 * scroll-viewer has a different imageColumn layout so it must NOT use this.
 */
export const viewerImageColumnStyles = ctl(`
  h-full
  overflow-y-scroll
  flex flex-col items-center
  bg-zd-white
`);

/** Right translation column (shared by all three viewer components). */
export const viewerContentColumnStyles = ctl(`
  flex-1
  overflow-y-scroll
  min-h-0
  px-hgap-sm
`);

/**
 * Image wrapper for page mode (viewer-shell + page-viewer only).
 * scroll-viewer uses a different per-page image wrapper with aspect-ratio.
 */
export const viewerImageWrapperStyles = ctl(`
  relative w-full
  min-h-[400px]
  h-full
  content-center
`);

/**
 * Sticky navigation wrapper in the translation column (viewer-shell + page-viewer only).
 * scroll-viewer has its own translationHeader style.
 */
export const viewerNavigationWrapperStyles = ctl(`
  sticky top-0 z-10
  mb-vgap-md
  pt-vgap-sm
  px-hgap-sm
  -mx-hgap-sm
  bg-zd-black/90
`);
