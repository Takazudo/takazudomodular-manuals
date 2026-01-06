'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import ctl from '@netlify/classnames-template-literals';
import { getNavigationState } from '@/lib/manual-data';
import { getPagePath } from '@/lib/manual-config';

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
  manualId: string;
}

export function PageNavigation({ currentPage, totalPages, manualId }: PageNavigationProps) {
  const router = useRouter();

  const handlePageSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const page = parseInt(e.target.value);
    router.push(getPagePath(manualId, page));
  };

  const { canGoToPrev, canGoToNext } = getNavigationState(currentPage, totalPages);

  // Memoize page options array to avoid recreating on every render
  const pageOptions = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i + 1),
    [totalPages],
  );

  return (
    <nav className={navContainerStyles} data-testid="page-navigation">
      {canGoToPrev ? (
        <Link
          href={getPagePath(manualId, currentPage - 1)}
          className={buttonStyles}
          data-testid="prev-page-button"
        >
          ← 前へ
        </Link>
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

      {canGoToNext ? (
        <Link
          href={getPagePath(manualId, currentPage + 1)}
          className={buttonStyles}
          data-testid="next-page-button"
        >
          次へ →
        </Link>
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
