'use client';

import { useEffect, useRef } from 'react';
import ctl from '@netlify/classnames-template-literals';
import type { ManualPage } from '@/lib/types/manual';
import { withBasePath } from '@/lib/asset-url';

export interface SidebarThumbsProps {
  pages: ManualPage[];
  currentPage: number;
  totalPages: number;
  manualId: string;
  isOpen: boolean;
  onPageSelect: (pageNum: number) => void;
}

const sidebarStyles = ctl(`
  fixed left-0 top-[60px]
  w-[160px]
  h-[calc(100vh-60px)]
  bg-zd-gray2
  overflow-y-auto
  z-40
  transition-transform duration-300 ease-in-out
  scrollbar-hide
`);

const thumbListStyles = ctl(`
  flex flex-col
  gap-vgap-2xs
  p-hgap-2xs
`);

const thumbButtonStyles = ctl(`
  flex flex-col items-center
  p-hgap-2xs
  cursor-pointer
  rounded-sm
`);

const thumbImageWrapperStyles = ctl(`
  w-[120px]
  overflow-hidden
  rounded-sm
`);

const pageNumStyles = ctl(`
  text-xs
  mt-vgap-2xs
  text-center
`);

export function SidebarThumbs({
  pages,
  currentPage,
  isOpen,
  onPageSelect,
}: SidebarThumbsProps) {
  const activeRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll to keep the current page thumbnail visible
  useEffect(() => {
    if (isOpen && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentPage, isOpen]);

  return (
    <aside
      className={`${sidebarStyles} ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      aria-label="Page thumbnails"
    >
      <div className={thumbListStyles}>
        {pages.map((page) => {
          const isCurrent = page.pageNum === currentPage;
          return (
            <button
              key={page.pageNum}
              ref={isCurrent ? activeRef : undefined}
              type="button"
              onClick={() => onPageSelect(page.pageNum)}
              className={`${thumbButtonStyles} hover:bg-white/10`}
            >
              <div
                className={`${thumbImageWrapperStyles} border-2 ${isCurrent ? 'border-zd-outline' : 'border-transparent'}`}
              >
                <img
                  src={withBasePath(page.image)}
                  alt={`Page ${page.pageNum}`}
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
              <span
                className={`${pageNumStyles} ${isCurrent ? 'text-zd-white font-medium' : 'text-zd-gray'}`}
              >
                {page.pageNum}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
