import { getScope, signal, type ReadonlySignal } from '@takazudo/zfb/zudo-react';
import { getNavigationState } from './routing';

interface KeyboardNavigationProps {
  currentPage: ReadonlySignal<number>;
  totalPages: number;
  /** Navigate to the given page (client-side, owned by the island). */
  onNavigate: (pageNum: number) => void;
  /** Navigate back to the manual's top/index page (left arrow on page 1). */
  onNavigateHome: () => void;
  /** When true (fetch failed), arrow-key navigation is suppressed. */
  navDisabled?: ReadonlySignal<boolean>;
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
  navDisabled = signal(false),
}: KeyboardNavigationProps) {
  getScope().onActivate(() => {
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

      const page = currentPage.value;
      const total = totalPages;
      const navigate = onNavigate;
      const navigateHome = onNavigateHome;
      if (navDisabled.value) return;

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
  });

  return null;
}
