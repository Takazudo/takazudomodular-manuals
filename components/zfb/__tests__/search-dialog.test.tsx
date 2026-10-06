import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { signal } from '@takazudo/zfb/zudo-react';
import { createIslandTest } from '@takazudo/zfb/zudo-react/testing';
import { SearchDialog, __clearSearchIndexCacheForTests } from '@/components/zfb/search-dialog';
import { highlightTerms, makeExcerpt } from '@/components/zfb/search-highlight';

const fixtureDocs = [
  {
    id: 'doc-1',
    pageNum: 10,
    title: 'Sequencer basics',
    sectionName: 'Getting started',
    body: 'The sequencer lets you program patterns step by step with pitch and velocity.',
  },
  {
    id: 'doc-2',
    pageNum: 42,
    title: 'MIDI routing',
    sectionName: 'Setup',
    body: 'Route MIDI between tracks to control external gear or internal voices.',
  },
  {
    id: 'doc-3',
    pageNum: 77,
    title: 'CV outputs',
    sectionName: 'Modular',
    body: 'Send control voltage to modular synths; each output is configurable.',
  },
];
const active: Array<ReturnType<typeof createIslandTest>> = [];
let intersection: IntersectionObserverCallback;
const disconnect = vi.fn();
beforeEach(() => {
  __clearSearchIndexCacheForTests();
  disconnect.mockClear();
  vi.spyOn(HTMLDialogElement.prototype, 'showModal').mockImplementation(function (
    this: HTMLDialogElement,
  ) {
    this.open = true;
  });
  vi.spyOn(HTMLDialogElement.prototype, 'close').mockImplementation(function (
    this: HTMLDialogElement,
  ) {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  });
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: IntersectionObserverCallback) {
        intersection = callback;
      }
      observe() {}
      disconnect = disconnect;
    },
  );
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(fixtureDocs), { status: 200 })),
  );
});
afterEach(() => {
  for (const test of active) test.dispose();
  active.length = 0;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
async function renderDialog(
  initialOpen = true,
  searchIndexVersion?: string,
  beforeHydrate?: (input: HTMLInputElement) => void,
) {
  const open = signal(initialOpen);
  const onClose = vi.fn(() => {
    open.value = false;
  });
  const onNavigate = vi.fn();
  function TestDialog() {
    return (
      <SearchDialog
        manualId="oxi-one-mk2"
        searchIndexVersion={searchIndexVersion}
        open={open}
        onClose={onClose}
        onNavigate={onNavigate}
      />
    );
  }
  const test = createIslandTest(TestDialog, {}, { document });
  active.push(test);
  const before = test.host.querySelector('dialog');
  beforeHydrate?.(test.host.querySelector<HTMLInputElement>('input')!);
  expect(test.hydrate()).not.toBeNull();
  await test.flush();
  expect(test.host.querySelector('dialog')).toBe(before);
  expect(test.diagnostics).toEqual([]);
  const input = test.host.querySelector<HTMLInputElement>('input')!;
  const dialog = test.host.querySelector('dialog')!;
  return { test, open, onClose, onNavigate, input, dialog };
}
function type(input: HTMLInputElement, value: string) {
  input.value = value;
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
}
async function settleSearch(
  test: ReturnType<typeof createIslandTest>,
  input: HTMLInputElement,
  value: string,
) {
  type(input, value);
  await vi.waitFor(
    async () => {
      await test.flush();
      expect(test.host.querySelector('[aria-live]')?.textContent).toMatch(/件の結果|該当なし/);
    },
    { timeout: 2000 },
  );
}
describe('SearchDialog', () => {
  it('hydrates a native accessible dialog without fetching while closed', async () => {
    const { dialog } = await renderDialog(false);
    expect(dialog.getAttribute('aria-label')).toBe('検索');
    expect(dialog.open).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('fetches a version-busted withBasePath URL on first open and caches subsequent opens', async () => {
    const { test, open } = await renderDialog(false, '0123456789abcdef0123456789abcdef01234567');
    open.value = true;
    await test.flush();
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(vi.mocked(fetch).mock.calls[0][0]).toMatch(
      /^\/oxi-one-mk2\/data\/search-index\.json\?v=[0-9a-f]{40}$/,
    );
    open.value = false;
    await test.flush();
    open.value = true;
    await test.flush();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('fetches an unversioned URL when the manifest has no hash', async () => {
    await renderDialog();
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe('/oxi-one-mk2/data/search-index.json');
  });
  it('filters and highlights a settled query, then updates highlights for another query', async () => {
    const { test, input } = await renderDialog();
    await settleSearch(test, input, 'sequencer');
    expect(test.host.querySelector('[aria-label="ページ 10"]')).not.toBeNull();
    expect(test.host.querySelector('[aria-label="ページ 77"]')).toBeNull();
    expect(test.host.querySelector('mark')?.textContent?.toLowerCase()).toBe('sequencer');
    type(input, 'MIDI');
    await vi.waitFor(async () => {
      await test.flush();
      expect(test.host.querySelector('[aria-label="ページ 42"]')).not.toBeNull();
    });
    expect(test.host.querySelector('[aria-label="ページ 10"]')).toBeNull();
    expect(test.host.querySelector('mark')?.textContent).toBe('MIDI');
  });
  it('reports fetch failure and retries successfully', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('not found', { status: 404 }));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { test } = await renderDialog();
    await vi.waitFor(async () => {
      await test.flush();
      expect(test.host.textContent).toContain('検索インデックスを読み込めませんでした');
    });
    const retry = Array.from(test.host.querySelectorAll('button')).find(
      (button) => button.textContent === '再試行',
    )!;
    expect(retry).toBeTruthy();
    retry.click();
    await vi.waitFor(async () => {
      await test.flush();
      expect(test.host.textContent).not.toContain('検索インデックスを読み込めませんでした');
    });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(error).toHaveBeenCalledTimes(1);
  });
  it('navigates and closes on click and keyboard activation', async () => {
    const { test, input, onNavigate, onClose } = await renderDialog();
    await settleSearch(test, input, 'sequencer');
    const result = test.host.querySelector('[aria-label="ページ 10"]')!.closest('button')!;
    result.click();
    expect(onNavigate).toHaveBeenCalledWith(10);
    expect(onClose).toHaveBeenCalled();
    onNavigate.mockClear();
    result.dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }),
    );
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith(10);
  });
  it('bridges native dialog close to owner state', async () => {
    const { test, dialog, open, onClose } = await renderDialog();
    dialog.close();
    await test.flush();
    expect(open.value).toBe(false);
    expect(onClose).toHaveBeenCalledOnce();
  });
  it('preserves an edit made before hydration and searches that live input', async () => {
    const { test, input } = await renderDialog(true, undefined, (field) => {
      field.value = 'sequencer';
    });
    expect(input.value).toBe('sequencer');
    await vi.waitFor(async () => {
      await test.flush();
      expect(test.host.querySelector('[aria-label="ページ 10"]')).not.toBeNull();
    });
    expect(test.diagnostics).toEqual([]);
  });
  it('preserves composing text and searches the final committed edit', async () => {
    const { test, input } = await renderDialog();
    input.focus();
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.value = 'シー';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    await test.flush();
    expect(input.value).toBe('シー');
    input.value = 'sequencer';
    input.dispatchEvent(
      new CompositionEvent('compositionend', { bubbles: true, data: 'sequencer' }),
    );
    await vi.waitFor(
      async () => {
        await test.flush();
        expect(test.host.querySelector('[aria-label="ページ 10"]')).not.toBeNull();
      },
      { timeout: 2000 },
    );
    expect(input.value).toBe('sequencer');
  });
  it('aborts an in-flight request and disconnects observers on disposal', async () => {
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {}));
    const { test } = await renderDialog();
    const signal = vi.mocked(fetch).mock.calls[0][1]?.signal;
    expect(signal?.aborted).toBe(false);
    test.dispose();
    expect(signal?.aborted).toBe(true);
    expect(disconnect).toHaveBeenCalledOnce();
  });
  it('reuses the index across remounts but fetches again for a new content version', async () => {
    const first = await renderDialog(true, 'version-a');
    await settleSearch(first.test, first.input, 'sequencer');
    first.test.dispose();
    const second = await renderDialog(true, 'version-a');
    await settleSearch(second.test, second.input, 'MIDI');
    expect(second.test.host.querySelector('[aria-label="ページ 42"]')).not.toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
    second.test.dispose();
    const third = await renderDialog(true, 'version-b');
    await settleSearch(third.test, third.input, 'sequencer');
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(vi.mocked(fetch).mock.calls[1][0]).toBe(
      '/oxi-one-mk2/data/search-index.json?v=version-b',
    );
  });
  it('keeps the query and cached index when closed and reopened', async () => {
    const { test, input, open, dialog } = await renderDialog();
    await settleSearch(test, input, 'sequencer');
    dialog.close();
    await test.flush();
    open.value = true;
    await test.flush();
    expect(input.value).toBe('sequencer');
    expect(test.host.querySelector('[aria-label="ページ 10"]')).not.toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('loads every batch for successive queries while the sentinel remains in view', async () => {
    // Native observers report an initial intersection after each observe(),
    // even when the target never crosses the margin between query changes.
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        private active = true;
        constructor(private callback: IntersectionObserverCallback) {}
        observe() {
          queueMicrotask(() => {
            if (this.active)
              this.callback(
                [{ isIntersecting: true } as IntersectionObserverEntry],
                this as unknown as IntersectionObserver,
              );
          });
        }
        disconnect() {
          this.active = false;
        }
      },
    );
    const docs = ['sequencer', 'routing'].flatMap((title, group) =>
      Array.from({ length: 23 }, (_, index) => ({
        id: `${title}-${index}`,
        pageNum: group * 100 + index + 1,
        title,
        sectionName: '',
        body: title,
      })),
    );
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(docs), { status: 200 }));
    const { test, input } = await renderDialog();
    type(input, 'sequencer');
    await vi.waitFor(async () => {
      await test.flush();
      expect(test.host.querySelectorAll('[aria-label^="ページ "]')).toHaveLength(23);
      expect(test.host.querySelector('[aria-label="ページ 23"]')).not.toBeNull();
    });
    type(input, 'routing');
    await vi.waitFor(async () => {
      await test.flush();
      expect(test.host.querySelectorAll('[aria-label^="ページ "]')).toHaveLength(23);
      expect(test.host.querySelector('[aria-label="ページ 123"]')).not.toBeNull();
      expect(test.host.querySelector('[aria-label="ページ 23"]')).toBeNull();
    });
  });
  it('appends another batch of results when the sentinel enters the viewport', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify(
          Array.from({ length: 23 }, (_, index) => ({
            ...fixtureDocs[0],
            id: `doc-${index}`,
            pageNum: index + 1,
          })),
        ),
        { status: 200 },
      ),
    );
    const { test, input } = await renderDialog();
    await settleSearch(test, input, 'sequencer');
    expect(test.host.querySelectorAll('[aria-label^="ページ "]')).toHaveLength(10);
    intersection(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    await test.flush();
    expect(test.host.querySelectorAll('[aria-label^="ページ "]')).toHaveLength(20);
  });
});
describe('highlight helpers', () => {
  it('wraps case-insensitive matches in mark descriptions', () => {
    expect(
      highlightTerms('Hello World', 'world').some(
        (node) =>
          typeof node === 'object' && node !== null && 'type' in node && node.type === 'mark',
      ),
    ).toBe(true);
  });
  it('returns the text unchanged for an empty query', () => {
    expect(highlightTerms('Hello', '')).toEqual(['Hello']);
  });
  it('centers the excerpt on a match', () => {
    const excerpt = makeExcerpt(`${'A '.repeat(50)}target ${'B '.repeat(50)}`, 'target', 40);
    expect(excerpt.length).toBeLessThanOrEqual(42);
    expect(excerpt).toContain('target');
    expect(excerpt.startsWith('…')).toBe(true);
    expect(excerpt.endsWith('…')).toBe(true);
  });
  it('keeps short bodies intact', () => {
    expect(makeExcerpt('short body', 'anything', 160)).toBe('short body');
  });
});
