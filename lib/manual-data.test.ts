import { describe, it, expect, vi, beforeEach } from 'vitest';

const jaPages = {
  metadata: {
    processedAt: '2026-01-01',
    language: 'ja' as const,
    imageFormat: 'png',
    imageDPI: 150,
  },
  pages: [
    {
      pageNum: 1,
      image: '/test/page-001.png',
      title: 'Page 1 JA',
      sectionName: null,
      content: '# テスト',
      hasContent: true,
    },
    {
      pageNum: 2,
      image: '/test/page-002.png',
      title: 'Page 2 JA',
      sectionName: 'Intro',
      content: '',
      hasContent: false,
    },
  ],
};

const enPages = {
  metadata: {
    processedAt: '2026-01-01',
    language: 'en' as const,
    imageFormat: 'png',
    imageDPI: 150,
  },
  pages: [
    {
      pageNum: 1,
      image: '/test/page-001.png',
      title: 'Page 1 EN',
      sectionName: null,
      content: '# Test',
      hasContent: true,
    },
    {
      pageNum: 2,
      image: '/test/page-002.png',
      title: 'Page 2 EN',
      sectionName: 'Intro',
      content: '',
      hasContent: false,
    },
  ],
};

const jaOnlyPages = {
  metadata: {
    processedAt: '2026-01-01',
    language: 'ja' as const,
    imageFormat: 'png',
    imageDPI: 150,
  },
  pages: [
    {
      pageNum: 1,
      image: '/ja-only/page-001.png',
      title: 'JA only',
      sectionName: null,
      content: '# JAのみ',
      hasContent: true,
    },
  ],
};

vi.mock('@/lib/manual-registry', () => ({
  getManifest: vi.fn((id: string) => {
    if (id === 'test-manual') return { title: 'Test Manual', brand: 'Test', totalPages: 10 };
    if (id === 'ja-only-manual') return { title: 'JA Only', brand: 'Test', totalPages: 1 };
    throw new Error(`Unknown manual: ${id}`);
  }),
  getPagesData: vi.fn((id: string, lang: 'ja' | 'en' = 'ja') => {
    if (id === 'test-manual') {
      return lang === 'en' ? enPages : jaPages;
    }
    if (id === 'ja-only-manual') {
      // Fallback: EN requested but missing → JA is returned by the real
      // registry, so the mock mirrors that behaviour.
      return jaOnlyPages;
    }
    throw new Error(`Unknown manual: ${id}`);
  }),
  getAvailableManuals: vi.fn(() => ['test-manual', 'ja-only-manual']),
}));

// Import after mock setup
import {
  getNavigationState,
  pageExists,
  getAllPageNumbers,
  getAllPages,
  getManualPage,
  getTotalPages,
} from './manual-data';

// Note: manual-data.ts has a module-level pagesCache keyed by
// `${manualId}::${lang}`. The cache cannot be reset between tests, so
// different manual IDs are used where cache interaction would confuse the
// assertions.
beforeEach(() => {
  vi.clearAllMocks();
});

describe('manual-data', () => {
  describe('getNavigationState', () => {
    it('returns canGoToPrev: false, canGoToNext: true for first page', () => {
      expect(getNavigationState(1, 10)).toEqual({
        canGoToPrev: false,
        canGoToNext: true,
      });
    });

    it('returns both true for middle page', () => {
      expect(getNavigationState(5, 10)).toEqual({
        canGoToPrev: true,
        canGoToNext: true,
      });
    });

    it('returns canGoToPrev: true, canGoToNext: false for last page', () => {
      expect(getNavigationState(10, 10)).toEqual({
        canGoToPrev: true,
        canGoToNext: false,
      });
    });

    it('returns both false for single-page manual', () => {
      expect(getNavigationState(1, 1)).toEqual({
        canGoToPrev: false,
        canGoToNext: false,
      });
    });
  });

  describe('pageExists', () => {
    it('returns true for valid page number', () => {
      expect(pageExists('test-manual', 1)).toBe(true);
    });

    it('returns false for page 0', () => {
      expect(pageExists('test-manual', 0)).toBe(false);
    });

    it('returns false for page beyond total', () => {
      expect(pageExists('test-manual', 11)).toBe(false);
    });
  });

  describe('getAllPageNumbers', () => {
    it('returns array of stringified page numbers', () => {
      const result = getAllPageNumbers('test-manual');
      expect(result).toHaveLength(10);
      expect(result[0]).toEqual({ pageNum: '1' });
      expect(result[9]).toEqual({ pageNum: '10' });
    });
  });

  describe('getAllPages', () => {
    it('defaults to JA when lang is omitted', () => {
      const pages = getAllPages('test-manual');
      expect(pages[0].title).toBe('Page 1 JA');
    });

    it('returns EN pages when lang is "en"', () => {
      const pages = getAllPages('test-manual', 'en');
      expect(pages[0].title).toBe('Page 1 EN');
    });

    it('returns JA pages when lang is "ja"', () => {
      const pages = getAllPages('test-manual', 'ja');
      expect(pages[0].title).toBe('Page 1 JA');
    });

    it('falls back to JA when EN is absent (no throw)', () => {
      const pages = getAllPages('ja-only-manual', 'en');
      expect(pages[0].title).toBe('JA only');
    });
  });

  describe('getManualPage', () => {
    it('returns page object for existing page (defaults to JA)', () => {
      const page = getManualPage('test-manual', 1);
      expect(page).not.toBeNull();
      expect(page?.pageNum).toBe(1);
      expect(page?.title).toBe('Page 1 JA');
    });

    it('returns EN page when lang is "en"', () => {
      const page = getManualPage('test-manual', 2, 'en');
      expect(page).not.toBeNull();
      expect(page?.title).toBe('Page 2 EN');
    });

    it('returns null for non-existing page', () => {
      expect(getManualPage('test-manual', 99)).toBeNull();
      expect(getManualPage('test-manual', 99, 'en')).toBeNull();
    });
  });

  describe('getTotalPages', () => {
    it('returns total pages from manifest', () => {
      expect(getTotalPages('test-manual')).toBe(10);
    });
  });
});
