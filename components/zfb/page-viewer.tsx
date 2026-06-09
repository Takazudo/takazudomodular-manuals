import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'preact/hooks';
import ctl from './ctl';
import type { ManualPage } from '@/lib/types/manual';
import type { Lang } from './lang';
import { withBasePath } from './routing';
import { clamp, ZOOM_MIN_FACTOR, ZOOM_MAX_FACTOR } from './zoom';
import { ProseContent } from './prose-content';
import { PageNavigation } from './page-navigation';
import { KeyboardNavigation } from './keyboard-navigation';
import {
  viewerContainerStyles,
  viewerImageColumnStyles,
  viewerContentColumnStyles,
  viewerImageWrapperStyles,
  viewerNavigationWrapperStyles,
} from './viewer-layout-styles';

const loaderWrapperStyles = ctl(`
  absolute
  top-1/2 left-1/2
  transform -translate-x-1/2 -translate-y-1/2
  z-10
`);

interface PageViewerProps {
  page: ManualPage;
  /** Display language — drives the `lang` attribute and empty-state copy. */
  lang: Lang;
  currentPage: number;
  totalPages: number;
  manualId: string;
  /** Navigate to a page (client-side, owned by the island). */
  onNavigate: (pageNum: number) => void;
  /** Navigate to the manual top page (left arrow on page 1). */
  onNavigateHome: () => void;
  /** When true (fetch failed), in-manual nav is disabled. */
  navDisabled?: boolean;
  /** When true, hovering the page image shows the Amazon-style magnifier. */
  zoomEnabled?: boolean;
}

/** Class toggled on the lens/panel to reveal them while hovering. */
const ZOOM_ACTIVE_CLASS = 'is-active';

