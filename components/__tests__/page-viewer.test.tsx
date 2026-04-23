import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { ManualPage } from '@/lib/types/manual';
import { PageViewer } from '../page-viewer';

// The viewer uses next/navigation internally via PageNavigation / KeyboardNavigation.
// Stub useRouter so those children render in jsdom without a Next.js runtime.
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/oxi-one-mk2/page/1',
  useSearchParams: () => new URLSearchParams(),
}));

const pageWithContent = (lang: 'ja' | 'en'): ManualPage => ({
  pageNum: 1,
  image: '/oxi-one-mk2/pages/page-001.png',
  title: 'Intro',
  sectionName: 'Overview',
  content: lang === 'ja' ? 'こんにちは' : 'Hello world',
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
      />,
    );
    const panel = screen.getByTestId('translation-panel');
    expect(panel.getAttribute('lang')).toBe('ja');
    expect(panel.textContent).toContain('こんにちは');
  });

  it('tags the translation panel with lang="en" when lang is en', () => {
    render(
      <PageViewer
        page={pageWithContent('en')}
        lang="en"
        currentPage={1}
        totalPages={10}
        manualId="oxi-one-mk2"
      />,
    );
    const panel = screen.getByTestId('translation-panel');
    expect(panel.getAttribute('lang')).toBe('en');
    expect(panel.textContent).toContain('Hello world');
  });

  it('renders Japanese empty-state copy when lang is ja and page has no content', () => {
    render(
      <PageViewer
        page={pageWithoutContent}
        lang="ja"
        currentPage={2}
        totalPages={10}
        manualId="oxi-one-mk2"
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
      />,
    );
    const msg = screen.getByTestId('no-translation-message');
    expect(msg.getAttribute('lang')).toBe('en');
    expect(msg.textContent).toBe('No text extracted for this page.');
  });
});
