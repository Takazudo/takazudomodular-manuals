import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/manual-registry', () => ({
  getManifest: vi.fn((id: string) => {
    if (id === 'test-manual') return { title: 'Test Manual', brand: 'Test', totalPages: 10 };
    throw new Error(`Unknown manual: ${id}`);
  }),
  getPagesData: vi.fn((id: string) => {
    if (id === 'test-manual')
      return {
        metadata: {
          processedAt: '2026-01-01',
          language: 'ja',
          imageFormat: 'png',
          imageDPI: 150,
        },
        pages: [
          {
            pageNum: 1,
            image: '/test/page-001.png',
            title: 'Page 1',
            sectionName: null,
            content: '# Test',
            hasContent: true,
          },
          {
            pageNum: 2,
            image: '/test/page-002.png',
            title: 'Page 2',
            sectionName: 'Intro',
            content: '',
            hasContent: false,
          },
        ],
      };
    throw new Error(`Unknown manual: ${id}`);
  }),
  getAvailableManuals: vi.fn(() => ['test-manual']),
}));

// Import after mock setup
import {
  getNavigationState,
  pageExists,
  getAllPageNumbers,
  getManualPage,
  getTotalPages,
} from './manual-data';

// Note: manual-data.ts has a module-level pagesCache that vi.clearAllMocks() cannot reset.
// All tests in this file use the same mock data for 'test-manual', so the cache is
// consistent across tests and results are correct despite caching.
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

  describe('getManualPage', () => {
    it('returns page object for existing page', () => {
      const page = getManualPage('test-manual', 1);
      expect(page).not.toBeNull();
      expect(page?.pageNum).toBe(1);
      expect(page?.title).toBe('Page 1');
    });

    it('returns null for non-existing page', () => {
      expect(getManualPage('test-manual', 99)).toBeNull();
    });
  });

  describe('getTotalPages', () => {
    it('returns total pages from manifest', () => {
      expect(getTotalPages('test-manual')).toBe(10);
    });
  });
});
