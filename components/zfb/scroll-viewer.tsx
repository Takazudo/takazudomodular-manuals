import {
  computed,
  For,
  getScope,
  signal,
  Show,
  type ReadonlySignal,
  type Ref,
} from '@takazudo/zfb/zudo-react';
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
const imageColumnStyles = 'flex-1 overflow-y-scroll min-h-0 bg-zd-white relative';

const pageItemStyles = 'relative w-full border-b border-zd-gray/30';

const pageImageWrapperStyles = 'relative w-full aspect-[210/297] overflow-hidden';

const pageLabelStyles =
  'absolute top-0 left-0 z-10 bg-black/70 text-white text-xs px-hgap-xs py-vgap-2xs font-futura font-bold rounded-br-sm';

const placeholderInnerStyles = 'absolute inset-0 flex items-center justify-center';

const translationHeaderStyles =
  'sticky top-0 bg-zd-black pt-vgap-sm pb-vgap-sm mb-vgap-sm border-b border-dashed border-zd-gray z-10';

interface ScrollViewerProps {
  pages: ReadonlySignal<ManualPage[]>;
  lang: ReadonlySignal<Lang>;
  /** Captured once for each mount; detected page updates never re-snap. */
  initialPage: number;
  totalPages: number;
  manualId: string;
  onCurrentPageChange?: (pageNum: number) => void;
  handleRef?: Ref<ScrollViewerHandle>;
}
export interface ScrollViewerHandle {
  scrollToPage: (pageNum: number) => void;
}

export function ScrollViewer({
  pages,
  lang,
  initialPage,
  totalPages,
  onCurrentPageChange,
  handleRef,
}: ScrollViewerProps) {
  const scope = getScope();
  const scrollContainerRef: Ref<HTMLDivElement> = { current: null };
  const translationColumnRef: Ref<HTMLDivElement> = { current: null };
  const pageElements = new Map<number, HTMLDivElement>();
  const { observerRef: pageObserverRef, currentPage } = useIntersectionPages({
    threshold: DETECTION_THRESHOLDS,
    initialPage,
  });
  const nearPage = (page: number) =>
    Array.from(
      {
        length:
          Math.min(totalPages, page + PRELOAD_RADIUS) - Math.max(1, page - PRELOAD_RADIUS) + 1,
      },
      (_, i) => Math.max(1, page - PRELOAD_RADIUS) + i,
    );
  const loadedImages = signal(new Set(nearPage(initialPage)));
  let lazyObserver: IntersectionObserver | null = null;
  let isJumping = false;
  let jumpTimeout: ReturnType<typeof setTimeout> | null = null;

  const finishJump = () => {
    if (!isJumping) return;
    isJumping = false;
    if (jumpTimeout !== null) clearTimeout(jumpTimeout);
    jumpTimeout = null;
    for (const el of pageElements.values()) {
      lazyObserver?.unobserve(el);
      lazyObserver?.observe(el);
    }
  };
  scope.onActivate(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isJumping) return;
        const next = new Set(loadedImages.value);
        for (const entry of entries) {
          const pageNum = Number((entry.target as HTMLElement).dataset.page);
          if (entry.isIntersecting && pageNum > 0) next.add(pageNum);
        }
        if (next.size !== loadedImages.value.size) loadedImages.value = next;
      },
      { rootMargin: '200px' },
    );
    lazyObserver = observer;
    for (const el of pageElements.values()) observer.observe(el);
    const container = scrollContainerRef.current;
    const initialElement = pageElements.get(initialPage);
    if (container && initialElement) container.scrollTop = initialElement.offsetTop;
    container?.addEventListener('scrollend', finishJump);
    if (handleRef)
      handleRef.current = {
        scrollToPage(pageNum) {
          const el = pageElements.get(pageNum);
          if (!container || !el) return;
          isJumping = true;
          if (jumpTimeout !== null) clearTimeout(jumpTimeout);
          jumpTimeout = setTimeout(finishJump, SCROLL_JUMP_TIMEOUT_MS);
          loadedImages.value = new Set([...loadedImages.value, ...nearPage(pageNum)]);
          container.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
        },
      };
    return () => {
      observer.disconnect();
      lazyObserver = null;
      container?.removeEventListener('scrollend', finishJump);
      if (jumpTimeout !== null) clearTimeout(jumpTimeout);
      if (handleRef) handleRef.current = null;
    };
  });
  scope.effect(() => {
    onCurrentPageChange?.(currentPage.value);
  });
  scope.effect(() => {
    void currentPage.value;
    if (translationColumnRef.current) translationColumnRef.current.scrollTop = 0;
  });
  const currentPageData = computed(
    () => pages.value.find((p) => p.pageNum === currentPage.value) ?? pages.value[0] ?? null,
  );

  return (
    <div class={viewerContainerStyles} data-testid="scroll-viewer">
      <div ref={scrollContainerRef} class={imageColumnStyles} data-testid="scroll-image-column">
        <For each={pages} by={(page) => page.pageNum}>
          {(page) => {
            const pageNum = page.value.pageNum;
            const elementRef: Ref<HTMLDivElement> = { current: null };
            // Item activation precedes the parent mount snap. Retained keys keep
            // their DOM/observer registration when a new language replaces data.
            getScope().onActivate(() => {
              const element = elementRef.current;
              if (!element) return;
              pageElements.set(pageNum, element);
              pageObserverRef(element, pageNum);
              lazyObserver?.observe(element);
              return () => {
                pageObserverRef(null, pageNum);
                lazyObserver?.unobserve(element);
                pageElements.delete(pageNum);
              };
            });
            return (
              <div data-page={pageNum} ref={elementRef} class={pageItemStyles}>
                <div class={pageImageWrapperStyles}>
                  <div class={pageLabelStyles} data-testid={`scroll-page-label-${pageNum}`}>
                    P.{pageNum}
                  </div>
                  <Show
                    when={computed(() => loadedImages.value.has(pageNum) && !!page.value.image)}
                    fallback={() => (
                      <div class={placeholderInnerStyles}>
                        <div
                          class="page-image-loader"
                          data-testid={`scroll-page-placeholder-${pageNum}`}
                        />
                      </div>
                    )}
                  >
                    {() => (
                      <img
                        src={computed(() => withBasePath(page.value.image))}
                        alt={computed(() => `Page ${pageNum}: ${page.value.title}`)}
                        class="absolute inset-0 w-full h-full object-contain"
                        data-testid={`scroll-page-image-${pageNum}`}
                      />
                    )}
                  </Show>
                </div>
              </div>
            );
          }}
        </For>
      </div>
      <div
        ref={translationColumnRef}
        class={viewerContentColumnStyles}
        data-testid="scroll-translation-column"
      >
        <div class={translationHeaderStyles} data-testid="scroll-translation-header">
          <span class="text-sm text-zd-gray font-futura">
            P.{currentPage} / {totalPages}
          </span>
          <Show when={computed(() => !!currentPageData.value?.sectionName)}>
            {() => (
              <span class="text-sm text-zd-gray ml-hgap-sm">
                — {computed(() => currentPageData.value?.sectionName ?? '')}
              </span>
            )}
          </Show>
        </div>
        <Show when={computed(() => currentPageData.value !== null)}>
          {() => {
            const selectedPage = computed(() => {
              const page = currentPageData.value;
              if (!page) throw new Error('Translation page is unavailable');
              return page;
            });
            return (
              <ProseContent
                page={selectedPage}
                lang={lang}
                testId="scroll-translation-panel"
                emptyTestId="scroll-no-translation"
              />
            );
          }}
        </Show>
      </div>
    </div>
  );
}
