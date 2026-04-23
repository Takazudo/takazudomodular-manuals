import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SearchTrigger } from '../search-trigger';

// Polyfill native <dialog> just enough for the underlying SearchDialog to mount
// without throwing. The trigger tests don't assert dialog rendering details
// beyond presence/absence — those are covered in search-dialog.test.tsx.
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

class FakeIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

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

beforeEach(() => {
  installDialogPolyfill();
  (
    globalThis as unknown as { IntersectionObserver: typeof IntersectionObserver }
  ).IntersectionObserver = FakeIntersectionObserver as unknown as typeof IntersectionObserver;
  // Stub fetch — SearchDialog tries to fetch the index when opened. Return an
  // empty array so it resolves to a ready-but-empty index without errors.
  (globalThis as unknown as { fetch: typeof fetch }).fetch = vi.fn(async () => {
    return new Response('[]', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as unknown as typeof fetch;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/**
 * Override navigator.userAgent for the duration of a test. The default jsdom
 * userAgent is non-Mac, but we explicitly set both directions here to make
 * platform behavior assertions deterministic.
 */
function setUserAgent(ua: string) {
  Object.defineProperty(navigator, 'userAgent', {
    configurable: true,
    get: () => ua,
  });
  // Some platforms expose userAgentData; clear it so the userAgent fallback
  // path is exercised consistently.
  Object.defineProperty(navigator, 'userAgentData', {
    configurable: true,
    get: () => undefined,
  });
}

describe('SearchTrigger', () => {
  it('renders nothing when manualId is null', () => {
    const { container } = render(<SearchTrigger manualId={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders an icon button with aria-label="検索" when manualId is provided', () => {
    setUserAgent('Mozilla/5.0 (X11; Linux x86_64)');
    render(<SearchTrigger manualId="oxi-one-mk2" />);
    const button = screen.getByRole('button', { name: '検索' });
    expect(button).toBeTruthy();
    expect(button.tagName).toBe('BUTTON');
  });

  it('shows the Ctrl+K label on non-Mac platforms', () => {
    setUserAgent('Mozilla/5.0 (X11; Linux x86_64)');
    render(<SearchTrigger manualId="oxi-one-mk2" />);
    expect(screen.getByText('Ctrl+K')).toBeTruthy();
  });

  it('shows the ⌘K label on Mac platforms', () => {
    setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)',
    );
    render(<SearchTrigger manualId="oxi-one-mk2" />);
    expect(screen.getByText('⌘K')).toBeTruthy();
  });

  it('opens the dialog when the trigger button is clicked', () => {
    setUserAgent('Mozilla/5.0 (X11; Linux x86_64)');
    render(<SearchTrigger manualId="oxi-one-mk2" />);

    const dialog = screen.getByLabelText('検索', {
      selector: 'dialog',
    }) as HTMLDialogElement;
    expect(dialog.open).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: '検索' }));
    expect(dialog.open).toBe(true);
  });

  it('toggles the dialog with Ctrl+K on non-Mac platforms', () => {
    setUserAgent('Mozilla/5.0 (X11; Linux x86_64)');
    render(<SearchTrigger manualId="oxi-one-mk2" />);

    const dialog = screen.getByLabelText('検索', {
      selector: 'dialog',
    }) as HTMLDialogElement;
    expect(dialog.open).toBe(false);

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(dialog.open).toBe(true);

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(dialog.open).toBe(false);
  });

  it('toggles the dialog with Cmd+K (metaKey) on Mac platforms', () => {
    setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)',
    );
    render(<SearchTrigger manualId="oxi-one-mk2" />);

    const dialog = screen.getByLabelText('検索', {
      selector: 'dialog',
    }) as HTMLDialogElement;
    expect(dialog.open).toBe(false);

    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(dialog.open).toBe(true);
  });

  it('does not respond to plain "k" without modifier', () => {
    setUserAgent('Mozilla/5.0 (X11; Linux x86_64)');
    render(<SearchTrigger manualId="oxi-one-mk2" />);

    const dialog = screen.getByLabelText('検索', {
      selector: 'dialog',
    }) as HTMLDialogElement;
    fireEvent.keyDown(window, { key: 'k' });
    expect(dialog.open).toBe(false);
  });

  it('does not register a keyboard listener when manualId is null', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    render(<SearchTrigger manualId={null} />);
    const keydownAdds = addSpy.mock.calls.filter((call) => call[0] === 'keydown');
    expect(keydownAdds.length).toBe(0);
  });
});
