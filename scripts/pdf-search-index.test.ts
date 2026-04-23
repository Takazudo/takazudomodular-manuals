import { describe, it, expect } from 'vitest';
import * as SearchIndex from './pdf-search-index.js';

interface SearchEntry {
  id: string;
  pageNum: number;
  title: string;
  sectionName: string | null;
  body: string;
  url: string;
}

interface PageInput {
  pageNum: number;
  title: string;
  sectionName: string | null;
  content: string;
  hasContent: boolean;
}

const extractFirstHeading = SearchIndex.extractFirstHeading as (c: unknown) => string | null;
const stripMarkdown = SearchIndex.stripMarkdown as (c: unknown) => string;
const truncate = SearchIndex.truncate as (t: string, max?: number) => string;
const buildEntry = SearchIndex.buildEntry as (page: PageInput, slug: string) => SearchEntry;
const buildIndex = SearchIndex.buildIndex as (doc: unknown, slug: string) => SearchEntry[];

describe('pdf-search-index', () => {
  describe('extractFirstHeading', () => {
    it('returns the first ATX heading text', () => {
      expect(extractFirstHeading('# Hello\n\nSome text')).toBe('Hello');
      expect(extractFirstHeading('## Sub\n\nBody')).toBe('Sub');
      expect(extractFirstHeading('body\n# Later')).toBe('Later');
    });

    it('strips trailing closing hashes (closed ATX style)', () => {
      expect(extractFirstHeading('# Hello #')).toBe('Hello');
      expect(extractFirstHeading('## Sub ##')).toBe('Sub');
    });

    it('returns null when no heading is present', () => {
      expect(extractFirstHeading('plain text')).toBeNull();
      expect(extractFirstHeading('')).toBeNull();
    });

    it('ignores headings inside fenced code blocks', () => {
      const md = '```\n# not a heading\n```\n\nreal body';
      expect(extractFirstHeading(md)).toBeNull();
    });

    it('handles non-string input gracefully', () => {
      expect(extractFirstHeading(null)).toBeNull();
      expect(extractFirstHeading(undefined)).toBeNull();
    });
  });

  describe('stripMarkdown', () => {
    it('strips bold and italic markers', () => {
      expect(stripMarkdown('**bold** text')).toBe('bold text');
      expect(stripMarkdown('__bold__ text')).toBe('bold text');
      expect(stripMarkdown('*em* text')).toBe('em text');
      expect(stripMarkdown('_em_ text')).toBe('em text');
    });

    it('strips inline code spans', () => {
      expect(stripMarkdown('use `foo()` here')).toBe('use foo() here');
    });

    it('removes fenced code blocks entirely', () => {
      const md = 'before\n```js\nconst x = 1;\n```\nafter';
      expect(stripMarkdown(md)).toBe('before after');
    });

    it('unwraps links to link text', () => {
      expect(stripMarkdown('see [docs](https://example.com) now')).toBe('see docs now');
    });

    it('unwraps images to alt text', () => {
      expect(stripMarkdown('![diagram](img.png) above')).toBe('diagram above');
    });

    it('strips heading markers', () => {
      expect(stripMarkdown('# Title\nbody')).toBe('Title body');
      expect(stripMarkdown('### Deep\n\nbody')).toBe('Deep body');
    });

    it('strips blockquote markers', () => {
      expect(stripMarkdown('> quoted\n> more')).toBe('quoted more');
    });

    it('strips list markers', () => {
      expect(stripMarkdown('- one\n- two\n- three')).toBe('one two three');
      expect(stripMarkdown('1. alpha\n2. beta')).toBe('alpha beta');
    });

    it('collapses runs of whitespace', () => {
      expect(stripMarkdown('a\n\n\nb')).toBe('a b');
      expect(stripMarkdown('a    b')).toBe('a b');
    });

    it('handles strikethrough', () => {
      expect(stripMarkdown('~~gone~~ here')).toBe('gone here');
    });

    it('handles empty/non-string input', () => {
      expect(stripMarkdown('')).toBe('');
      expect(stripMarkdown(null)).toBe('');
    });
  });

  describe('truncate', () => {
    it('returns the string unchanged when shorter than max', () => {
      expect(truncate('hello', 10)).toBe('hello');
    });

    it('truncates at a word boundary within the soft window', () => {
      const text = 'one two three four five six seven eight nine ten';
      const result = truncate(text, 20);
      expect(result.length).toBeLessThanOrEqual(20);
      expect(result.endsWith(' ')).toBe(false);
      // Should cut on a space, so the last character is a word char.
      expect(/[a-z]$/.test(result)).toBe(true);
    });

    it('hard-cuts when there is no space in the soft window', () => {
      const text = 'a'.repeat(50);
      expect(truncate(text, 10)).toBe('aaaaaaaaaa');
    });
  });

  describe('buildEntry', () => {
    const slug = 'oxi-one-mk2';

    it('uses a markdown heading as title when present', () => {
      const page = {
        pageNum: 11,
        title: 'Page 11',
        sectionName: null,
        content: '# 同梱物\n\n本デバイスには...',
        hasContent: true,
      };
      const entry = buildEntry(page, slug);
      expect(entry.title).toBe('同梱物');
      expect(entry.sectionName).toBe('同梱物');
    });

    it('falls back to page title and sectionName when no heading', () => {
      const page = {
        pageNum: 12,
        title: 'Page 12',
        sectionName: '1.3 Something',
        content: 'Plain body text.',
        hasContent: true,
      };
      const entry = buildEntry(page, slug);
      expect(entry.title).toBe('Page 12');
      expect(entry.sectionName).toBe('1.3 Something');
    });

    it('produces the correct URL shape (no basePath prefix)', () => {
      const page = {
        pageNum: 5,
        title: 'Page 5',
        sectionName: null,
        content: 'x',
        hasContent: true,
      };
      expect(buildEntry(page, slug).url).toBe('/oxi-one-mk2/page/5');
    });

    it('id is the pageNum as a string', () => {
      const page = {
        pageNum: 42,
        title: 'Page 42',
        sectionName: null,
        content: 'x',
        hasContent: true,
      };
      expect(buildEntry(page, slug).id).toBe('42');
    });

    it('body is markdown-stripped and truncated to ~500 chars', () => {
      const long = 'word '.repeat(300);
      const page = {
        pageNum: 7,
        title: 'Page 7',
        sectionName: null,
        content: `**bold** ${long}`,
        hasContent: true,
      };
      const entry = buildEntry(page, slug);
      expect(entry.body.length).toBeLessThanOrEqual(500);
      expect(entry.body).not.toMatch(/\*\*/);
    });
  });

  describe('buildIndex', () => {
    const slug = 'oxi-one-mk2';

    it('skips pages with hasContent=false', () => {
      const doc = {
        pages: [
          { pageNum: 1, title: 'Page 1', sectionName: null, content: 'hi', hasContent: true },
          { pageNum: 2, title: 'Page 2', sectionName: null, content: '', hasContent: false },
          { pageNum: 3, title: 'Page 3', sectionName: null, content: 'there', hasContent: true },
        ],
      };
      const index = buildIndex(doc, slug);
      expect(index).toHaveLength(2);
      expect(index.map((e) => e.pageNum)).toEqual([1, 3]);
    });

    it('throws on malformed input', () => {
      expect(() => buildIndex(null, slug)).toThrow();
      expect(() => buildIndex({ pages: 'nope' }, slug)).toThrow();
    });

    it('preserves page order from input', () => {
      const doc = {
        pages: [
          { pageNum: 10, title: 'Page 10', sectionName: null, content: 'a', hasContent: true },
          { pageNum: 3, title: 'Page 3', sectionName: null, content: 'b', hasContent: true },
        ],
      };
      expect(buildIndex(doc, slug).map((e) => e.pageNum)).toEqual([10, 3]);
    });
  });
});
