'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { getNavigationState } from '@/lib/manual-data';
import { getPagePath, getManualBasePath } from '@/lib/manual-config';

interface KeyboardNavigationProps {
  currentPage: number;
  totalPages: number;
  manualId: string;
}

/**
 * Keyboard navigation for manual pages
 * - Left arrow: Previous page (or top page if on page 1)
 * - Right arrow: Next page
 */
export function KeyboardNavigation({ currentPage, totalPages, manualId }: KeyboardNavigationProps) {
  const router = useRouter();
  const routerRef = useRef(router);
  const stateRef = useRef({ currentPage, totalPages, manualId });

  // Keep refs up to date
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    stateRef.current = { currentPage, totalPages, manualId };
  }, [currentPage, totalPages, manualId]);

  // Set up keyboard listener only once
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea/select or contentEditable element
      const target = e.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      const { currentPage, totalPages, manualId } = stateRef.current;
      const { canGoToPrev, canGoToNext } = getNavigationState(currentPage, totalPages);

      // Left arrow: Previous page (or top page if on page 1)
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (canGoToPrev) {
          routerRef.current.push(getPagePath(manualId, currentPage - 1));
        } else if (currentPage === 1) {
          // On first page, go back to manual top page
          routerRef.current.push(getManualBasePath(manualId));
        }
      }
      // Right arrow: Next page
      else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (canGoToNext) {
          routerRef.current.push(getPagePath(manualId, currentPage + 1));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // Empty dependency array - listener set up only once

  return null; // This component doesn't render anything
}
