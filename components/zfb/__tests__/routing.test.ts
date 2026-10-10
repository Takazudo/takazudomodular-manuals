import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.doUnmock('@/lib/base-path');
  vi.resetModules();
});

describe.each(['/', '/manuals/'])('runtime URLs at base %s', (base) => {
  it('prefixes fetched assets and page links exactly once', async () => {
    vi.doMock('@/lib/base-path', () => ({ ZFB_BASE: base }));
    const { withBasePath, getManualBasePath, getPagePath } = await import('../routing');
    const prefix = base.replace(/\/$/, '');
    expect(withBasePath('/oxi-coral/data/pages-ja.json')).toBe(
      `${prefix}/oxi-coral/data/pages-ja.json`,
    );
    expect(withBasePath(`${prefix}/oxi-coral/pages/page-001.png`)).toBe(
      `${prefix}/oxi-coral/pages/page-001.png`,
    );
    expect(withBasePath('oxi-coral/thumbs/thumb-001.png')).toBe(
      `${prefix}/oxi-coral/thumbs/thumb-001.png`,
    );
    expect(withBasePath('https://example.com/image.png')).toBe('https://example.com/image.png');
    expect(getManualBasePath('oxi-coral')).toBe(`${prefix}/oxi-coral`);
    expect(getPagePath('oxi-coral', 5)).toBe(`${prefix}/oxi-coral/page/5`);
  });
});
