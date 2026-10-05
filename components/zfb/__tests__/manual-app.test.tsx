import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createIslandTest } from '@takazudo/zfb/zudo-react/testing';
import ManualApp from '../manual-app';
import type { ManualAppProps } from '../manual-app-types';

const initialPage = {
  pageNum: 1,
  title: 'First page',
  image: '/test/pages/page-001.png',
  content: 'Initial translation',
  contentHtml: '<p>Initial translation</p>',
  hasContent: true,
  sectionName: null,
};
const props: ManualAppProps = {
  manualId: 'test',
  initialPageNum: 1,
  initialPage,
  totalPages: 2,
  availableLangs: ['ja', 'en'],
  manifest: { title: 'Manual', brand: 'Test' },
};
const active: ReturnType<typeof createIslandTest>[] = [];
const response = (ok = true) => ({
  ok,
  status: ok ? 200 : 503,
  json: async () => ({
    pages: [initialPage, { ...initialPage, pageNum: 2, title: 'Second page' }],
  }),
});
function setup() {
  const test = createIslandTest(ManualApp, { ...props }, { document });
  active.push(test);
  expect(test.hydrate()).not.toBeNull();
  return test;
}
beforeEach(() => {
  window.history.replaceState(null, '', '/test/page/1');
  window.localStorage.clear();
});
afterEach(() => {
  for (const test of active.splice(0)) test.dispose();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe('ManualApp owned SSR transport', () => {
  it('adopts the SSR shell while data is pending and cancels both requests on disposal', async () => {
    const signals: AbortSignal[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, options: RequestInit) => {
        signals.push(options.signal as AbortSignal);
        return new Promise(() => {});
      }),
    );
    const test = createIslandTest(ManualApp, { ...props }, { document });
    active.push(test);
    const shell = test.host.querySelector('[data-testid="viewer-shell-ssr"]');
    expect(shell?.textContent).toContain('Initial translation');
    expect(test.hydrate()).not.toBeNull();
    await test.flush();
    expect(test.host.querySelector('[data-testid="viewer-shell-ssr"]')).toBe(shell);
    expect(test.host.querySelector('[data-testid="page-selector"]')).toBeNull();
    expect(signals).toHaveLength(2);
    test.dispose();
    expect(signals.every((signal) => signal.aborted)).toBe(true);
    expect(test.diagnostics).toEqual([]);
  });

  it('keeps the SSR body on required JA failure, then retries into a live viewer', async () => {
    let fail = true;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => response(!(fail && url.endsWith('pages-ja.json')))),
    );
    const test = setup();
    await vi.waitFor(async () => {
      await test.flush();
      expect(test.host.querySelector('[data-testid="manual-app-fetch-error"]')).not.toBeNull();
    });
    expect(test.host.querySelector('[data-testid="viewer-shell-ssr"]')?.textContent).toContain(
      'Initial translation',
    );
    fail = false;
    test.host
      .querySelector<HTMLButtonElement>('[data-testid="manual-app-fetch-error"] button')
      ?.click();
    await vi.waitFor(async () => {
      await test.flush();
      expect(
        test.host.querySelector<HTMLSelectElement>('[data-testid="page-selector"]')?.disabled,
      ).toBe(false);
    });
    expect(test.host.querySelector('[data-testid="viewer-shell-ssr"]')).toBeNull();
    expect(test.diagnostics).toEqual([]);
  });

  it('keeps JA navigation live when optional EN fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => response(!url.endsWith('pages-en.json'))),
    );
    const test = setup();
    await vi.waitFor(async () => {
      await test.flush();
      expect(
        test.host.querySelector<HTMLSelectElement>('[data-testid="page-selector"]')?.disabled,
      ).toBe(false);
    });
    const select = test.host.querySelector<HTMLSelectElement>('[data-testid="page-selector"]')!;
    select.value = '2';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await test.flush();
    expect(window.location.pathname).toBe('/test/page/2');
    expect(test.host.querySelector('[data-testid="translation-panel"]')?.getAttribute('lang')).toBe(
      'ja',
    );
    expect(test.diagnostics).toEqual([]);
  });
});
