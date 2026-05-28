import { useEffect, useRef } from 'preact/hooks';
import { getNavigationState } from './routing';

interface KeyboardNavigationProps {
  currentPage: number;
  totalPages: number;
  /** Navigate to the given page (client-side, owned by the island). */
  onNavigate: (pageNum: number) => void;
  /** Navigate back to the manual's top/index page (left arrow on page 1). */
  onNavigateHome: () => void;
  /** When true (fetch failed), arrow-key navigation is suppressed. */
  navDisabled?: boolean;
}

/**
 * Keyboard navigation for manual pages.
 * - Left arrow: Previous page (or manual top page if on page 1)
 * - Right arrow: Next page
 *
 * Ported from `components/keyboard-navigation.tsx`. The Next.js version drove
 * `useRouter().push`; here navigation is delegated to the island's
 * `onNavigate`/`onNavigateHome` callbacks, which call `history.pushState`.
 * Renders nothing.
 */
export function KeyboardNavigation({
  currentPage,
  totalPages,
  onNavigate,
  onNavigateHome,
  navDisabled = false,
}: KeyboardNavigationProps) {
  // Keep latest values in a ref so the keydown listener is installed once but
  // always reads current state — mirrors the original's stateRef pattern.
  const stateRef = useRef({ currentPage, totalPages, onNavigate, onNavigateHome, navDisabled });
  useEffect(() => {
    stateRef.current = { currentPage, totalPages, onNavigate, onNavigateHome, navDisabled };
  }, [currentPage, totalPages, onNavigate, onNavigateHome, navDisabled]);

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

      const {
        currentPage: page,
        totalPages: total,
        onNavigate: navigate,
        onNavigateHome: navigateHome,
        navDisabled: disabled,
      } = stateRef.current;
      if (disabled) return;

      const { canGoToPrev, canGoToNext } = getNavigationState(page, total);

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (canGoToPrev) {
          navigate(page - 1);
        } else if (page === 1) {
          navigateHome();
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (canGoToNext) {
          navigate(page + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // Listener installed once; reads live state via stateRef.

  return null;
}
