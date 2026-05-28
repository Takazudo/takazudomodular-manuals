import { useMemo } from 'preact/hooks';
import type { JSX } from 'preact';
import ctl from './ctl';
import { getNavigationState } from './routing';

const navContainerStyles = ctl(`
  flex items-center justify-between gap-hgap-sm
  pb-vgap-sm
  border-b border-zd-gray
  border-dashed
`);

const buttonStyles = ctl(`
  px-hgap-sm py-vgap-xs
  bg-zd-gray3 hover:bg-zd-gray4
  text-zd-white text-sm
  rounded border border-zd-gray4
  transition-colors
  disabled:opacity-50 disabled:cursor-not-allowed
  disabled:hover:bg-zd-gray3
`);

const pageInfoStyles = ctl(`
  flex items-center gap-hgap-sm
  text-sm text-zd-gray7
`);

const selectStyles = ctl(`
  bg-zd-gray3 border border-zd-gray4
  text-zd-white text-sm
  px-hgap-xs py-vgap-xs rounded
  cursor-pointer
  hover:bg-zd-gray4
  transition-colors
`);

interface PageNavigationProps {
  currentPage: number;
  totalPages: number;
  /** Navigate to the given page (client-side, owned by the island). */
  onNavigate: (pageNum: number) => void;
  /**
   * When true, fetch failed and in-manual nav is disabled. Prev/next become
   * inert and the page selector is disabled — see the island's error state.
   */
  navDisabled?: boolean;
}

export function PageNavigation({
  currentPage,
  totalPages,
  onNavigate,
  navDisabled = false,
}: PageNavigationProps) {
  const handlePageSelect = (e: JSX.TargetedEvent<HTMLSelectElement>) => {
    const page = parseInt(e.currentTarget.value, 10);
    onNavigate(page);
  };

  const { canGoToPrev, canGoToNext } = getNavigationState(currentPage, totalPages);
  const prevEnabled = canGoToPrev && !navDisabled;
  const nextEnabled = canGoToNext && !navDisabled;

  // Memoize page options array to avoid recreating on every render
  const pageOptions = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i + 1),
    [totalPages],
  );

  return (
    <nav className={navContainerStyles} data-testid="page-navigation">
      {prevEnabled ? (
        <button
          type="button"
          onClick={() => onNavigate(currentPage - 1)}
          className={buttonStyles}
          data-testid="prev-page-button"
        >
          ← 前へ
        </button>
      ) : (
        <span
          className={`${buttonStyles} opacity-50 cursor-not-allowed`}
          aria-disabled="true"
          data-testid="prev-page-button-disabled"
        >
          ← 前へ
        </span>
      )}

      <div className={pageInfoStyles} data-testid="page-info">
        <span>ページ</span>
        <select
          value={currentPage}
          onChange={handlePageSelect}
          className={selectStyles}
          aria-label="ページを選択"
          disabled={navDisabled}
          data-testid="page-selector"
        >
          {pageOptions.map((page) => (
            <option key={page} value={page}>
              {page}
            </option>
          ))}
        </select>
        <span data-testid="total-pages">/ {totalPages}</span>
      </div>

      {nextEnabled ? (
        <button
          type="button"
          onClick={() => onNavigate(currentPage + 1)}
          className={buttonStyles}
          data-testid="next-page-button"
        >
          次へ →
        </button>
      ) : (
        <span
          className={`${buttonStyles} opacity-50 cursor-not-allowed`}
          aria-disabled="true"
          data-testid="next-page-button-disabled"
        >
          次へ →
        </span>
      )}
    </nav>
  );
}
