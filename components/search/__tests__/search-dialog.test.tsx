import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SearchDialog, __clearSearchIndexCacheForTests } from '../search-dialog';
import { highlightTerms, makeExcerpt } from '../highlight';

// jsdom does not implement the native <dialog> element. Polyfill just enough
// surface (`showModal`, `close`, the `open` property, the `close` event) so
// the dialog behaves as a closable modal during tests.
function installDialogPolyfill() {
  const proto = HTMLDialogElement.prototype;

  proto.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
    (this as unknown as { open: boolean }).open = true;
  };

  proto.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
    (this as unknown as { open: boolean }).open = false;
    this.dispatchEvent(new Event('close'));
  };
}

// IntersectionObserver is not available in jsdom. Stub it.
class FakeIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

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

beforeEach(() => {
  __clearSearchIndexCacheForTests();
  installDialogPolyfill();
  (
    globalThis as unknown as { IntersectionObserver: typeof IntersectionObserver }
  ).IntersectionObserver = FakeIntersectionObserver as unknown as typeof IntersectionObserver;
  // Fetch returns the hand-made fixture index.
  (globalThis as unknown as { fetch: typeof fetch }).fetch = vi.fn(async () => {
    return new Response(JSON.stringify(fixtureDocs), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as unknown as typeof fetch;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Mock next/navigation so useRouter returns a stub router.
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe('SearchDialog', () => {
  it('renders a native <dialog> element with the expected aria-label', () => {
    render(<SearchDialog manualId="oxi-one-mk2" open={false} onClose={() => {}} />);
    const dialog = screen.getByLabelText('検索') as HTMLDialogElement;
    expect(dialog.tagName).toBe('DIALOG');
  });

  it('fetches the index from withBasePath-prefixed URL when opened', async () => {
    const fetchSpy = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    const { rerender } = render(
      <SearchDialog manualId="oxi-one-mk2" open={false} onClose={() => {}} />,
    );

    rerender(<SearchDialog manualId="oxi-one-mk2" open={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });
    const call = fetchSpy.mock.calls[0];
    expect(call[0]).toBe('/manuals/oxi-one-mk2/data/search-index.json');
  });

  it('filters results based on the typed query and highlights the match', async () => {
    const fetchSpy = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    render(<SearchDialog manualId="oxi-one-mk2" open={true} onClose={() => {}} />);

    // Wait for the fetch + index load to complete (idle → loading → ready).
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.queryByText('検索インデックスを読み込み中...')).toBeNull();
    });

    const input = screen.getByPlaceholderText('検索キーワードを入力...') as HTMLInputElement;

    await act(async () => {
      fireEvent.change(input, { target: { value: 'sequencer' } });
    });

    // Wait for the debounced search + render to produce a result row for the
    // Sequencer doc (pageNum 10).
    await waitFor(
      () => {
        expect(screen.queryByLabelText('ページ 10')).not.toBeNull();
      },
      { timeout: 2000 },
    );
    // The CV doc (pageNum 77) should not match "sequencer".
    expect(screen.queryByLabelText('ページ 77')).toBeNull();

    // At least one <mark> element should wrap the matched term.
    const marks = document.querySelectorAll('[data-search-dialog] mark');
    expect(marks.length).toBeGreaterThan(0);
  });

  it('shows the error state when the fetch fails', async () => {
    (globalThis as unknown as { fetch: typeof fetch }).fetch = vi.fn(async () => {
      return new Response('not found', { status: 404 });
    }) as unknown as typeof fetch;
    // The component logs the failure via console.error; silence it here so
    // the test output stays clean while still asserting the UI state.
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<SearchDialog manualId="oxi-one-mk2" open={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('検索インデックスを読み込めませんでした')).toBeTruthy();
    });
    expect(screen.getByRole('button', { name: '再試行' })).toBeTruthy();
    errSpy.mockRestore();
  });
});

describe('highlight helpers', () => {
  it('highlightTerms wraps matched tokens case-insensitively', () => {
    const nodes = highlightTerms('Hello World', 'world');
    // Expect at least one node to be a React element with type "mark".
    const hasMark = nodes.some((n) => {
      if (typeof n !== 'object' || n === null) return false;
      return (n as { type?: unknown }).type === 'mark';
    });
    expect(hasMark).toBe(true);
  });

  it('highlightTerms returns the original text when query is empty', () => {
    expect(highlightTerms('Hello', '')).toEqual(['Hello']);
  });

  it('makeExcerpt centers around the first match and adds ellipses', () => {
    const body = `${'A '.repeat(50)}target ${'B '.repeat(50)}`;
    const excerpt = makeExcerpt(body, 'target', 40);
    expect(excerpt.length).toBeLessThanOrEqual(42); // +2 for possible ellipses
    expect(excerpt).toContain('target');
    expect(excerpt.startsWith('…')).toBe(true);
    expect(excerpt.endsWith('…')).toBe(true);
  });

  it('makeExcerpt returns the whole body when it is short enough', () => {
    expect(makeExcerpt('short body', 'anything', 160)).toBe('short body');
  });
});
