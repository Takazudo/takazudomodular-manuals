import { forwardRef, useImperativeHandle } from 'preact/compat';
import { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from 'preact/hooks';
import ctl from './ctl';
import type { ManualPage } from '@/lib/types/manual';
import type { Lang } from './lang';
import { withBasePath } from './routing';
import { ProseContent } from './prose-content';
import { useIntersectionPages } from './use-intersection-pages';
import { viewerContainerStyles, viewerContentColumnStyles } from './viewer-layout-styles';

const DETECTION_THRESHOLDS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
const PRELOAD_RADIUS = 2;
const SCROLL_JUMP_TIMEOUT_MS = 1500;

// scroll-viewer's image column differs from page-viewer's: no `flex flex-col
// items-center`, adds `relative` (needed for absolutely-positioned page labels).
const imageColumnStyles = ctl(`
  flex-1
  overflow-y-scroll
  min-h-0
  bg-zd-white
  relative
`);

const pageItemStyles = ctl(`
  relative w-full
  border-b border-zd-gray/30
`);

const pageImageWrapperStyles = ctl(`
  relative w-full
  aspect-[210/297]
  overflow-hidden
`);

const pageLabelStyles = ctl(`
  absolute top-0 left-0 z-10
  bg-black/70
  text-white text-xs
  px-hgap-xs py-vgap-2xs
  font-futura font-bold
  rounded-br-sm
`);

const placeholderInnerStyles = ctl(`
  absolute inset-0
  flex items-center justify-center
`);

const translationHeaderStyles = ctl(`
  sticky top-0
  bg-zd-black
  pt-vgap-sm pb-vgap-sm mb-vgap-sm
  border-b border-dashed border-zd-gray
  z-10
`);

interface ScrollViewerProps {
  pages: ManualPage[];
  /** Display language — drives the `lang` attribute and empty-state copy. */
  lang: Lang;
  initialPage: number;
  totalPages: number;
  manualId: string;
  onCurrentPageChange?: (pageNum: number) => void;
}

export interface ScrollViewerHandle {
  scrollToPage: (pageNum: number) => void;
}

export const ScrollViewer = forwardRef<ScrollViewerHandle, ScrollViewerProps>(function ScrollViewer(
  { pages, lang, initialPage, totalPages, onCurrentPageChange },
  ref,
) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const translationColumnRef = useRef<HTMLDivElement>(null);
  const pageElementsRef = useRef<Map<number, HTMLDivElement>>(new Map());

  // Capture the mount-time initial page ONCE. `initialPage` is live parent
  // state (manual-app passes `currentPage`): in scroll mode the observer keeps
  // updating it, so reading it live in the mount-snap effect would re-snap on
  // every page detection and interrupt continuous scroll / smooth jumps (#154).
  // Each page<->scroll toggle is a type-swap remount, so a fresh mount always
  // re-captures the current page as the snap target.
  const initialSnapPageRef = useRef(initialPage);

  // Current page detection via IntersectionObserver
  const { observerRef: pageObserverRef, currentPage } = useIntersectionPages({
    threshold: DETECTION_THRESHOLDS,
    initialPage,
  });

  // Lazy loading: pre-load images near initialPage
  const [loadedImages, setLoadedImages] = useState<Set<number>>(() => {
    const set = new Set<number>();
    for (
      let i = Math.max(1, initialPage - PRELOAD_RADIUS);
      i <= Math.min(totalPages, initialPage + PRELOAD_RADIUS);
      i++
    ) {
      set.add(i);
    }
    return set;
  });

  // Lazy loading observer (separate from page detection)
  const lazyObserverRef = useRef<IntersectionObserver | null>(null);

  // Suppress lazy loading during programmatic scroll jumps (e.g., thumbs dialog)
  const isJumpingRef = useRef(false);
  const jumpTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-enable lazy loading and trigger observer re-evaluation
  const finishJump = useCallback(() => {
    if (!isJumpingRef.current) return;
    isJumpingRef.current = false;
    if (jumpTimeoutRef.current) {
      clearTimeout(jumpTimeoutRef.current);
      jumpTimeoutRef.current = null;
    }
    const observer = lazyObserverRef.current;
    if (observer) {
      for (const el of pageElementsRef.current.values()) {
        observer.unobserve(el);
        observer.observe(el);
      }
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Skip loading intermediate pages during a programmatic scroll jump
        if (isJumpingRef.current) return;

        const toLoad: number[] = [];
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const pageNum = Number((entry.target as HTMLElement).dataset.page);
            if (pageNum > 0) toLoad.push(pageNum);
          }
        }
        if (toLoad.length > 0) {
          setLoadedImages((prev) => {
            const next = new Set(prev);
            for (const p of toLoad) next.add(p);
            return next;
          });
        }
      },
      { rootMargin: '200px' },
    );

    lazyObserverRef.current = observer;

    // Observe all pre-registered elements
    for (const el of pageElementsRef.current.values()) {
      observer.observe(el);
    }

    return () => {
      observer.disconnect();
      lazyObserverRef.current = null;
    };
  }, []);

  // Combined ref callback: registers elements with both observers
  const registerPageElement = useCallback(
    (node: HTMLDivElement | null, pageNum: number) => {
      pageObserverRef(node, pageNum);

      if (node) {
        const oldEl = pageElementsRef.current.get(pageNum);
        if (oldEl !== node) {
          if (oldEl) lazyObserverRef.current?.unobserve(oldEl);
          pageElementsRef.current.set(pageNum, node);
          lazyObserverRef.current?.observe(node);
        }
      } else {
        const oldEl = pageElementsRef.current.get(pageNum);
        if (oldEl) {
          lazyObserverRef.current?.unobserve(oldEl);
          pageElementsRef.current.delete(pageNum);
        }
      }
    },
    [pageObserverRef],
  );

  // Lazily create stable ref callbacks per page (cached in ref to avoid re-render churn)
  type RefCallback = (node: HTMLDivElement | null) => void;
  const refCallbackCacheRef = useRef<Map<number, RefCallback>>(new Map());
  const prevRegisterRef = useRef(registerPageElement);
  if (prevRegisterRef.current !== registerPageElement) {
    refCallbackCacheRef.current.clear();
    prevRegisterRef.current = registerPageElement;
  }
  const getRefCallback = useCallback(
    (pageNum: number) => {
      let cb = refCallbackCacheRef.current.get(pageNum);
      if (!cb) {
        cb = (node: HTMLDivElement | null) => registerPageElement(node, pageNum);
        refCallbackCacheRef.current.set(pageNum, cb);
      }
      return cb;
    },
    [registerPageElement],
  );

  // Scroll to the captured initial page on mount only (direct scrollTop bypasses
  // smooth scroll-behavior). Empty deps + the ref keep this from re-firing on
  // observer-driven `currentPage`/`initialPage` updates; explicit jumps go
  // through `scrollToPage` (gated by `isJumpingRef`) instead. (#154)
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    const el = pageElementsRef.current.get(initialSnapPageRef.current);
    if (container && el) {
      container.scrollTop = el.offsetTop;
    }
  }, []);

  // Re-enable lazy loading after a programmatic scroll jump settles
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scrollend', finishJump);
    return () => container.removeEventListener('scrollend', finishJump);
  }, [finishJump]);

  // Expose scrollToPage for parent/sibling components (sidebar, modal)
  useImperativeHandle(
    ref,
    () => ({
      scrollToPage: (pageNum: number) => {
        const container = scrollContainerRef.current;
        const el = pageElementsRef.current.get(pageNum);
        if (container && el) {
          // Suppress lazy loading during the scroll animation
          isJumpingRef.current = true;

          // Clear any previous fallback timeout
          if (jumpTimeoutRef.current) clearTimeout(jumpTimeoutRef.current);
          // Fallback: reset flag if scrollend never fires (e.g., Safari < 18.4, zero-distance scroll)
          jumpTimeoutRef.current = setTimeout(finishJump, SCROLL_JUMP_TIMEOUT_MS);

          // Pre-load pages near the target so they're ready on arrival
          setLoadedImages((prev) => {
            const lo = Math.max(1, pageNum - PRELOAD_RADIUS);
            const hi = Math.min(totalPages, pageNum + PRELOAD_RADIUS);
            let changed = false;
            for (let i = lo; i <= hi; i++) {
              if (!prev.has(i)) {
                changed = true;
                break;
              }
            }
            if (!changed) return prev;
            const next = new Set(prev);
            for (let i = lo; i <= hi; i++) next.add(i);
            return next;
          });

          container.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
        }
      },
    }),
    [totalPages, finishJump],
  );

  // Notify parent when current page changes
  useEffect(() => {
    onCurrentPageChange?.(currentPage);
  }, [currentPage, onCurrentPageChange]);

  // Scroll translation column to top when current page changes
  useEffect(() => {
    if (translationColumnRef.current) {
      translationColumnRef.current.scrollTop = 0;
    }
  }, [currentPage]);

  // Find current page data for translation panel
  const currentPageData = useMemo(
    () => pages.find((p) => p.pageNum === currentPage) ?? pages[0] ?? null,
    [pages, currentPage],
  );

  return (
    <div className={viewerContainerStyles} data-testid="scroll-viewer">
      {/* Left Column: Scrollable Page Images */}
      <div ref={scrollContainerRef} className={imageColumnStyles} data-testid="scroll-image-column">
        {pages.map((page) => (
          <div
            key={page.pageNum}
            data-page={page.pageNum}
            ref={getRefCallback(page.pageNum)}
            className={pageItemStyles}
          >
            <div className={pageImageWrapperStyles}>
              <div className={pageLabelStyles} data-testid={`scroll-page-label-${page.pageNum}`}>
                P.{page.pageNum}
              </div>
              {loadedImages.has(page.pageNum) && page.image ? (
                <img
                  src={withBasePath(page.image)}
                  alt={`Page ${page.pageNum}: ${page.title}`}
                  className="absolute inset-0 w-full h-full object-contain"
                  data-testid={`scroll-page-image-${page.pageNum}`}
                />
              ) : (
                <div className={placeholderInnerStyles}>
                  <div
                    className="page-image-loader"
                    data-testid={`scroll-page-placeholder-${page.pageNum}`}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Right Column: Translation for Current Page */}
      <div
        ref={translationColumnRef}
        className={viewerContentColumnStyles}
        data-testid="scroll-translation-column"
      >
        <div className={translationHeaderStyles} data-testid="scroll-translation-header">
          <span className="text-sm text-zd-gray font-futura">
            P.{currentPage} / {totalPages}
          </span>
          {currentPageData?.sectionName && (
            <span className="text-sm text-zd-gray ml-hgap-sm">— {currentPageData.sectionName}</span>
          )}
        </div>

        {currentPageData ? (
          <ProseContent
            page={currentPageData}
            lang={lang}
            testId="scroll-translation-panel"
            emptyTestId="scroll-no-translation"
          />
        ) : null}
      </div>
    </div>
  );
});
