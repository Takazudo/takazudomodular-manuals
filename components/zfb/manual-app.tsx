'use client';

import { computed, getScope, Show, signal, type Ref } from '@takazudo/zfb/zudo-react';
import type { ManualPage } from '@/lib/types/manual';
import type { Lang } from './lang';
import type { ManualAppProps, ViewMode } from './manual-app-types';
import { useLang } from './use-lang';
import { useZoom } from './use-zoom';
import { getManualBasePath, getPagePath, withBasePath } from './routing';
import { HeaderUtilityBar } from './header-utility-bar';
import { PageViewer } from './page-viewer';
import { ScrollViewer, type ScrollViewerHandle } from './scroll-viewer';
import { SidebarThumbs } from './sidebar-thumbs';
import { ThumbsModal } from './thumbs-modal';
import { ViewerShell } from './viewer-shell';

const outerStyles = `flex h-screen pt-[60px]`;
const errorBannerStyles = `fixed top-[60px] left-0 right-0 z-40
  flex items-center justify-center gap-hgap-sm px-hgap-sm py-vgap-xs text-zd-white text-sm`;
const retryButtonStyles = `px-hgap-sm py-vgap-2xs bg-zd-white/10 hover:bg-zd-white/20
  border border-zd-white/40 rounded-sm transition-colors`;
type PagesData = { pages: ManualPage[] };

