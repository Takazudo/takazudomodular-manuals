import {
  computed,
  getScope,
  signal,
  Show,
  type ReadonlySignal,
  type Ref,
} from '@takazudo/zfb/zudo-react';
import type { ManualPage } from '@/lib/types/manual';
import type { Lang } from './lang';
import { withBasePath } from './routing';
import { clamp, ZOOM_MIN_FACTOR, ZOOM_MAX_FACTOR } from './zoom';
import { ProseContent } from './prose-content';
import { PageNavigation } from './page-navigation';
import { KeyboardNavigation } from './keyboard-navigation';
import {
  viewerContainerStyles,
  viewerImageColumnOuterStyles,
  viewerImageColumnStyles,
  viewerContentColumnStyles,
  viewerImageWrapperStyles,
  viewerNavigationWrapperStyles,
} from './viewer-layout-styles';

const loaderWrapperStyles = 'absolute top-[50%] left-[50%] centered-loader z-10';

interface PageViewerProps {
  page: ReadonlySignal<ManualPage>;
  lang: ReadonlySignal<Lang>;
  currentPage: ReadonlySignal<number>;
  totalPages: number;
  manualId: string;
  onNavigate: (pageNum: number) => void;
  onNavigateHome: () => void;
  navDisabled?: ReadonlySignal<boolean>;
  zoomEnabled?: ReadonlySignal<boolean>;
}
const ZOOM_ACTIVE_CLASS = 'is-active';

