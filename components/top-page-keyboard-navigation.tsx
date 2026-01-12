'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { getPagePath } from '@/lib/manual-config';

interface TopPageKeyboardNavigationProps {
  manualId: string;
}

/**
 * Keyboard navigation for manual top page
 * - Right arrow: Go to first page
 */
export function TopPageKeyboardNavigation({ manualId }: TopPageKeyboardNavigationProps) {
  const router = useRouter();
  const routerRef = useRef(router);
  const manualIdRef = useRef(manualId);

  // Keep refs up to date
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    manualIdRef.current = manualId;
  }, [manualId]);

  // Set up keyboard listener only once
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

      // Right arrow: Go to first page
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        routerRef.current.push(getPagePath(manualIdRef.current, 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // Empty dependency array - listener set up only once

  return null; // This component doesn't render anything
}
