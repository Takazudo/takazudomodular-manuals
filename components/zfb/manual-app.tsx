'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import ctl from './ctl';
import type { ManualPage } from '@/lib/types/manual';
import type { Lang } from './lang';
import type { ManualAppProps, ViewMode } from './manual-app-types';
import { useLang } from './use-lang';
import { useZoom } from './use-zoom';
import { getManualBasePath, getPagePath } from './routing';
import { HeaderUtilityBar } from './header-utility-bar';
import { PageViewer } from './page-viewer';
import { ScrollViewer, type ScrollViewerHandle } from './scroll-viewer';
import { SidebarThumbs } from './sidebar-thumbs';
import { ThumbsModal } from './thumbs-modal';

/**
 * Marker the SSR'd current-page body is rendered into. On the client's first
 * (hydration) render we capture this element's innerHTML and re-inject it via
 * dangerouslySetInnerHTML so Preact's hydrate matches the existing DOM exactly
 * (Preact skips child-diffing an element carrying dangerouslySetInnerHTML —
 * verified against preact 10.29 diff/index.js). This preserves the SSR'd page
 * for the fetch window and the fetch-failure case. See README/log for detail.
 */
const BODY_MARKER_ATTR = 'data-manual-body';

const outerStyles = ctl(`
  flex
  h-screen
  pt-[60px]
`);

const errorBannerStyles = ctl(`
  fixed top-[60px] left-0 right-0 z-40
  flex items-center justify-center gap-hgap-sm
  px-hgap-sm py-vgap-xs
  bg-zd-red/90
  text-zd-white text-sm
`);

const retryButtonStyles = ctl(`
  px-hgap-sm py-vgap-2xs
  bg-zd-white/10 hover:bg-zd-white/20
  border border-zd-white/40
  rounded-sm
  transition-colors
`);

type PagesData = { pages: ManualPage[] };

/**
 * Capture the SSR'd body innerHTML once, synchronously, during the first
 * client render — before Preact reconciles the body element's children.
 * Returns null on the server (no document) and on subsequent renders we keep
 * the captured value via useState's initializer-once semantics.
 */
function useCapturedSsrBody(): string | null {
  const [captured] = useState<string | null>(() => {
    if (typeof document === 'undefined') return null;
    const el = document.querySelector(`[${BODY_MARKER_ATTR}]`);
    return el ? el.innerHTML : null;
  });
  return captured;
}

