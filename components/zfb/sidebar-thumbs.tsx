import { computed, For, getScope, type ReadonlySignal, type Ref } from '@takazudo/zfb/zudo-react';
import type { ManualPage } from '@/lib/types/manual';
import { withBasePath, getThumbImage } from './routing';
export interface SidebarThumbsProps {
  pages: ReadonlySignal<ManualPage[]>;
  currentPage: ReadonlySignal<number>;
  onPageSelect: (pageNum: number) => void;
}

const sidebarStyles =
  'w-[160px] shrink-0 h-[calc(100vh_-_60px)] bg-zd-gray2 overflow-y-auto scrollbar-hide';

const thumbListStyles = 'flex flex-col gap-vgap-2xs p-hgap-2xs';

const thumbButtonStyles = 'flex flex-col items-center p-hgap-2xs cursor-pointer rounded-sm';

const thumbImageWrapperStyles = 'w-[120px] overflow-hidden rounded-sm';

const pageNumStyles = 'text-xs mt-vgap-2xs text-center';

export function SidebarThumbs({ pages, currentPage, onPageSelect }: SidebarThumbsProps) {
  const containerRef: Ref<HTMLElement> = { current: null };
  getScope().effect(() => {
    void currentPage.value;
    containerRef.current
      ?.querySelector<HTMLElement>('[aria-current="page"]')
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  return (
    <aside ref={containerRef} class={sidebarStyles} aria-label="Page thumbnails">
      <div class={thumbListStyles}>
        <For each={pages} by={(page) => page.pageNum}>
          {(page) => {
            const isCurrent = computed(() => page.value.pageNum === currentPage.value);
            return (
              <button
                type="button"
                on:click={() => onPageSelect(page.value.pageNum)}
                class={`${thumbButtonStyles} hover:bg-white/10`}
                aria-current={computed(() => (isCurrent.value ? 'page' : null))}
              >
                <div
                  class={computed(
                    () =>
                      `${thumbImageWrapperStyles} border-3 ${isCurrent.value ? 'border-zd-outline' : 'border-transparent'}`,
                  )}
                >
                  {page.value.image ? (
                    <img
                      src={computed(() => withBasePath(getThumbImage(page.value.image)))}
                      alt={computed(() => `Page ${page.value.pageNum}`)}
                      class="w-full h-auto"
                      loading="lazy"
                    />
                  ) : (
                    <div class="w-[120px] h-[160px] bg-zd-black" aria-hidden="true" />
                  )}
                </div>
                <span
                  class={computed(
                    () =>
                      `${pageNumStyles} ${isCurrent.value ? 'text-zd-white font-medium' : 'text-zd-gray'}`,
                  )}
                >
                  {computed(() => page.value.pageNum)}
                </span>
              </button>
            );
          }}
        </For>
      </div>
    </aside>
  );
}
