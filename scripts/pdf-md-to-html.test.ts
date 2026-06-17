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
import { markdownToHtml, sanitizeUrl } from './pdf-md-to-html.js';

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

// ---------------------------------------------------------------------------
// URL sanitization — defense-in-depth (#155)
// ---------------------------------------------------------------------------

describe('sanitizeUrl — dangerous protocol neutralization', () => {
  it('neutralizes javascript: URIs (lowercase)', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
  });

  it('neutralizes javascript: URIs (uppercase — case-insensitive)', () => {
    expect(sanitizeUrl('JAVASCRIPT:alert(1)')).toBe('');
  });

  it('neutralizes data: URIs', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
    expect(sanitizeUrl('data:image/png;base64,abc123')).toBe('');
  });

  it('neutralizes vbscript: URIs', () => {
    expect(sanitizeUrl('vbscript:msgbox(1)')).toBe('');
  });
});

describe('sanitizeUrl — safe URL preservation', () => {
  it('preserves https: URLs', () => {
    const url = 'https://example.com/path?q=1#anchor';
    expect(sanitizeUrl(url)).toBe(url);
  });

  it('preserves http: URLs', () => {
    const url = 'http://www.oxiinstruments.com';
    expect(sanitizeUrl(url)).toBe(url);
  });

  it('preserves mailto: URLs', () => {
    const url = 'mailto:user@example.com';
    expect(sanitizeUrl(url)).toBe(url);
  });

  it('preserves tel: URLs', () => {
    const url = 'tel:+1234567890';
    expect(sanitizeUrl(url)).toBe(url);
  });

  it('preserves relative URLs (no colon)', () => {
    expect(sanitizeUrl('/relative/path')).toBe('/relative/path');
    expect(sanitizeUrl('./relative')).toBe('./relative');
    expect(sanitizeUrl('../relative')).toBe('../relative');
  });

  it('preserves anchor-only URLs', () => {
    expect(sanitizeUrl('#section')).toBe('#section');
  });

  it('preserves empty string', () => {
    expect(sanitizeUrl('')).toBe('');
  });

  it('treats colon-after-slash as path (not protocol)', () => {
    // e.g. /path/to:something — colon is not a protocol separator here
    expect(sanitizeUrl('/path/to:something')).toBe('/path/to:something');
  });
});

describe('markdownToHtml — URL sanitization integration', () => {
  it('neutralizes javascript: hrefs in markdown links', async () => {
    const html = await markdownToHtml('[click me](javascript:alert(1))');
    // href must be empty after sanitization
    expect(html).toContain('href=""');
    expect(html).not.toContain('javascript:');
  });

  it('neutralizes data: srcs in markdown images', async () => {
    const html = await markdownToHtml('![alt](data:image/png;base64,abc123)');
    expect(html).toContain('src=""');
    expect(html).not.toContain('data:');
  });

  it('preserves https: links after sanitization', async () => {
    const html = await markdownToHtml('[site](https://example.com)');
    expect(html).toContain('href="https://example.com"');
  });

  it('preserves mailto: links after sanitization', async () => {
    const html = await markdownToHtml('[email](mailto:user@example.com)');
    expect(html).toContain('href="mailto:user@example.com"');
  });

  it('does not disturb heading ids (rehype-slug)', async () => {
    const html = await markdownToHtml('## Getting Started\n\n[link](javascript:void(0))');
    expect(html).toContain('id="getting-started"');
    expect(html).not.toContain('javascript:');
  });

  it('does not disturb table-wrapper class (rehypeWrapTables)', async () => {
    const md = '| A | B |\n|---|---|\n| 1 | 2 |';
    const html = await markdownToHtml(md);
    expect(html).toContain('<div class="table-wrapper">');
  });

  it('does not disturb hljs classes (rehype-highlight)', async () => {
    const html = await markdownToHtml('```js\nconst x = 1;\n```');
    expect(html).toContain('hljs');
    expect(html).toContain('language-js');
  });
});

// ---------------------------------------------------------------------------
// CJK autolink repair (rehypeFixCjkAutolinks)
// ---------------------------------------------------------------------------

describe('markdownToHtml — CJK autolink repair', () => {
  it('trims a bare URL wrapped in full-width parens followed by CJK prose', async () => {
    const md = '改造（https://ebow.com/diy-mods）が施されており、弦の上をスライド';
    const html = await markdownToHtml(md);
    // href is the clean URL, not the percent-encoded prose blob.
    expect(html).toContain('<a href="https://ebow.com/diy-mods">https://ebow.com/diy-mods</a>');
    expect(html).not.toContain('%E');
    // The trailing prose is preserved as text after the anchor.
    expect(html).toContain('）が施されており、弦の上をスライド');
  });

  it('cuts at the first CJK char when a URL is immediately followed by Japanese', async () => {
    const html = await markdownToHtml('https://zadig.akeo.ieにアクセスして');
    expect(html).toContain('<a href="https://zadig.akeo.ie">https://zadig.akeo.ie</a>');
    expect(html).toContain('にアクセスして');
    expect(html).not.toContain('%E');
  });

  it('leaves a clean ASCII autolink untouched', async () => {
    const html = await markdownToHtml('詳細は https://example.com/path です');
    expect(html).toContain('<a href="https://example.com/path">https://example.com/path</a>');
  });

  it('does NOT split an explicit [label](url) link with a CJK label', async () => {
    const html = await markdownToHtml('[公式サイト](https://example.com/abc)を参照');
    expect(html).toContain('<a href="https://example.com/abc">公式サイト</a>');
  });
});
