import { useEffect, useRef, useCallback } from 'preact/hooks';
import type { JSX } from 'preact';
import ctl from './ctl';
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

interface ThumbsModalProps {
  pages: ManualPage[];
  currentPage: number;
  isOpen: boolean;
  onClose: () => void;
  onPageSelect: (pageNum: number) => void;
  /** Element to restore focus to when the modal closes. */
  triggerRef?: { current: HTMLElement | null };
}

const overlayStyles = ctl(`
  fixed inset-0
  z-[100]
  flex items-center justify-center
  bg-zd-overlay
`);

const contentStyles = ctl(`
  relative
  w-[95vw] max-h-[90vh]
  overflow-y-auto
  bg-black
  p-hgap-sm
  border border-zd-white
`);

const gridStyles = ctl(`
  grid
  grid-cols-[repeat(auto-fill,minmax(160px,1fr))]
  gap-[10px]
`);

const closeButtonStyles = ctl(`
  absolute top-[8px] right-[8px]
  z-[101]
  flex items-center justify-center
  w-[40px] h-[40px]
  bg-[rgba(0,0,0,0.6)]
  text-white text-xl
  rounded-lg
  cursor-pointer
  hover:bg-[rgba(255,255,255,0.2)]
  transition-colors
`);

const thumbItemStyles = ctl(`
  relative
  aspect-[1/1.414]
  cursor-pointer
  overflow-hidden
  rounded-sm
  transition-transform
  hover:scale-[1.03]
  hover:brightness-125
`);

const pageNumOverlayStyles = ctl(`
  absolute bottom-0 left-0 right-0
  bg-[rgba(0,0,0,0.7)]
  text-white text-xs text-center
  py-[2px]
`);

export function ThumbsModal({
  pages,
  currentPage,
  isOpen,
  onClose,
  onPageSelect,
  triggerRef,
}: ThumbsModalProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const currentThumbRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Escape key + Tab focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const container = overlayRef.current;
        if (!container) return;
        const focusable = Array.from(
          container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        ).filter((el) => !el.closest('[aria-hidden="true"]'));
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Restore focus to the trigger element on close
  useEffect(() => {
    if (isOpen) return;
    triggerRef?.current?.focus();
  }, [isOpen, triggerRef]);

  // Auto-scroll to current page on open
  useEffect(() => {
    if (isOpen && currentThumbRef.current) {
      requestAnimationFrame(() => {
        currentThumbRef.current?.scrollIntoView({
          block: 'center',
          behavior: 'instant',
        });
      });
    }
  }, [isOpen]);

  // Handle overlay click (close only when clicking the overlay itself)
  const handleOverlayClick = useCallback(
    (e: JSX.TargetedMouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  // Handle thumbnail click
  const handleThumbClick = useCallback(
    (pageNum: number) => {
      onPageSelect(pageNum);
      onClose();
    },
    [onPageSelect, onClose],
  );

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className={overlayStyles}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="ページ一覧"
    >
      <div className={contentStyles}>
        <button className={closeButtonStyles} onClick={onClose} aria-label="閉じる" type="button">
          ✕
        </button>
        <div className={gridStyles} ref={gridRef}>
          {pages.map((page) => {
            const isActive = page.pageNum === currentPage;
            return (
              <button
                key={page.pageNum}
                ref={isActive ? currentThumbRef : undefined}
                className={`${thumbItemStyles}${isActive ? ' border-3 border-zd-outline' : ''}`}
                onClick={() => handleThumbClick(page.pageNum)}
                type="button"
                aria-label={`ページ ${page.pageNum}`}
              >
                {page.image ? (
                  <img
                    src={withBasePath(getThumbImage(page.image))}
                    alt={`Page ${page.pageNum}`}
                    className="w-full h-full object-contain bg-white"
                    loading={isActive ? 'eager' : 'lazy'}
                  />
                ) : (
                  <div className="w-full h-full bg-zd-gray2" aria-hidden="true" />
                )}
                <span className={pageNumOverlayStyles}>{page.pageNum}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