export function PageViewer({
  page,
  lang,
  currentPage,
  totalPages,
  manualId,
  onNavigate,
  onNavigateHome,
  navDisabled = false,
  zoomEnabled = false,
}: PageViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const prevPageRef = useRef({ currentPage, manualId });
  const imgRef = useRef<HTMLImageElement>(null);

  // ── Hover-zoom (Amazon-style magnifier) ──────────────────────────────────
  // Lens overlays the source image; the panel fills the translation column and
  // shows the magnified region. Both are `position: fixed` (positioned in
  // viewport coords straight from getBoundingClientRect — no scroll-offset math)
  // and `pointer-events: none` (so the mouse keeps hitting the image, not them).
  const contentColRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // rAF handle — coalesces the high-frequency mousemove into one paint/frame.
  const zoomRafRef = useRef<number | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Compute and apply the lens + panel geometry for a given viewport pointer.
  // Geometry is fed in via CSS custom properties (set imperatively here, never
  // re-rendering); the visual rules live in `.zoom-lens`/`.zoom-panel` in
  // global.css. This is the standard mechanism for per-frame, data-driven
  // positioning that Tailwind utility classes cannot express.
  const applyZoom = useCallback((clientX: number, clientY: number) => {
    const img = imgRef.current;
    const lens = lensRef.current;
    const panel = panelRef.current;
    const col = contentColRef.current;
    if (!img || !lens || !panel || !col) return;
    const naturalWidth = img.naturalWidth;
    if (naturalWidth === 0) return; // image not loaded yet

    const imgRect = img.getBoundingClientRect();
    const colRect = col.getBoundingClientRect();
    if (imgRect.width === 0 || colRect.width === 0 || colRect.height === 0) return;

    // Magnification = native-to-displayed ratio (sharpest), clamped to a sane
    // reading range so the lens is neither huge (too little zoom) nor tiny.
    const factor = clamp(naturalWidth / imgRect.width, ZOOM_MIN_FACTOR, ZOOM_MAX_FACTOR);

    // Lens = region of the *displayed* image that maps onto the whole panel.
    // Its aspect ratio follows the panel's; never let it exceed the image.
    const lensW = Math.min(colRect.width / factor, imgRect.width);
    const lensH = Math.min(colRect.height / factor, imgRect.height);

    // Center the lens on the cursor, clamped so it stays within the image.
    const cursorX = clamp(clientX - imgRect.left, 0, imgRect.width);
    const cursorY = clamp(clientY - imgRect.top, 0, imgRect.height);
    const lensX = clamp(cursorX - lensW / 2, 0, imgRect.width - lensW);
    const lensY = clamp(cursorY - lensH / 2, 0, imgRect.height - lensH);

    lens.style.setProperty('--zoom-lens-left', `${imgRect.left + lensX}px`);
    lens.style.setProperty('--zoom-lens-top', `${imgRect.top + lensY}px`);
    lens.style.setProperty('--zoom-lens-width', `${lensW}px`);
    lens.style.setProperty('--zoom-lens-height', `${lensH}px`);

    panel.style.setProperty('--zoom-panel-left', `${colRect.left}px`);
    panel.style.setProperty('--zoom-panel-top', `${colRect.top}px`);
    panel.style.setProperty('--zoom-panel-width', `${colRect.width}px`);
    panel.style.setProperty('--zoom-panel-height', `${colRect.height}px`);
    panel.style.setProperty(
      '--zoom-bg-size',
      `${imgRect.width * factor}px ${imgRect.height * factor}px`,
    );
    panel.style.setProperty('--zoom-bg-pos', `${-lensX * factor}px ${-lensY * factor}px`);
  }, []);

  const deactivateZoom = useCallback(() => {
    if (zoomRafRef.current !== null) {
      cancelAnimationFrame(zoomRafRef.current);
      zoomRafRef.current = null;
    }
    lensRef.current?.classList.remove(ZOOM_ACTIVE_CLASS);
    panelRef.current?.classList.remove(ZOOM_ACTIVE_CLASS);
  }, []);

  const activateZoom = useCallback(() => {
    const panel = panelRef.current;
    if (panel && page.image) {
      // Same asset as the <img> src; set once per activation.
      panel.style.setProperty('--zoom-image', `url("${withBasePath(page.image)}")`);
    }
    lensRef.current?.classList.add(ZOOM_ACTIVE_CLASS);
    panelRef.current?.classList.add(ZOOM_ACTIVE_CLASS);
  }, [page.image]);

  const eligibleForZoom = useCallback(
    () => zoomEnabled && !hasError && !!page.image && (imgRef.current?.naturalWidth ?? 0) > 0,
    [zoomEnabled, hasError, page.image],
  );

  const handleZoomEnter = useCallback(
    (e: MouseEvent) => {
      if (!eligibleForZoom()) return;
      activateZoom();
      applyZoom(e.clientX, e.clientY);
    },
    [eligibleForZoom, activateZoom, applyZoom],
  );

  const handleZoomMove = useCallback(
    (e: MouseEvent) => {
      if (!eligibleForZoom()) return;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      if (zoomRafRef.current !== null) return;
      zoomRafRef.current = requestAnimationFrame(() => {
        zoomRafRef.current = null;
        activateZoom();
        applyZoom(lastPointerRef.current.x, lastPointerRef.current.y);
      });
    },
    [eligibleForZoom, activateZoom, applyZoom],
  );

  const handleZoomLeave = useCallback(() => {
    deactivateZoom();
  }, [deactivateZoom]);

  // Check if image is already loaded on mount (handles cached images).
  // useLayoutEffect runs before paint, preventing flicker.
  useLayoutEffect(() => {
    if (imgRef.current?.complete && (imgRef.current?.naturalWidth ?? 0) > 0) {
      setIsLoading(false);
    }
  }, [currentPage, manualId]);

  // Reset loading state when navigating to a different page
  useEffect(() => {
    const prevPage = prevPageRef.current;
    if (prevPage.currentPage !== currentPage || prevPage.manualId !== manualId) {
      setIsLoading(true);
      setHasError(false);
    }
    prevPageRef.current = { currentPage, manualId };
  }, [currentPage, manualId]);

  // Disabling zoom mid-hover must hide the UI immediately.
  useEffect(() => {
    if (!zoomEnabled) deactivateZoom();
  }, [zoomEnabled, deactivateZoom]);

  // A new page swaps the image: drop any active zoom and the stale background
  // (re-set lazily on the next hover from the new page's src).
  useEffect(() => {
    deactivateZoom();
    panelRef.current?.style.removeProperty('--zoom-image');
  }, [currentPage, manualId, deactivateZoom]);

  // Cancel a pending frame on unmount so the rAF callback never touches a
  // torn-down element.
  useEffect(
    () => () => {
      if (zoomRafRef.current !== null) cancelAnimationFrame(zoomRafRef.current);
    },
    [],
  );

  return (
    <>
      <KeyboardNavigation
        currentPage={currentPage}
        totalPages={totalPages}
        onNavigate={onNavigate}
        onNavigateHome={onNavigateHome}
        navDisabled={navDisabled}
      />
      <div className={viewerContainerStyles}>
        {/* Left Column: PDF Image */}
        <div className={viewerImageColumnStyles} data-testid="page-image-column">
          <div className={viewerImageWrapperStyles} data-testid="page-image-wrapper">
            {hasError ? (
              <div className={loaderWrapperStyles} data-testid="page-image-error">
                <div className="text-zd-red text-center">
                  <p className="text-lg font-bold mb-vgap-xs">画像の読み込みに失敗しました</p>
                  <p className="text-sm text-zd-gray6">ページ {currentPage}</p>
                </div>
              </div>
            ) : !page.image ? (
              <div className={loaderWrapperStyles} data-testid="page-image-missing">
                <div className="text-zd-gray6 text-center">
                  <p className="text-lg mb-vgap-xs">画像がありません</p>
                  <p className="text-sm">ページ {currentPage}</p>
                </div>
              </div>
            ) : (
              <>
                {/* Loading overlay - fades out when image loads */}
                <div
                  className={`absolute inset-0 bg-zd-white z-10 flex items-center justify-center transition-opacity duration-300 ${isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                  data-testid="page-image-overlay"
                >
                  <div className="page-image-loader" />
                </div>
                <img
                  ref={imgRef}
                  src={withBasePath(page.image)}
                  alt={`Page ${currentPage}: ${page.title}`}
                  className="w-full h-auto"
                  onLoad={handleImageLoad}
                  onError={() => {
                    setIsLoading(false);
                    setHasError(true);
                  }}
                  onMouseEnter={zoomEnabled ? handleZoomEnter : undefined}
                  onMouseMove={zoomEnabled ? handleZoomMove : undefined}
                  onMouseLeave={zoomEnabled ? handleZoomLeave : undefined}
                  data-testid="page-image"
                />
              </>
            )}
          </div>
        </div>

        {/* Right Column: Translation */}
        <div
          ref={contentColRef}
          className={viewerContentColumnStyles}
          data-testid="translation-column"
        >
          <div className={viewerNavigationWrapperStyles} data-testid="page-navigation-wrapper">
            <PageNavigation
              currentPage={currentPage}
              totalPages={totalPages}
              onNavigate={onNavigate}
              navDisabled={navDisabled}
            />
          </div>

          <ProseContent page={page} lang={lang} />
        </div>
      </div>

      {/* Hover-zoom overlays. Mounted whenever the feature is on (so the refs
          exist before the first hover) but hidden until `.is-active` is toggled
          on mouseenter. Both are fixed + pointer-events:none — see global.css. */}
      {zoomEnabled && page.image && !hasError && (
        <>
          <div ref={lensRef} className="zoom-lens" aria-hidden="true" data-testid="zoom-lens" />
          <div ref={panelRef} className="zoom-panel" aria-hidden="true" data-testid="zoom-panel" />
        </>
      )}
    </>
  );
}
