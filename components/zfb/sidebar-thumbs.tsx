import { useEffect, useRef } from 'preact/hooks';
import ctl from './ctl';
import type { ManualPage } from '@/lib/types/manual';
import { withBasePath, getThumbImage } from './routing';

export interface SidebarThumbsProps {
  pages: ManualPage[];
  currentPage: number;
  onPageSelect: (pageNum: number) => void;
}

const sidebarStyles = ctl(`
  w-[160px] shrink-0
  h-[calc(100vh-60px)]
  bg-zd-gray2
  overflow-y-auto
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

export function SidebarThumbs({ pages, currentPage, onPageSelect }: SidebarThumbsProps) {
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [currentPage]);

  return (
    <aside className={sidebarStyles} aria-label="Page thumbnails">
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
              aria-current={isCurrent ? 'page' : undefined}
            >
              <div
                className={`${thumbImageWrapperStyles} border-3 ${isCurrent ? 'border-zd-outline' : 'border-transparent'}`}
              >
                {page.image ? (
                  <img
                    src={withBasePath(getThumbImage(page.image))}
                    alt={`Page ${page.pageNum}`}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-[120px] h-[160px] bg-zd-black" aria-hidden="true" />
                )}
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
