import { describe, it, expect } from 'vitest';
import * as PdfBuild from './pdf-build.js';

interface TranslationDraft {
  pageNum: number;
  totalPages?: number;
  translation?: string;
  en_clean?: string;
  status?: string;
}

interface EnPage {
  pageNum: number;
  image: string;
  title: string;
  sectionName: string | null;
  content: string;
  hasContent: boolean;
  tags: unknown[];
}

interface JaPage {
  pageNum: number;
  image: string;
  title: string;
  sectionName: string | null;
  content: string;
  hasContent: boolean;
  tags: unknown[];
}

interface BuildEnResult {
  pages: EnPage[];
  sources: { enClean: number; rawExtract: number };
}

const buildEnPages = PdfBuild.buildEnPages as (
  sortedPageNums: number[],
  translationsMap: Map<number, TranslationDraft>,
  extractedMap: Map<number, string>,
  slug: string,
) => BuildEnResult;

const buildJaPages = PdfBuild.buildJaPages as (
  sortedPageNums: number[],
  translationsMap: Map<number, TranslationDraft>,
  slug: string,
) => JaPage[];

const SLUG = 'oxi-one-mk2';

describe('pdf-build', () => {
  describe('buildEnPages', () => {
    it('uses en_clean from the translation draft when present', () => {
      const translationsMap = new Map<number, TranslationDraft>([
        [
          1,
          {
            pageNum: 1,
            translation: 'こんにちは',
            en_clean: 'Hello world\n\nThis is clean EN.',
            status: 'completed',
          },
        ],
      ]);
      const extractedMap = new Map<number, string>([[1, 'RAW extracted text with cruft']]);

      const { pages, sources } = buildEnPages([1], translationsMap, extractedMap, SLUG);

      expect(pages).toHaveLength(1);
      expect(pages[0].content).toBe('Hello world\n\nThis is clean EN.');
      expect(pages[0].hasContent).toBe(true);
      expect(pages[0].pageNum).toBe(1);
      expect(pages[0].image).toBe('/oxi-one-mk2/pages/page-001.png');
      expect(pages[0].title).toBe('Page 1');
      expect(pages[0].sectionName).toBeNull();
      expect(pages[0].tags).toEqual([]);
      expect(sources).toEqual({ enClean: 1, rawExtract: 0 });
    });

    it('falls back to extractedMap when en_clean is absent (backward compat)', () => {
      const translationsMap = new Map<number, TranslationDraft>([
        [
          2,
          {
            pageNum: 2,
            translation: 'ページ2',
            // no en_clean field - pre-topic-112 drafts
            status: 'completed',
          },
        ],
      ]);
      const extractedMap = new Map<number, string>([[2, 'Page 2 raw extracted text.']]);

      const { pages, sources } = buildEnPages([2], translationsMap, extractedMap, SLUG);

      expect(pages).toHaveLength(1);
      expect(pages[0].content).toBe('Page 2 raw extracted text.');
      expect(pages[0].hasContent).toBe(true);
      expect(sources).toEqual({ enClean: 0, rawExtract: 1 });
    });

    it('falls back to extractedMap when en_clean is an empty string', () => {
      // An empty en_clean means "page had only cruft" — but per issue #112
      // backward-compat rule, fall back to extracted text if it has content,
      // so existing pages render the same.
      const translationsMap = new Map<number, TranslationDraft>([
        [
          3,
          {
            pageNum: 3,
            translation: 'ページ3',
            en_clean: '',
            status: 'completed',
          },
        ],
      ]);
      const extractedMap = new Map<number, string>([[3, 'Some raw body']]);

      const { pages, sources } = buildEnPages([3], translationsMap, extractedMap, SLUG);

      expect(pages[0].content).toBe('Some raw body');
      expect(sources).toEqual({ enClean: 0, rawExtract: 1 });
    });

    it('honors a deliberately content-free page (empty translation AND empty en_clean)', () => {
      // Cruft-only pages (bare page numbers / "-- 1 of 1 --" markers): the
      // translator emits empty translation and empty en_clean. The raw
      // extract must NOT leak into the EN output (issue #284).
      const translationsMap = new Map<number, TranslationDraft>([
        [
          21,
          {
            pageNum: 21,
            translation: '',
            en_clean: '',
            status: 'completed',
          },
        ],
      ]);
      const extractedMap = new Map<number, string>([[21, '20\n\n-- 1 of 1 --']]);

      const { pages, sources } = buildEnPages([21], translationsMap, extractedMap, SLUG);

      expect(pages[0].content).toBe('');
      expect(pages[0].hasContent).toBe(false);
      expect(sources).toEqual({ enClean: 1, rawExtract: 0 });
    });

    it('falls back to extractedMap when the page has no translation draft at all', () => {
      const translationsMap = new Map<number, TranslationDraft>();
      const extractedMap = new Map<number, string>([[5, 'Orphan extracted page.']]);

      const { pages, sources } = buildEnPages([5], translationsMap, extractedMap, SLUG);

      expect(pages[0].content).toBe('Orphan extracted page.');
      expect(sources).toEqual({ enClean: 0, rawExtract: 1 });
    });

    it('emits empty content with hasContent=false when neither source exists', () => {
      const translationsMap = new Map<number, TranslationDraft>();
      const extractedMap = new Map<number, string>();

      const { pages, sources } = buildEnPages([9], translationsMap, extractedMap, SLUG);

      expect(pages[0].content).toBe('');
      expect(pages[0].hasContent).toBe(false);
      expect(sources).toEqual({ enClean: 0, rawExtract: 1 });
    });

    it('counts source distribution correctly across a mixed batch', () => {
      const translationsMap = new Map<number, TranslationDraft>([
        [1, { pageNum: 1, translation: 'A', en_clean: 'clean A', status: 'completed' }],
        [2, { pageNum: 2, translation: 'B', status: 'completed' }], // no en_clean
        [3, { pageNum: 3, translation: 'C', en_clean: 'clean C', status: 'completed' }],
      ]);
      const extractedMap = new Map<number, string>([
        [1, 'raw A'],
        [2, 'raw B'],
        [3, 'raw C'],
      ]);

      const { pages, sources } = buildEnPages([1, 2, 3], translationsMap, extractedMap, SLUG);

      expect(pages.map((p) => p.content)).toEqual(['clean A', 'raw B', 'clean C']);
      expect(sources).toEqual({ enClean: 2, rawExtract: 1 });
    });

    it('pads pageNum in the image path', () => {
      const translationsMap = new Map<number, TranslationDraft>();
      const extractedMap = new Map<number, string>([
        [7, 'x'],
        [42, 'y'],
        [123, 'z'],
      ]);

      const { pages } = buildEnPages([7, 42, 123], translationsMap, extractedMap, SLUG);

      expect(pages[0].image).toBe('/oxi-one-mk2/pages/page-007.png');
      expect(pages[1].image).toBe('/oxi-one-mk2/pages/page-042.png');
      expect(pages[2].image).toBe('/oxi-one-mk2/pages/page-123.png');
    });
  });

  describe('buildJaPages', () => {
    it('uses the translation field as content', () => {
      const translationsMap = new Map<number, TranslationDraft>([
        [
          1,
          {
            pageNum: 1,
            translation: 'こんにちは',
            en_clean: 'hello',
            status: 'completed',
          },
        ],
      ]);

      const pages = buildJaPages([1], translationsMap, SLUG);

      expect(pages).toHaveLength(1);
      expect(pages[0].content).toBe('こんにちは');
      expect(pages[0].hasContent).toBe(true);
      expect(pages[0].image).toBe('/oxi-one-mk2/pages/page-001.png');
    });

    it('emits empty content when translation is missing or empty', () => {
      const translationsMap = new Map<number, TranslationDraft>([
        [2, { pageNum: 2, translation: '', status: 'completed' }],
      ]);

      const pages = buildJaPages([1, 2], translationsMap, SLUG);

      expect(pages[0].content).toBe('');
      expect(pages[0].hasContent).toBe(false);
      expect(pages[1].content).toBe('');
      expect(pages[1].hasContent).toBe(false);
    });
  });
});
