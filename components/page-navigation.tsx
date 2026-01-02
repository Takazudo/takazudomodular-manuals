'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import ctl from '@netlify/classnames-template-literals';
import { getNavigationState } from '@/lib/manual-data';

const navContainerStyles = ctl(`
  flex items-center justify-between gap-hgap-sm
  bg-zd-gray2 border border-zd-gray3 border-0 border-b-1
  pb-vgap-sm
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
}

export function PageNavigation({ currentPage, totalPages }: PageNavigationProps) {
  const router = useRouter();

  const handlePageSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const page = parseInt(e.target.value);
    router.push(`/page/${page}`);
  };

  const { canGoToPrev, canGoToNext } = getNavigationState(currentPage, totalPages);

  // Memoize page options array to avoid recreating on every render
  const pageOptions = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i + 1),
    [totalPages],
  );

  return (
    <nav className={navContainerStyles}>
      {canGoToPrev ? (
        <Link href={`/page/${currentPage - 1}`} className={buttonStyles}>
          ← 前へ
        </Link>
      ) : (
        <span className={`${buttonStyles} opacity-50 cursor-not-allowed`} aria-disabled="true">
          ← 前へ
        </span>
      )}

      <div className={pageInfoStyles}>
        <span>ページ</span>
        <select
          value={currentPage}
          onChange={handlePageSelect}
          className={selectStyles}
          aria-label="ページを選択"
        >
          {pageOptions.map((page) => (
            <option key={page} value={page}>
              {page}
            </option>
          ))}
        </select>
        <span>/ {totalPages}</span>
      </div>

      {canGoToNext ? (
        <Link href={`/page/${currentPage + 1}`} className={buttonStyles}>
          次へ →
        </Link>
      ) : (
        <span className={`${buttonStyles} opacity-50 cursor-not-allowed`} aria-disabled="true">
          次へ →
        </span>
      )}
    </nav>
  );
}
