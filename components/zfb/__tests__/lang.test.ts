/**
 * Unit tests for components/zfb/lang.ts — pure language helpers.
 *
 * Decision (#137): The original language-context.test.tsx (which tested
 * the full React LanguageProvider) was deleted along with the original
 * language-context.tsx. Coverage for the core lang resolution logic
 * (?lang= > localStorage > default:ja, invalid→ja) now lives here,
 * testing the pure helpers in lang.ts instead of a React Provider.
 *
 * Hydration-safety and setLang/URL-sync behaviour are covered by the
 * island's runtime (manual-app.tsx) — those paths require the island
 * environment and are validated by e2e/smoke tests.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_LANG,
  LANG_QUERY_PARAM,
  LANG_STORAGE_KEY,
  isLang,
  readPersistedLang,
  syncLangToUrl,
  writeLangToStorage,
} from '../lang';

/** Replace the current URL via history.replaceState — does not navigate. */
function setUrl(search: string) {
  window.history.replaceState(null, '', `/${search}`);
}

beforeEach(() => {
  setUrl('');
  window.localStorage.clear();
});

afterEach(() => {
  setUrl('');
  window.localStorage.clear();
});

describe('isLang()', () => {
  it('returns true for "ja" and "en"', () => {
    expect(isLang('ja')).toBe(true);
    expect(isLang('en')).toBe(true);
  });

  it('returns false for unsupported values', () => {
    expect(isLang('fr')).toBe(false);
    expect(isLang('')).toBe(false);
    expect(isLang(null)).toBe(false);
    expect(isLang(undefined)).toBe(false);
  });
});

describe('readPersistedLang() — URL priority', () => {
  it('returns "en" when ?lang=en is in the URL', () => {
    setUrl('?lang=en');
    expect(readPersistedLang()).toBe('en');
  });

  it('URL param takes priority over localStorage', () => {
    setUrl('?lang=en');
    window.localStorage.setItem(LANG_STORAGE_KEY, 'ja');
    expect(readPersistedLang()).toBe('en');
  });
});

describe('readPersistedLang() — localStorage fallback', () => {
  it('returns localStorage value when no URL param', () => {
    setUrl('');
    window.localStorage.setItem(LANG_STORAGE_KEY, 'en');
    expect(readPersistedLang()).toBe('en');
  });
});

describe('readPersistedLang() — default fallback', () => {
  it('falls back to "ja" (DEFAULT_LANG) when neither URL nor localStorage has a value', () => {
    expect(readPersistedLang()).toBe(DEFAULT_LANG);
    expect(readPersistedLang()).toBe('ja');
  });

  it('ignores invalid lang values from URL and localStorage and falls back to "ja"', () => {
    setUrl('?lang=fr');
    window.localStorage.setItem(LANG_STORAGE_KEY, 'de');
    expect(readPersistedLang()).toBe('ja');
  });
});

describe('syncLangToUrl()', () => {
  it('adds ?lang=en to the URL when setting "en"', () => {
    syncLangToUrl('en');
    const params = new URLSearchParams(window.location.search);
    expect(params.get(LANG_QUERY_PARAM)).toBe('en');
  });

  it('removes the lang param when setting "ja" (ja is the clean default)', () => {
    setUrl('?lang=en');
    syncLangToUrl('ja');
    const params = new URLSearchParams(window.location.search);
    expect(params.has(LANG_QUERY_PARAM)).toBe(false);
  });

  it('preserves unrelated query params', () => {
    setUrl('?other=keep');
    syncLangToUrl('en');
    const params = new URLSearchParams(window.location.search);
    expect(params.get('other')).toBe('keep');
    expect(params.get(LANG_QUERY_PARAM)).toBe('en');
  });
});

describe('writeLangToStorage()', () => {
  it('writes the chosen lang to localStorage', () => {
    writeLangToStorage('en');
    expect(window.localStorage.getItem(LANG_STORAGE_KEY)).toBe('en');
  });

  it('overwrites a previous value', () => {
    writeLangToStorage('en');
    writeLangToStorage('ja');
    expect(window.localStorage.getItem(LANG_STORAGE_KEY)).toBe('ja');
  });
});
