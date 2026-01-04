'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getNavigationState } from '@/lib/manual-data';
import { getPagePath } from '@/lib/manual-config';

interface KeyboardNavigationProps {
  currentPage: number;
  totalPages: number;
}

/**
 * Keyboard navigation for manual pages
 * - Left arrow: Previous page
 * - Right arrow: Next page
 */
export function KeyboardNavigation({ currentPage, totalPages }: KeyboardNavigationProps) {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea/select or contentEditable element
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      const { canGoToPrev, canGoToNext } = getNavigationState(currentPage, totalPages);

      // Left arrow: Previous page
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (canGoToPrev) {
          router.push(getPagePath(currentPage - 1));
        }
      }
      // Right arrow: Next page
      else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (canGoToNext) {
          router.push(getPagePath(currentPage + 1));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, router]);

  return null; // This component doesn't render anything
}
