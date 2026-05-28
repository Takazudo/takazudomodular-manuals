/**
 * Tests for components/language/language-context.tsx (original React/Next
 * component). No zfb equivalent exists — the mega-island owns lang state
 * internally. This file is kept on the original until #137 deletes both the
 * original component and this test.
 *
 * The import resolves through preact/compat (alias in vitest.config.ts) so no
 * actual React 19 runtime ships into the test environment.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { renderToString } from 'react-dom/server';
import {
  LANG_QUERY_PARAM,
  LANG_STORAGE_KEY,
  LanguageProvider,
  useLanguage,
} from '../language-context';

/**
 * Minimal consumer that exposes `lang` via DOM text and provides two buttons
 * for exercising `setLang('en')` and `setLang('ja')` under fireEvent.
 */
function LangConsumer() {
  const { lang, setLang } = useLanguage();
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <button type="button" data-testid="to-en" onClick={() => setLang('en')}>
        en
      </button>
      <button type="button" data-testid="to-ja" onClick={() => setLang('ja')}>
        ja
      </button>
    </div>
  );
}

/** Replace the current URL via history.replaceState — does not navigate. */
function setUrl(search: string) {
  window.history.replaceState(null, '', `/${search}`);
}

beforeEach(() => {
  setUrl('');
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  setUrl('');
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('useLanguage()', () => {
  it('throws when used outside a LanguageProvider', () => {
    // React logs the thrown error from the render phase; silence it so the
    // test output stays clean.
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<LangConsumer />)).toThrow(/LanguageProvider/);
    errSpy.mockRestore();
  });
});

describe('LanguageProvider — hydration safety', () => {
  it('first render emits "ja" regardless of URL or localStorage', () => {
    // Populate both URL and storage with "en" — SSR output must still be "ja"
    // so the hydrating client (which also starts from "ja") matches.
    setUrl('?lang=en');
    window.localStorage.setItem(LANG_STORAGE_KEY, 'en');

    const html = renderToString(
      <LanguageProvider>
        <LangConsumer />
      </LanguageProvider>,
    );

    // The consumer's lang span is the only element we care about here — the
    // button labels below it legitimately contain "en" / "ja" text and are
    // not part of the hydration-sensitive payload.
    expect(html).toMatch(/<span[^>]*data-testid="lang"[^>]*>ja<\/span>/);
    expect(html).not.toMatch(/<span[^>]*data-testid="lang"[^>]*>en<\/span>/);
  });
});

describe('LanguageProvider — post-mount resolution', () => {
  it('uses ?lang=en from the URL, ignoring localStorage', () => {
    setUrl('?lang=en');
    window.localStorage.setItem(LANG_STORAGE_KEY, 'ja');

    render(
      <LanguageProvider>
        <LangConsumer />
      </LanguageProvider>,
    );

    // Testing Library flushes mount effects synchronously under jsdom, so the
    // post-effect lang is observable immediately after render().
    expect(screen.getByTestId('lang').textContent).toBe('en');
  });

  it('uses localStorage "en" when the URL has no lang param', () => {
    setUrl('');
    window.localStorage.setItem(LANG_STORAGE_KEY, 'en');

    render(
      <LanguageProvider>
        <LangConsumer />
      </LanguageProvider>,
    );

    expect(screen.getByTestId('lang').textContent).toBe('en');
  });

  it('falls back to "ja" when neither URL nor localStorage has a value', () => {
    render(
      <LanguageProvider>
        <LangConsumer />
      </LanguageProvider>,
    );

    expect(screen.getByTestId('lang').textContent).toBe('ja');
  });

  it('ignores invalid lang values from URL and localStorage and falls back to "ja"', () => {
    setUrl('?lang=fr');
    window.localStorage.setItem(LANG_STORAGE_KEY, 'de');

    render(
      <LanguageProvider>
        <LangConsumer />
      </LanguageProvider>,
    );

    expect(screen.getByTestId('lang').textContent).toBe('ja');
  });
});

describe('LanguageProvider — setLang', () => {
  it('setLang("en") writes localStorage and syncs the URL to ?lang=en', () => {
    render(
      <LanguageProvider>
        <LangConsumer />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByTestId('to-en'));

    expect(screen.getByTestId('lang').textContent).toBe('en');
    expect(window.localStorage.getItem(LANG_STORAGE_KEY)).toBe('en');

    const params = new URLSearchParams(window.location.search);
    expect(params.get(LANG_QUERY_PARAM)).toBe('en');
  });

  it('setLang("ja") removes the lang query param (ja is the default)', () => {
    setUrl('?lang=en');

    render(
      <LanguageProvider>
        <LangConsumer />
      </LanguageProvider>,
    );
    // Sanity check: after mount we should be on "en" via URL resolution.
    expect(screen.getByTestId('lang').textContent).toBe('en');

    fireEvent.click(screen.getByTestId('to-ja'));

    expect(screen.getByTestId('lang').textContent).toBe('ja');
    expect(window.localStorage.getItem(LANG_STORAGE_KEY)).toBe('ja');

    const params = new URLSearchParams(window.location.search);
    expect(params.has(LANG_QUERY_PARAM)).toBe(false);
  });

  it('setLang does not clobber unrelated query params when syncing the URL', () => {
    setUrl('?other=keep');

    render(
      <LanguageProvider>
        <LangConsumer />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByTestId('to-en'));

    const paramsEn = new URLSearchParams(window.location.search);
    expect(paramsEn.get('other')).toBe('keep');
    expect(paramsEn.get(LANG_QUERY_PARAM)).toBe('en');

    fireEvent.click(screen.getByTestId('to-ja'));

    const paramsJa = new URLSearchParams(window.location.search);
    expect(paramsJa.get('other')).toBe('keep');
    expect(paramsJa.has(LANG_QUERY_PARAM)).toBe(false);
  });
});