export default function ManualApp({
  manualId,
  initialPageNum,
  totalPages,
  availableLangs,
  manifest,
  children,
}: ManualAppProps & { children?: ComponentChildren }) {
  // ── Language (no React context; resolved post-mount) ─────────────────────
  // Deterministic SSR default = "ja". Real preference resolved in an effect to
  // avoid a hydration mismatch on the first paint. See useLang() for details.
  const [lang, setLang] = useLang();

  // ── View mode + chrome toggles ───────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>('page');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [thumbsModalOpen, setThumbsModalOpen] = useState(false);

  // Hover-zoom (Amazon-style page magnifier) — page mode only. Persisted, but
  // SSR-safe: defaults to off until the post-mount effect reads localStorage.
  const [zoomEnabled, toggleZoom] = useZoom();

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === 'page' ? 'scroll' : 'page'));
  }, []);
  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), []);
  const openThumbsModal = useCallback(() => setThumbsModalOpen(true), []);
  const closeThumbsModal = useCallback(() => setThumbsModalOpen(false), []);

  // ── Current page (in-manual SPA nav) ─────────────────────────────────────
  const [currentPage, setCurrentPage] = useState<number>(initialPageNum);
  const scrollViewerRef = useRef<ScrollViewerHandle>(null);

  // ── Page data, fetched on mount for both languages ───────────────────────
  const [pagesJa, setPagesJa] = useState<ManualPage[] | null>(null);
  const [pagesEn, setPagesEn] = useState<ManualPage[] | null>(null);
  const [fetchFailed, setFetchFailed] = useState(false);
  // Bumped by the retry button to re-trigger the fetch effect.
  const [fetchNonce, setFetchNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setFetchFailed(false);

    const baseHref = `/manuals/${manualId}/data`;
    const wantEn = availableLangs.includes('en');

    // JA is required — its failure is fatal (error banner + disabled nav).
    const jaFetch = fetch(`${baseHref}/pages-ja.json`).then((r) => {
      if (!r.ok) throw new Error(`pages-ja.json ${r.status}`);
      return r.json() as Promise<PagesData>;
    });
    // EN is optional — a failed/missing pages-en.json (e.g. a JA-only manual)
    // must NOT break the JA viewer. Swallow EN errors to null; the derived
    // effectiveLang already falls back to JA when pagesEn is absent.
    const enFetch: Promise<PagesData | null> = wantEn
      ? fetch(`${baseHref}/pages-en.json`)
          .then((r) => {
            if (!r.ok) throw new Error(`pages-en.json ${r.status}`);
            return r.json() as Promise<PagesData>;
          })
          .catch((err) => {
            console.warn('[ManualApp] EN page data unavailable; EN disabled', err);
            return null;
          })
      : Promise.resolve(null);

    Promise.all([jaFetch, enFetch])
      .then(([ja, en]) => {
        if (cancelled) return;
        setPagesJa(ja.pages);
        if (en) setPagesEn(en.pages);
      })
      .catch((err) => {
        // Only a JA failure reaches here (EN errors are swallowed above).
        if (cancelled) return;
        console.error('[ManualApp] page data fetch failed', err);
        setFetchFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [manualId, availableLangs, fetchNonce]);

  const handleRetry = useCallback(() => {
    setFetchNonce((n) => n + 1);
  }, []);

  // ── Derived language / page list ─────────────────────────────────────────
  // Falls back to JA when EN is requested but unavailable (the toggle UI
  // prevents this path; defensive guard).
  const effectiveLang: Lang = lang === 'en' && pagesEn ? 'en' : 'ja';
  const effectivePages = useMemo<ManualPage[] | null>(
    () => (effectiveLang === 'en' && pagesEn ? pagesEn : pagesJa),
    [effectiveLang, pagesJa, pagesEn],
  );

  const currentPageObject = useMemo(
    () => effectivePages?.find((p) => p.pageNum === currentPage) ?? effectivePages?.[0] ?? null,
    [effectivePages, currentPage],
  );

  // Data is hydrated once the JA list is present. Until then (and on failure)
  // the SSR'd body stays visible and in-manual nav is disabled.
  const dataReady = pagesJa !== null;
  const navDisabled = !dataReady || fetchFailed;

  // ── Navigation (client-side via history API) ─────────────────────────────
  const navigateToPage = useCallback(
    (pageNum: number) => {
      if (navDisabled) return;
      if (viewMode === 'scroll') {
        scrollViewerRef.current?.scrollToPage(pageNum);
      } else {
        setCurrentPage(pageNum);
        window.history.pushState(null, '', getPagePath(manualId, pageNum));
      }
    },
    [navDisabled, viewMode, manualId],
  );

  const navigateHome = useCallback(() => {
    // The manual landing is a SEPARATE zfb template, not a route this island
    // can render. Use a full navigation (not history.pushState) so the landing
    // page actually loads — pushState alone would change the URL while leaving
    // the viewer painted, desyncing reload/back-forward.
    window.location.href = getManualBasePath(manualId);
  }, [manualId]);

  // Scroll mode updates the URL silently as the visible page changes.
  const handleScrollPageChange = useCallback(
    (pageNum: number) => {
      setCurrentPage(pageNum);
      window.history.replaceState(null, '', getPagePath(manualId, pageNum));
    },
    [manualId],
  );

  // Keep the viewer in sync with browser back/forward. The browser has already
  // changed the URL (that's what popstate means), so we never touch history
  // here — we mirror navigateToPage's view-mode branching to move the viewer:
  //   - scroll mode: route through the gated smooth-jump (scrollToPage). The
  //     observer then syncs currentPage + replaceState as the scroll settles,
  //     same as every other scroll-mode jump. Without this the URL changes but
  //     the viewport stays put (#165). setCurrentPage alone won't scroll because
  //     the mount-snap is gated to mount + explicit jump only (#154).
  //   - page mode: just update currentPage to re-render the page body.
  useEffect(() => {
    const onPopState = () => {
      const match = window.location.pathname.match(/\/page\/(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n >= 1 && n <= totalPages) {
          if (viewMode === 'scroll') {
            scrollViewerRef.current?.scrollToPage(n);
          } else {
            setCurrentPage(n);
          }
        }
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [totalPages, viewMode]);

  // Thumbnails always use the JA list (language-independent page numbers).
  const thumbPages = pagesJa;

  // ── SSR body capture-and-reinject ────────────────────────────────────────
  const capturedBody = useCapturedSsrBody();

  // Body slot rendering. The marker div is ONE element across SSR and the
  // client's first render so Preact hydrates it cleanly:
  //   - SSR:                 marker renders {children} (page module's SSR body).
  //   - Client first render: marker uses dangerouslySetInnerHTML with the
  //     captured SSR innerHTML → Preact skips child-diff, DOM is preserved.
  //   - Data ready:          marker renders the real viewer VDOM (post-hydration
  //     update — replacing dangerouslySetInnerHTML content is a normal swap).
  const showRealViewer = dataReady && currentPageObject !== null && effectivePages !== null;

  const realViewer =
    showRealViewer && currentPageObject && effectivePages ? (
      viewMode === 'scroll' ? (
        <ScrollViewer
          ref={scrollViewerRef}
          pages={effectivePages}
          lang={effectiveLang}
          initialPage={currentPage}
          totalPages={totalPages}
          manualId={manualId}
          onCurrentPageChange={handleScrollPageChange}
        />
      ) : (
        <PageViewer
          page={currentPageObject}
          lang={effectiveLang}
          currentPage={currentPage}
          totalPages={totalPages}
          manualId={manualId}
          onNavigate={navigateToPage}
          onNavigateHome={navigateHome}
          navDisabled={navDisabled}
          zoomEnabled={zoomEnabled}
        />
      )
    ) : null;

  // When not showing the real viewer and we have captured the SSR body on the
  // client, inject it onto the marker div itself (no extra wrapper) so the DOM
  // structure matches SSR exactly. On the server (or before capture) the marker
  // renders {children} instead.
  const markerInnerHtml = !showRealViewer && capturedBody !== null ? capturedBody : null;

  const markerProps: Record<string, unknown> = {
    className: 'flex-1 min-w-0',
    [BODY_MARKER_ATTR]: '',
  };
  if (markerInnerHtml !== null) {
    markerProps.dangerouslySetInnerHTML = { __html: markerInnerHtml };
  }

  return (
    <>
      <HeaderUtilityBar
        manualId={manualId}
        isDetailPage
        viewMode={viewMode}
        onToggleViewMode={toggleViewMode}
        onToggleSidebar={toggleSidebar}
        onOpenThumbsModal={openThumbsModal}
        zoomEnabled={zoomEnabled}
        onToggleZoom={toggleZoom}
        lang={lang}
        setLang={setLang}
        availableLangs={availableLangs}
        searchIndexVersion={manifest.searchIndexVersion}
        onNavigate={navigateToPage}
      />

      {fetchFailed && (
        <div className={errorBannerStyles} role="alert" data-testid="manual-app-fetch-error">
          <span>ページデータの読み込みに失敗しました。ページ移動は無効です。</span>
          <button type="button" onClick={handleRetry} className={retryButtonStyles}>
            再試行
          </button>
        </div>
      )}

      {thumbsModalOpen && thumbPages && (
        <ThumbsModal
          pages={thumbPages}
          currentPage={currentPage}
          isOpen={thumbsModalOpen}
          onClose={closeThumbsModal}
          onPageSelect={navigateToPage}
        />
      )}

      <div className={outerStyles}>
        {sidebarOpen && thumbPages && (
          <SidebarThumbs
            pages={thumbPages}
            currentPage={currentPage}
            onPageSelect={navigateToPage}
          />
        )}

        <div {...markerProps}>{markerInnerHtml === null ? (realViewer ?? children) : null}</div>
      </div>
    </>
  );
}
