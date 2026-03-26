'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_THRESHOLDS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

interface UseIntersectionPagesOptions {
  rootMargin?: string;
  threshold?: number | number[];
  initialPage?: number;
}

interface UseIntersectionPagesReturn {
  observerRef: (node: HTMLElement | null, pageNum: number) => void;
  currentPage: number;
  visiblePages: Set<number>;
}

/**
 * Custom hook for IntersectionObserver-based page tracking.
 * Observes page elements and determines which page is most visible
 * based on intersection ratios (highest ratio = current page).
 */
export function useIntersectionPages(
  options: UseIntersectionPagesOptions = {},
): UseIntersectionPagesReturn {
  const { rootMargin = '0px', threshold = DEFAULT_THRESHOLDS, initialPage = 1 } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  // visiblePages tracked as ref to avoid unnecessary re-renders on every scroll
  const visiblePagesRef = useRef<Set<number>>(new Set());

  // element -> pageNum mapping for observer callback lookups
  const nodeMapRef = useRef<Map<HTMLElement, number>>(new Map());
  // pageNum -> intersectionRatio for current page detection
  const ratiosRef = useRef<Map<number, number>>(new Map());
  const observerInstanceRef = useRef<IntersectionObserver | null>(null);
  const rafRef = useRef(0);
  // Stable reference for threshold to avoid useEffect re-runs
  const thresholdRef = useRef(threshold);

  useEffect(() => {
    let mounted = true;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const pageNum = nodeMapRef.current.get(entry.target as HTMLElement);
          if (pageNum === undefined) continue;

          if (entry.isIntersecting) {
            ratiosRef.current.set(pageNum, entry.intersectionRatio);
          } else {
            ratiosRef.current.delete(pageNum);
          }
        }

        visiblePagesRef.current = new Set(ratiosRef.current.keys());

        // Debounce current page detection via requestAnimationFrame
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          if (!mounted) return;

          let maxRatio = 0;
          let maxPage = -1;
          for (const [pageNum, ratio] of ratiosRef.current) {
            if (ratio > maxRatio) {
              maxRatio = ratio;
              maxPage = pageNum;
            }
          }
          if (maxPage > 0) {
            setCurrentPage(maxPage);
          }
        });
      },
      { rootMargin, threshold: thresholdRef.current },
    );

    observerInstanceRef.current = observer;

    // Observe elements that were registered before the observer was created
    for (const element of nodeMapRef.current.keys()) {
      observer.observe(element);
    }

    return () => {
      mounted = false;
      observer.disconnect();
      cancelAnimationFrame(rafRef.current);
      observerInstanceRef.current = null;
    };
  }, [rootMargin]);

  // Callback to register/unregister page elements with the observer
  const observerRef = useCallback((node: HTMLElement | null, pageNum: number) => {
    // Remove any previous element mapped to this pageNum
    // Use Array.from to avoid mutating Map during iteration
    for (const [el, num] of Array.from(nodeMapRef.current)) {
      if (num === pageNum && el !== node) {
        nodeMapRef.current.delete(el);
        observerInstanceRef.current?.unobserve(el);
      }
    }

    if (node) {
      if (!nodeMapRef.current.has(node)) {
        nodeMapRef.current.set(node, pageNum);
        observerInstanceRef.current?.observe(node);
      }
    }
  }, []);

  return { observerRef, currentPage, visiblePages: visiblePagesRef.current };
}
