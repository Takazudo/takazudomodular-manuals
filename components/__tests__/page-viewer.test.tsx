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
import { cleanup, render, screen } from '@testing-library/preact';
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
