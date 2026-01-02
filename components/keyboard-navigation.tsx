'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface KeyboardNavigationProps {
  currentPage: number;
  totalPages: number;
}

/**
 * Keyboard navigation for manual pages
 * - Left arrow / Shift+Space: Previous page
 * - Right arrow / Space: Next page
 */
export function KeyboardNavigation({ currentPage, totalPages }: KeyboardNavigationProps) {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea/select
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        return;
      }

      // Left arrow or Shift+Space: Previous page
      if (e.key === 'ArrowLeft' || (e.key === ' ' && e.shiftKey)) {
        e.preventDefault();
        if (currentPage > 1) {
          router.push(`/page/${currentPage - 1}`);
        }
      }
      // Right arrow or Space (without Shift): Next page
      else if (e.key === 'ArrowRight' || (e.key === ' ' && !e.shiftKey)) {
        e.preventDefault();
        if (currentPage < totalPages) {
          router.push(`/page/${currentPage + 1}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, router]);

  return null; // This component doesn't render anything
}
