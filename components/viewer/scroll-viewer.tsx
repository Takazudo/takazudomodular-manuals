'use client';

import { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from 'react';
import ctl from '@netlify/classnames-template-literals';
import type { ManualPage } from '@/lib/types/manual';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { withBasePath } from '@/lib/asset-url';
import { useIntersectionPages } from './use-intersection-pages';

const DETECTION_THRESHOLDS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

const containerStyles = ctl(`
  flex flex-col lg:flex-row
  h-screen
  pt-[60px]
`);

const imageColumnStyles = ctl(`
  flex-1
  overflow-y-scroll
  min-h-0
  bg-zd-white
  relative
`);

const contentColumnStyles = ctl(`
  flex-1
  overflow-y-scroll
  min-h-0
  px-hgap-sm
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
  initialPage: number;
  totalPages: number;
  manualId: string;
  onCurrentPageChange?: (pageNum: number) => void;
}

export function ScrollViewer({
  pages,
  initialPage,
  totalPages,
  onCurrentPageChange,
}: ScrollViewerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const translationColumnRef = useRef<HTMLDivElement>(null);
  const pageElementsRef = useRef<Map<number, HTMLDivElement>>(new Map());

  // Current page detection via IntersectionObserver
  const { observerRef: pageObserverRef, currentPage } = useIntersectionPages({
    threshold: DETECTION_THRESHOLDS,
    initialPage,
  });

  // Lazy loading: pre-load images near initialPage
  const [loadedImages, setLoadedImages] = useState<Set<number>>(() => {
    const set = new Set<number>();
    for (let i = Math.max(1, initialPage - 2); i <= Math.min(totalPages, initialPage + 2); i++) {
      set.add(i);
    }
    return set;
  });

  // Lazy loading observer (separate from page detection)
  const lazyObserverRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
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

  // Scroll to initial page on mount (direct scrollTop bypasses smooth scroll-behavior)
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    const el = pageElementsRef.current.get(initialPage);
    if (container && el) {
      container.scrollTop = el.offsetTop;
    }
  }, [initialPage]);

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
    <div className={containerStyles} data-testid="scroll-viewer">
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
              <div className={pageLabelStyles}>P.{page.pageNum}</div>
              {loadedImages.has(page.pageNum) && page.image ? (
                <img
                  src={withBasePath(page.image)}
                  alt={`Page ${page.pageNum}: ${page.title}`}
                  className="absolute inset-0 w-full h-full object-contain"
                  data-testid={`scroll-page-image-${page.pageNum}`}
                />
              ) : (
                <div className={placeholderInnerStyles}>
                  <div className="page-image-loader" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Right Column: Translation for Current Page */}
      <div
        ref={translationColumnRef}
        className={contentColumnStyles}
        data-testid="scroll-translation-column"
      >
        <div className={translationHeaderStyles}>
          <span className="text-sm text-zd-gray font-futura">
            P.{currentPage} / {totalPages}
          </span>
          {currentPageData?.sectionName && (
            <span className="text-sm text-zd-gray ml-hgap-sm">— {currentPageData.sectionName}</span>
          )}
        </div>

        {currentPageData?.hasContent ? (
          <div data-testid="scroll-translation-panel">
            <MarkdownRenderer content={currentPageData.content} />
          </div>
        ) : (
          <p className="text-zd-gray italic" data-testid="scroll-no-translation">
            このページには翻訳がありません
          </p>
        )}
      </div>
    </div>
  );
}
