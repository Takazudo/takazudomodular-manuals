/**
 * Regression test for components/zfb/scroll-viewer.tsx (#154).
 *
 * Bug: the mount-snap `useLayoutEffect` had deps `[initialPage]`, and
 * manual-app passes `initialPage={currentPage}` (live parent state). In scroll
 * mode the IntersectionObserver updates `currentPage` on every page detection,
 * which re-passed a new `initialPage` and re-fired the effect — re-snapping
 * `scrollTop` and interrupting continuous scroll / smooth thumbnail jumps.
 *
 * Fix: capture the initial page once on mount and run the snap effect with
 * empty deps. This test asserts the snap write fires once (mount) and NOT
 * again when `initialPage` changes after mount.
 *
 * NOTE: jsdom has no layout (offsetTop is 0, no smooth scrolling), so this can
 * only prove the effect no longer re-fires — the "uninterrupted smooth jump"
 * acceptance criterion is verified by the manager in a real browser.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/preact';
import { ScrollViewer } from '@/components/zfb/scroll-viewer';
import type { ManualPage } from '@/lib/types/manual';

// IntersectionObserver is not available in jsdom. Stub it as an inert observer
// so neither page-detection nor lazy-load observers do anything during the test.
class FakeIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

function makePage(pageNum: number): ManualPage {
  return {
    pageNum,
    image: `/oxi-one-mk2/pages/page-${String(pageNum).padStart(3, '0')}.png`,
    title: `Page ${pageNum}`,
    sectionName: null,
    content: `Content ${pageNum}`,
    hasContent: true,
  };
}

const pages = [makePage(1), makePage(2), makePage(3), makePage(4), makePage(5)];

// Tracks every assignment to `.scrollTop` on the scroll container so we can
// count mount-snap writes. jsdom's default scrollTop is a writable own/proto
// property; we redefine it on the element prototype to record writes.
let scrollTopWrites: number[] = [];

beforeEach(() => {
  scrollTopWrites = [];

  (
    globalThis as unknown as { IntersectionObserver: typeof IntersectionObserver }
  ).IntersectionObserver = FakeIntersectionObserver as unknown as typeof IntersectionObserver;

  // Instrument scrollTop on HTMLElement so writes from the snap effect are
  // recorded. We only record writes to elements flagged as the scroll column.
  Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
    configurable: true,
    get() {
      return (this as { _scrollTop?: number })._scrollTop ?? 0;
    },
    set(value: number) {
      (this as { _scrollTop?: number })._scrollTop = value;
      if ((this as HTMLElement).dataset?.testid === 'scroll-image-column') {
        scrollTopWrites.push(value);
      }
    },
  });
});

afterEach(() => {
  cleanup();
  delete (HTMLElement.prototype as { scrollTop?: unknown }).scrollTop;
});

describe('ScrollViewer mount-snap (#154)', () => {
  it('does NOT re-snap scrollTop when initialPage changes after mount', () => {
    const { rerender } = render(
      <ScrollViewer
        pages={pages}
        lang="ja"
        initialPage={2}
        totalPages={pages.length}
        manualId="oxi-one-mk2"
      />,
    );

    // Exactly one mount snap (offsetTop is 0 in jsdom, so the value is 0; we
    // assert the count of writes, not the value).
    const writesAfterMount = scrollTopWrites.length;
    expect(writesAfterMount).toBe(1);

    // Simulate the parent re-passing a new initialPage (what happens when the
    // observer detects a page change in scroll mode). The snap effect must NOT
    // fire again.
    rerender(
      <ScrollViewer
        pages={pages}
        lang="ja"
        initialPage={4}
        totalPages={pages.length}
        manualId="oxi-one-mk2"
      />,
    );

    expect(scrollTopWrites.length).toBe(writesAfterMount);
  });
});
