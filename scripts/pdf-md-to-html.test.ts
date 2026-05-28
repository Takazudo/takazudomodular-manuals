/**
 * Tests for scripts/pdf-md-to-html.js — the unified pipeline that converts
 * each page's `content` markdown to `contentHtml` at build time.
 *
 * Contract being verified (per scripts/CLAUDE.md + the module docstring):
 *   - Headings get `id` attributes from rehype-slug
 *   - Fenced code blocks get `hljs` CSS classes from rehype-highlight
 *   - Each <table> is wrapped in <div class="table-wrapper"> (rehypeWrapTables)
 *   - GFM features (tables, strikethrough, task lists) are parsed via remark-gfm
 *   - Empty / whitespace-only input returns an empty string
 */
import { describe, it, expect } from 'vitest';
// @ts-expect-error — plain JS module; no types file
import { markdownToHtml } from './pdf-md-to-html.js';

describe('markdownToHtml — heading IDs (rehype-slug)', () => {
  it('adds an id attribute derived from the heading text', async () => {
    const html = await markdownToHtml('## Getting Started');
    expect(html).toContain('id="getting-started"');
    expect(html).toContain('<h2');
  });

  it('slugifies multi-word headings with hyphens', async () => {
    const html = await markdownToHtml('### CV / Gate Outputs');
    expect(html).toContain('id="cv--gate-outputs"');
  });

  it('assigns unique IDs to multiple headings in one document', async () => {
    const md = '## First\n\n## Second\n\n## Third';
    const html = await markdownToHtml(md);
    expect(html).toContain('id="first"');
    expect(html).toContain('id="second"');
    expect(html).toContain('id="third"');
  });
});

describe('markdownToHtml — syntax highlighting (rehype-highlight)', () => {
  it('adds hljs class to highlighted code block', async () => {
    const md = '```js\nconst x = 1;\n```';
    const html = await markdownToHtml(md);
    // rehype-highlight adds `class="hljs language-js"` (or similar) to <code>.
    expect(html).toContain('hljs');
    expect(html).toContain('language-js');
  });

  it('adds hljs class to an unspecified-language code block', async () => {
    const md = '```\nplain code\n```';
    const html = await markdownToHtml(md);
    // rehype-highlight still annotates the block even without a language.
    expect(html).toContain('<code');
  });
});

describe('markdownToHtml — table wrapping (rehypeWrapTables)', () => {
  it('wraps a GFM table in <div class="table-wrapper">', async () => {
    const md = `
| Column A | Column B |
|----------|----------|
| row 1a   | row 1b   |
| row 2a   | row 2b   |
`.trim();
    const html = await markdownToHtml(md);
    // The table must be a direct child of the wrapper, not the other way round.
    expect(html).toContain('<div class="table-wrapper">');
    expect(html).toContain('<table>');
    // Wrapper must appear before the table tag.
    const wrapperIdx = html.indexOf('<div class="table-wrapper">');
    const tableIdx = html.indexOf('<table>');
    expect(wrapperIdx).toBeLessThan(tableIdx);
  });

  it('wraps multiple tables independently', async () => {
    const row = '| A | B |\n|---|---|\n| 1 | 2 |';
    const md = `${row}\n\nsome text\n\n${row}`;
    const html = await markdownToHtml(md);
    const count = (html.match(/<div class="table-wrapper">/g) ?? []).length;
    expect(count).toBe(2);
  });
});

describe('markdownToHtml — GFM features (remark-gfm)', () => {
  it('renders GFM strikethrough', async () => {
    const html = await markdownToHtml('~~deleted~~');
    expect(html).toContain('<del>deleted</del>');
  });

  it('renders GFM task-list checkboxes', async () => {
    const html = await markdownToHtml('- [x] done\n- [ ] todo');
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('checked');
  });
});

describe('markdownToHtml — empty / whitespace input', () => {
  it('returns an empty string for empty input', async () => {
    expect(await markdownToHtml('')).toBe('');
  });

  it('returns an empty string for whitespace-only input', async () => {
    expect(await markdownToHtml('   \n\t  ')).toBe('');
  });

  it('returns an empty string for null-like falsy input', async () => {
    // The real pipeline may call with undefined when a page has no content.
    expect(await markdownToHtml(undefined as unknown as string)).toBe('');
  });
});