export function PageViewer({
  page,
  lang,
  currentPage,
  totalPages,
  onNavigate,
  onNavigateHome,
  navDisabled = signal(false),
  zoomEnabled = signal(false),
}: PageViewerProps) {
  const scope = getScope();
  const isLoading = signal(true);
  const hasError = signal(false);
  const imgRef: Ref<HTMLImageElement> = { current: null };
  const imageScrollRef: Ref<HTMLDivElement> = { current: null };
  const imageColRef: Ref<HTMLDivElement> = { current: null };
  const contentColRef: Ref<HTMLDivElement> = { current: null };
  const lensRef: Ref<HTMLDivElement> = { current: null };
  const panelRef: Ref<HTMLDivElement> = { current: null };
  const zoomRafRef = { current: null as number | null };
  const lastPointerRef = { current: { x: 0, y: 0 } };
  const image = computed(() => page.value.image);
  const showImage = computed(() => !!image.value && !hasError.value);
  const showZoom = computed(() => zoomEnabled.value && showImage.value);

  const applyZoom = (clientX: number, clientY: number) => {
    const img = imgRef.current;
    const lens = lensRef.current;
    const panel = panelRef.current;
    const col = imageColRef.current;
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
  };

  const deactivateZoom = () => {
    if (zoomRafRef.current !== null) {
      cancelAnimationFrame(zoomRafRef.current);
      zoomRafRef.current = null;
    }
    lensRef.current?.classList.remove(ZOOM_ACTIVE_CLASS);
    panelRef.current?.classList.remove(ZOOM_ACTIVE_CLASS);
  };
  const activateZoom = () => {
    if (image.value)
      panelRef.current?.style.setProperty('--zoom-image', `url("${withBasePath(image.value)}")`);
    lensRef.current?.classList.add(ZOOM_ACTIVE_CLASS);
    panelRef.current?.classList.add(ZOOM_ACTIVE_CLASS);
  };
  const eligibleForZoom = () => showZoom.value && (imgRef.current?.naturalWidth ?? 0) > 0;
  const handleZoomEnter = (e: MouseEvent) => {
    if (!eligibleForZoom()) return;
    activateZoom();
    applyZoom(e.clientX, e.clientY);
  };
  const handleZoomMove = (e: MouseEvent) => {
    if (!eligibleForZoom()) return;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    if (zoomRafRef.current !== null) return;
    zoomRafRef.current = requestAnimationFrame(() => {
      zoomRafRef.current = null;
      if (!eligibleForZoom()) return;
      activateZoom();
      applyZoom(lastPointerRef.current.x, lastPointerRef.current.y);
    });
  };

  // Effects run after live src bindings commit. Decide loading atomically and
  // recheck next frame for a cached asset whose load event preceded activation.
  scope.effect(() => {
    void currentPage.value;
    void image.value;
    hasError.value = false;
    const clearIfComplete = () => {
      const img = imgRef.current;
      if (img?.complete && img.naturalWidth > 0) {
        isLoading.value = false;
        return true;
      }
      return false;
    };
    if (clearIfComplete()) return;
    isLoading.value = true;
    if (typeof requestAnimationFrame === 'function') {
      const frame = requestAnimationFrame(clearIfComplete);
      return () => cancelAnimationFrame(frame);
    }
    const timer = setTimeout(clearIfComplete, 0);
    return () => clearTimeout(timer);
  });
  scope.effect(() => {
    void currentPage.value;
    if (contentColRef.current) contentColRef.current.scrollTop = 0;
    if (imageScrollRef.current) imageScrollRef.current.scrollTop = 0;
    deactivateZoom();
    panelRef.current?.style.removeProperty('--zoom-image');
  });
  scope.effect(() => {
    if (!zoomEnabled.value) deactivateZoom();
  });
  scope.onActivate(() => deactivateZoom);

  return (
    <>
      <KeyboardNavigation
        currentPage={currentPage}
        totalPages={totalPages}
        onNavigate={onNavigate}
        onNavigateHome={onNavigateHome}
        navDisabled={navDisabled}
      />
      <div class={viewerContainerStyles}>
        <div ref={imageColRef} class={viewerImageColumnOuterStyles} data-testid="page-image-column">
          <div ref={imageScrollRef} class={viewerImageColumnStyles} data-testid="page-image-scroll">
            <div class={viewerImageWrapperStyles} data-testid="page-image-wrapper">
              <Show
                when={hasError}
                fallback={() => (
                  <Show
                    when={computed(() => !!image.value)}
                    fallback={() => (
                      <div class={loaderWrapperStyles} data-testid="page-image-missing">
                        <div class="text-zd-gray6 text-center">
                          <p class="text-lg mb-vgap-xs">画像がありません</p>
                          <p class="text-sm">ページ {currentPage}</p>
                        </div>
                      </div>
                    )}
                  >
                    {() => (
                      <img
                        ref={imgRef}
                        src={computed(() => withBasePath(image.value))}
                        alt={computed(() => `Page ${currentPage.value}: ${page.value.title}`)}
                        class="w-full h-auto"
                        on:load={() => {
                          isLoading.value = false;
                        }}
                        on:error={() => {
                          isLoading.value = false;
                          hasError.value = true;
                        }}
                        on:mouseenter={handleZoomEnter}
                        on:mousemove={handleZoomMove}
                        on:mouseleave={deactivateZoom}
                        data-testid="page-image"
                      />
                    )}
                  </Show>
                )}
              >
                {() => (
                  <div class={loaderWrapperStyles} data-testid="page-image-error">
                    <div class="text-center">
                      <p class="text-lg font-bold mb-vgap-xs">画像の読み込みに失敗しました</p>
                      <p class="text-sm text-zd-gray6">ページ {currentPage}</p>
                    </div>
                  </div>
                )}
              </Show>
            </div>
          </div>
          <Show when={showImage}>
            {() => (
              <div
                class={computed(
                  () =>
                    `absolute inset-0 bg-white z-10 flex items-center justify-center transition-opacity duration-300 ${isLoading.value ? 'opacity-100' : 'opacity-0 pointer-events-none'}`,
                )}
                aria-hidden="true"
                data-testid="page-image-overlay"
              >
                <div class="page-image-loader" />
              </div>
            )}
          </Show>
        </div>
        <div ref={contentColRef} class={viewerContentColumnStyles} data-testid="translation-column">
          <div class={viewerNavigationWrapperStyles} data-testid="page-navigation-wrapper">
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
      <Show when={showZoom}>
        {() => (
          <>
            <div ref={lensRef} class="zoom-lens" aria-hidden="true" data-testid="zoom-lens" />
            <div ref={panelRef} class="zoom-panel" aria-hidden="true" data-testid="zoom-panel" />
          </>
        )}
      </Show>
    </>
  );
}
