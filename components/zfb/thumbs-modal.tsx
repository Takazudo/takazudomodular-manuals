import { computed, For, getScope, type ReadonlySignal, type Ref } from '@takazudo/zfb/zudo-react';
import type { ManualPage } from '@/lib/types/manual';
import { withBasePath, getThumbImage } from './routing';

// Selector for all focusable elements — used by the focus trap
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

const overlayStyles = 'fixed inset-0 z-[100] flex items-center justify-center bg-zd-overlay';

const contentStyles =
  'relative w-[95vw] max-h-[90vh] overflow-y-auto bg-black p-hgap-sm border border-zd-white';

const gridStyles = 'grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-[10px]';

const closeButtonStyles =
  'absolute top-[8px] right-[8px] z-[101] flex items-center justify-center w-[40px] h-[40px] bg-[rgba(0,0,0,0.6)] text-white text-xl rounded-lg cursor-pointer hover:bg-[rgba(255,255,255,0.2)] transition-colors';

const thumbItemStyles =
  'relative aspect-[1/1.414] cursor-pointer overflow-hidden rounded-sm transition-transform thumbnail-hover-scale';

const pageNumOverlayStyles =
  'absolute bottom-0 left-0 right-0 bg-[rgba(0,0,0,0.7)] text-white text-xs text-center py-[2px]';

interface ThumbsModalProps {
  pages: ReadonlySignal<ManualPage[]>;
  currentPage: ReadonlySignal<number>;
  onClose: () => void;
  onPageSelect: (pageNum: number) => void;
  triggerRef?: Ref<HTMLElement>;
}

/** The caller's Show owns the modal lifetime and focus restoration. */
export function ThumbsModal({
  pages,
  currentPage,
  onClose,
  onPageSelect,
  triggerRef,
}: ThumbsModalProps) {
  const overlayRef: Ref<HTMLDivElement> = { current: null };
  getScope().onActivate(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(
        overlayRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [],
      ).filter((el) => !el.closest('[aria-hidden="true"]'));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    const frame = requestAnimationFrame(() => {
      overlayRef.current
        ?.querySelector<HTMLElement>('[aria-current="page"]')
        ?.scrollIntoView({ block: 'center', behavior: 'instant' });
    });
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown);
      (triggerRef?.current ?? previouslyFocused)?.focus();
    };
  });
  return (
    <div
      ref={overlayRef}
      class={overlayStyles}
      on:click={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="ページ一覧"
    >
      <div class={contentStyles}>
        <button class={closeButtonStyles} on:click={onClose} aria-label="閉じる" type="button">
          ✕
        </button>
        <div class={gridStyles}>
          <For each={pages} by={(page) => page.pageNum}>
            {(page) => {
              const isActive = computed(() => page.value.pageNum === currentPage.value);
              return (
                <button
                  class={computed(
                    () =>
                      `${thumbItemStyles}${isActive.value ? ' border-3 border-zd-outline' : ''}`,
                  )}
                  on:click={() => {
                    onPageSelect(page.value.pageNum);
                    onClose();
                  }}
                  type="button"
                  aria-label={computed(() => `ページ ${page.value.pageNum}`)}
                  aria-current={computed(() => (isActive.value ? 'page' : null))}
                >
                  {page.value.image ? (
                    <img
                      src={computed(() => withBasePath(getThumbImage(page.value.image)))}
                      alt={computed(() => `Page ${page.value.pageNum}`)}
                      class="w-full h-full object-contain bg-white"
                      loading={computed(() => (isActive.value ? 'eager' : 'lazy'))}
                    />
                  ) : (
                    <div class="w-full h-full bg-zd-gray2" aria-hidden="true" />
                  )}
                  <span class={pageNumOverlayStyles}>{computed(() => page.value.pageNum)}</span>
                </button>
              );
            }}
          </For>
        </div>
      </div>
    </div>
  );
}
