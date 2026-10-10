import { computed, getScope, signal, Show, type ReadonlySignal } from '@takazudo/zfb/zudo-react';
import { getNavigationState } from './routing';

const navContainerStyles =
  'flex items-center justify-between gap-hgap-sm pb-vgap-sm border-b border-zd-gray border-dashed';

const buttonStyles =
  'px-hgap-sm py-vgap-xs bg-zd-gray3 hover:bg-zd-gray4 text-zd-white text-sm rounded border border-zd-gray4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed page-navigation-button';

const pageInfoStyles = 'flex items-center gap-hgap-sm text-sm text-zd-gray7';

const selectStyles =
  'bg-zd-gray3 border border-zd-gray4 text-zd-white text-sm px-hgap-xs py-vgap-xs rounded cursor-pointer hover:bg-zd-gray4 transition-colors';

interface PageNavigationProps {
  currentPage: ReadonlySignal<number>;
  totalPages: number;
  /** Navigate to the given page (client-side, owned by the island). */
  onNavigate: (pageNum: number) => void;
  /**
   * When true, fetch failed and in-manual nav is disabled. Prev/next become
   * inert and the page selector is disabled — see the island's error state.
   */
  navDisabled?: ReadonlySignal<boolean>;
}

export function PageNavigation({
  currentPage,
  totalPages,
  onNavigate,
  navDisabled = signal(false),
}: PageNavigationProps) {
  const pageSelection = signal(String(currentPage.value));
  getScope().effect(() => {
    pageSelection.value = String(currentPage.value);
  });
  const prevEnabled = computed(
    () => getNavigationState(currentPage.value, totalPages).canGoToPrev && !navDisabled.value,
  );
  const nextEnabled = computed(
    () => getNavigationState(currentPage.value, totalPages).canGoToNext && !navDisabled.value,
  );
  const pageOptions = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav class={navContainerStyles} data-testid="page-navigation">
      <Show
        when={prevEnabled}
        fallback={() => (
          <span
            class={`${buttonStyles} opacity-50 cursor-not-allowed`}
            aria-disabled="true"
            data-testid="prev-page-button-disabled"
          >
            ← 前へ
          </span>
        )}
      >
        {() => (
          <button
            type="button"
            on:click={() => onNavigate(currentPage.value - 1)}
            class={buttonStyles}
            data-testid="prev-page-button"
          >
            ← 前へ
          </button>
        )}
      </Show>

      <div class={pageInfoStyles} data-testid="page-info">
        <span>ページ</span>
        <select
          modelValue={pageSelection}
          on:change={(event) => {
            if (!navDisabled.value) onNavigate(Number(event.currentTarget.value));
          }}
          class={selectStyles}
          aria-label="ページを選択"
          disabled={navDisabled}
          data-testid="page-selector"
        >
          {pageOptions.map((page) => (
            <option value={String(page)}>{page}</option>
          ))}
        </select>
        <span data-testid="total-pages">/ {totalPages}</span>
      </div>

      <Show
        when={nextEnabled}
        fallback={() => (
          <span
            class={`${buttonStyles} opacity-50 cursor-not-allowed`}
            aria-disabled="true"
            data-testid="next-page-button-disabled"
          >
            次へ →
          </span>
        )}
      >
        {() => (
          <button
            type="button"
            on:click={() => onNavigate(currentPage.value + 1)}
            class={buttonStyles}
            data-testid="next-page-button"
          >
            次へ →
          </button>
        )}
      </Show>
    </nav>
  );
}
