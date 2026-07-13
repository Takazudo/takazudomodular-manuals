/**
 * Tests for components/zfb/page-viewer.tsx (Preact, prop-based nav).
 *
 * Decision (#135): re-pointed at the zfb equivalent now because that is the
 * code that ships in production. The original components/page-viewer.tsx
 * (Next-coupled) is deleted in #137.
 *
 * No next/navigation mock needed — the zfb PageViewer receives onNavigate /
 * onNavigateHome as callbacks; navigation is owned by the island.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/preact';
import type { ManualPage } from '@/lib/types/manual';
import { PageViewer } from '../zfb/page-viewer';

const pageWithContent = (lang: 'ja' | 'en'): ManualPage => ({
  pageNum: 1,
  image: '/oxi-one-mk2/pages/page-001.png',
  title: 'Intro',
  sectionName: 'Overview',
  content: lang === 'ja' ? 'こんにちは' : 'Hello world',
  // ProseContent uses contentHtml when present; inject pre-rendered HTML to
  // match the zfb island's build-time rendering contract.
  contentHtml: lang === 'ja' ? '<p>こんにちは</p>' : '<p>Hello world</p>',
  hasContent: true,
});

const pageWithoutContent: ManualPage = {
  pageNum: 2,
  image: '/oxi-one-mk2/pages/page-002.png',
  title: 'Blank',
  sectionName: null,
  content: '',
  hasContent: false,
};

afterEach(() => {
  cleanup();
});

describe('PageViewer — language wiring', () => {
  it('tags the translation panel with lang="ja" when lang is ja', () => {
    render(
      <PageViewer
        page={pageWithContent('ja')}
        lang="ja"
        currentPage={1}
        totalPages={10}
        manualId="oxi-one-mk2"
        onNavigate={vi.fn()}
        onNavigateHome={vi.fn()}
      />,
    );
    const panel = screen.getByTestId('translation-panel');
    expect(panel.getAttribute('lang')).toBe('ja');
    expect(panel.innerHTML).toContain('こんにちは');
  });

  it('tags the translation panel with lang="en" when lang is en', () => {
    render(
      <PageViewer
        page={pageWithContent('en')}
        lang="en"
        currentPage={1}
        totalPages={10}
        manualId="oxi-one-mk2"
        onNavigate={vi.fn()}
        onNavigateHome={vi.fn()}
      />,
    );
    const panel = screen.getByTestId('translation-panel');
    expect(panel.getAttribute('lang')).toBe('en');
    expect(panel.innerHTML).toContain('Hello world');
  });

  it('renders Japanese empty-state copy when lang is ja and page has no content', () => {
    render(
      <PageViewer
        page={pageWithoutContent}
        lang="ja"
        currentPage={2}
        totalPages={10}
        manualId="oxi-one-mk2"
        onNavigate={vi.fn()}
        onNavigateHome={vi.fn()}
      />,
    );
    const msg = screen.getByTestId('no-translation-message');
    expect(msg.getAttribute('lang')).toBe('ja');
    expect(msg.textContent).toBe('このページには翻訳がありません');
  });

  it('renders English empty-state copy when lang is en and page has no content', () => {
    render(
      <PageViewer
        page={pageWithoutContent}
        lang="en"
        currentPage={2}
        totalPages={10}
        manualId="oxi-one-mk2"
        onNavigate={vi.fn()}
        onNavigateHome={vi.fn()}
      />,
    );
    const msg = screen.getByTestId('no-translation-message');
    expect(msg.getAttribute('lang')).toBe('en');
    expect(msg.textContent).toBe('No text extracted for this page.');
  });
});

describe('PageViewer — scroll reset on navigation', () => {
  // jsdom implements no layout, so an element's scrollTop is effectively a
  // no-op (always 0). Back it with a real settable property so a "scrolled
  // down" precondition can be simulated and the reset asserted.
  const makeScrollable = (el: Element) => {
    let value = 0;
    Object.defineProperty(el, 'scrollTop', {
      configurable: true,
      get: () => value,
      set: (n: number) => {
        value = n;
      },
    });
  };

  it('resets both scroll columns to the top when the page changes', () => {
    const { rerender } = render(
      <PageViewer
        page={pageWithContent('ja')}
        lang="ja"
        currentPage={1}
        totalPages={10}
        manualId="oxi-one-mk2"
        onNavigate={vi.fn()}
        onNavigateHome={vi.fn()}
      />,
    );

    const imageScroll = screen.getByTestId('page-image-scroll');
    const translationCol = screen.getByTestId('translation-column');
    makeScrollable(imageScroll);
    makeScrollable(translationCol);

    // Simulate the user scrolling down on the current page.
    imageScroll.scrollTop = 500;
    translationCol.scrollTop = 800;

    // Navigate to a different page (every nav path flows through currentPage).
    rerender(
      <PageViewer
        page={{ ...pageWithContent('ja'), pageNum: 2 }}
        lang="ja"
        currentPage={2}
        totalPages={10}
        manualId="oxi-one-mk2"
        onNavigate={vi.fn()}
        onNavigateHome={vi.fn()}
      />,
    );

    expect(imageScroll.scrollTop).toBe(0);
    expect(translationCol.scrollTop).toBe(0);
  });

  it('does not reset scroll on re-render that keeps the same page (e.g. language toggle)', () => {
    const { rerender } = render(
      <PageViewer
        page={pageWithContent('ja')}
        lang="ja"
        currentPage={3}
        totalPages={10}
        manualId="oxi-one-mk2"
        onNavigate={vi.fn()}
        onNavigateHome={vi.fn()}
      />,
    );

    const translationCol = screen.getByTestId('translation-column');
    makeScrollable(translationCol);
    translationCol.scrollTop = 600;

    // Same currentPage — only the language changes. Scroll should be preserved.
    rerender(
      <PageViewer
        page={pageWithContent('en')}
        lang="en"
        currentPage={3}
        totalPages={10}
        manualId="oxi-one-mk2"
        onNavigate={vi.fn()}
        onNavigateHome={vi.fn()}
      />,
    );

    expect(translationCol.scrollTop).toBe(600);
  });
});

describe('PageViewer — loading overlay', () => {
  const renderPage = () =>
    render(
      <PageViewer
        page={pageWithContent('ja')}
        lang="ja"
        currentPage={1}
        totalPages={10}
        manualId="oxi-one-mk2"
        onNavigate={vi.fn()}
        onNavigateHome={vi.fn()}
      />,
    );

  it('clears the loading overlay once the image fires its load event', () => {
    renderPage();
    const overlay = screen.getByTestId('page-image-overlay');
    expect(overlay.className).toContain('opacity-100');

    fireEvent.load(screen.getByTestId('page-image'));

    expect(overlay.className).toContain('opacity-0');
    expect(overlay.className).not.toContain('opacity-100');
  });

  // Regression: after ManualApp swaps the SSR body for the real PageViewer, the
  // fresh <img> points at an already-cached PNG. Its `load` event can fire in
  // the gap before Preact's onLoad listener is effective, and `complete` may not
  // yet be true at the synchronous mount-time check — leaving the overlay stuck
  // at opacity-100 over a fully loaded image. The post-mount rAF re-check must
  // clear it even though onLoad never fires. (Without the re-check this hangs.)
  it('clears the loading overlay for a cached image even when onLoad never fires', () => {
    const proto = window.HTMLImageElement.prototype;
    const origComplete = Object.getOwnPropertyDescriptor(proto, 'complete');
    const origNaturalWidth = Object.getOwnPropertyDescriptor(proto, 'naturalWidth');
    let imgComplete = false;
    Object.defineProperty(proto, 'complete', { configurable: true, get: () => imgComplete });
    Object.defineProperty(proto, 'naturalWidth', {
      configurable: true,
      get: () => (imgComplete ? 800 : 0),
    });

    // Capture the scheduled rAF callback so we can fire it deterministically
    // after flipping the image to "cached/complete" — no onLoad event is ever
    // dispatched, mirroring the missed-listener race.
    let rafCb: FrameRequestCallback | null = null;
    const rafSpy = vi
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        rafCb = cb;
        return 1;
      });
    const cafSpy = vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});

    try {
      renderPage();
      const overlay = screen.getByTestId('page-image-overlay');
      // Image not yet complete at mount → overlay still showing, rAF scheduled.
      expect(overlay.className).toContain('opacity-100');
      expect(rafCb).not.toBeNull();

      // The cached image becomes complete with no load event firing.
      imgComplete = true;
      act(() => {
        rafCb?.(0);
      });

      expect(overlay.className).toContain('opacity-0');
      expect(overlay.className).not.toContain('opacity-100');
    } finally {
      rafSpy.mockRestore();
      cafSpy.mockRestore();
      if (origComplete) Object.defineProperty(proto, 'complete', origComplete);
      if (origNaturalWidth) Object.defineProperty(proto, 'naturalWidth', origNaturalWidth);
    }
  });
});

describe('PageViewer — hover zoom', () => {
  const setRect = (el: Element, rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>) => {
    const fullRect = {
      ...rect,
      x: rect.left,
      y: rect.top,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
      toJSON: () => ({}),
    } as DOMRect;
    Object.defineProperty(el, 'getBoundingClientRect', {
      configurable: true,
      value: () => fullRect,
    });
  };

  it('positions the enlarged zoom panel over the left page image column', () => {
    render(
      <PageViewer
        page={pageWithContent('ja')}
        lang="ja"
        currentPage={1}
        totalPages={10}
        manualId="oxi-one-mk2"
        onNavigate={vi.fn()}
        onNavigateHome={vi.fn()}
        zoomEnabled
      />,
    );

    const image = screen.getByTestId('page-image') as HTMLImageElement;
    const imageColumn = screen.getByTestId('page-image-column');
    const translationColumn = screen.getByTestId('translation-column');
    const panel = screen.getByTestId('zoom-panel');

    Object.defineProperty(image, 'naturalWidth', {
      configurable: true,
      value: 1200,
    });
    setRect(image, { left: 30, top: 40, width: 400, height: 600 });
    setRect(imageColumn, { left: 10, top: 20, width: 500, height: 700 });
    setRect(translationColumn, { left: 520, top: 20, width: 500, height: 700 });

    fireEvent.mouseEnter(image, { clientX: 200, clientY: 220 });

    expect(panel.className).toContain('is-active');
    expect(panel.style.getPropertyValue('--zoom-panel-left')).toBe('10px');
    expect(panel.style.getPropertyValue('--zoom-panel-top')).toBe('20px');
    expect(panel.style.getPropertyValue('--zoom-panel-width')).toBe('500px');
    expect(panel.style.getPropertyValue('--zoom-panel-height')).toBe('700px');
    expect(panel.style.getPropertyValue('--zoom-panel-left')).not.toBe('520px');
  });
});