/** Own both the deterministic SSR body and its later interactive replacement. */
export default function ManualApp({
  manualId,
  initialPageNum,
  initialPage,
  totalPages,
  availableLangs,
  manifest,
}: ManualAppProps) {
  const scope = getScope();
  const [lang, setLang] = useLang();
  const [zoomEnabled, toggleZoom] = useZoom();
  const viewMode = signal<ViewMode>('page');
  const sidebarOpen = signal(false);
  const thumbsModalOpen = signal(false);
  const currentPage = signal(initialPageNum);
  const scrollViewerRef: Ref<ScrollViewerHandle> = { current: null };
  const pagesJa = signal<ManualPage[] | null>(null);
  const pagesEn = signal<ManualPage[] | null>(null);
  const fetchFailed = signal(false);
  const fetchNonce = signal(0);

  // Each retry owns its requests. Disposing the island or retrying cancels old
  // work; the JSON-backed SSR shell remains owned and visible until JA is ready.
  scope.effect(() => {
    void fetchNonce.value;
    const controller = new AbortController();
    const abort = () => controller.abort();
    scope.abortSignal.addEventListener('abort', abort, { once: true });
    fetchFailed.value = false;
    const baseHref = withBasePath(`/${manualId}/data`);
    const fetchPages = async (language: Lang): Promise<PagesData> => {
      const response = await fetch(`${baseHref}/pages-${language}.json`, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`pages-${language}.json ${response.status}`);
      return response.json();
    };
    const enFetch = availableLangs.includes('en')
      ? fetchPages('en').catch((error) => {
          if (!controller.signal.aborted)
            console.warn('[ManualApp] EN page data unavailable; EN disabled', error);
          return null;
        })
      : Promise.resolve(null);
    Promise.all([fetchPages('ja'), enFetch])
      .then(([ja, en]) => {
        if (controller.signal.aborted) return;
        pagesJa.value = ja.pages;
        pagesEn.value = en?.pages ?? null;
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error('[ManualApp] page data fetch failed', error);
        fetchFailed.value = true;
      });
    return () => {
      controller.abort();
      scope.abortSignal.removeEventListener('abort', abort);
    };
  });

  const effectiveLang = computed<Lang>(() => (lang.value === 'en' && pagesEn.value ? 'en' : 'ja'));
  const effectivePages = computed(
    () => (effectiveLang.value === 'en' ? pagesEn.value : pagesJa.value) ?? [],
  );
  const currentPageObject = computed(
    () =>
      effectivePages.value.find((page) => page.pageNum === currentPage.value) ??
      effectivePages.value[0] ??
      initialPage,
  );
  const dataReady = computed(() => pagesJa.value !== null && effectivePages.value.length > 0);
  const navDisabled = computed(() => !dataReady.value || fetchFailed.value);
  const thumbPages = computed(() => pagesJa.value ?? []);
  const showSidebar = computed(() => sidebarOpen.value && pagesJa.value !== null);
  const showThumbs = computed(() => thumbsModalOpen.value && pagesJa.value !== null);
  const scrollMode = computed(() => viewMode.value === 'scroll');

  const getNavigationPagePath = (pageNum: number) =>
    `${getPagePath(manualId, pageNum)}${window.location.search}${window.location.hash}`;
  const navigateToPage = (pageNum: number) => {
    if (navDisabled.value) return;
    if (viewMode.value === 'scroll') {
      scrollViewerRef.current?.scrollToPage(pageNum);
    } else {
      currentPage.value = pageNum;
      window.history.pushState(null, '', getNavigationPagePath(pageNum));
    }
  };
  const navigateHome = () => {
    window.location.href = getManualBasePath(manualId);
  };
  const handleScrollPageChange = (pageNum: number) => {
    currentPage.value = pageNum;
    window.history.replaceState(null, '', getNavigationPagePath(pageNum));
  };
  scope.onActivate(() => {
    const onPopState = () => {
      const match = window.location.pathname.match(/\/page\/(\d+)/);
      if (!match) return;
      const next = Number(match[1]);
      if (next < 1 || next > totalPages) return;
      // Always record the route, including before the data fetch completes.
      // A newly mounted ScrollViewer then captures this as its initial target.
      currentPage.value = next;
      if (viewMode.value === 'scroll') scrollViewerRef.current?.scrollToPage(next);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  });

  return (
    <>
      <HeaderUtilityBar
        manualId={manualId}
        isDetailPage
        viewMode={viewMode}
        onToggleViewMode={() => {
          viewMode.value = viewMode.value === 'page' ? 'scroll' : 'page';
        }}
        onToggleSidebar={() => {
          sidebarOpen.value = !sidebarOpen.value;
        }}
        onOpenThumbsModal={() => {
          thumbsModalOpen.value = true;
        }}
        zoomEnabled={zoomEnabled}
        onToggleZoom={toggleZoom}
        lang={lang}
        setLang={setLang}
        availableLangs={availableLangs}
        searchIndexVersion={manifest.searchIndexVersion}
        onNavigate={navigateToPage}
      />
      <Show when={fetchFailed}>
        {() => (
          <div class={errorBannerStyles} role="alert" data-testid="manual-app-fetch-error">
            <span>ページデータの読み込みに失敗しました。ページ移動は無効です。</span>
            <button
              type="button"
              on:click={() => {
                fetchNonce.value += 1;
              }}
              class={retryButtonStyles}
            >
              再試行
            </button>
          </div>
        )}
      </Show>
      <Show when={showThumbs}>
        {() => (
          <ThumbsModal
            pages={thumbPages}
            currentPage={currentPage}
            onClose={() => {
              thumbsModalOpen.value = false;
            }}
            onPageSelect={navigateToPage}
          />
        )}
      </Show>
      <div class={outerStyles}>
        <Show when={showSidebar}>
          {() => (
            <SidebarThumbs
              pages={thumbPages}
              currentPage={currentPage}
              onPageSelect={navigateToPage}
            />
          )}
        </Show>
        <div class="flex-1 min-w-0" data-manual-body="">
          <Show
            when={dataReady}
            fallback={() => (
              <ViewerShell page={initialPage} pageNum={initialPageNum} totalPages={totalPages} />
            )}
          >
            {() => (
              <Show
                when={scrollMode}
                fallback={() => (
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
                )}
              >
                {() => (
                  <ScrollViewer
                    handleRef={scrollViewerRef}
                    pages={effectivePages}
                    lang={effectiveLang}
                    initialPage={currentPage.value}
                    totalPages={totalPages}
                    manualId={manualId}
                    onCurrentPageChange={handleScrollPageChange}
                  />
                )}
              </Show>
            )}
          </Show>
        </div>
      </div>
    </>
  );
}
