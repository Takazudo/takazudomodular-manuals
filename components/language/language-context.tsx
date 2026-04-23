'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Supported UI languages. `ja` is the default — when active, the `?lang` query
 * param is stripped so default-state URLs stay clean and shareable.
 */
export type Lang = 'ja' | 'en';

export const SUPPORTED_LANGS: ReadonlyArray<Lang> = ['ja', 'en'];

/**
 * localStorage key for persisting the chosen language. Namespaced under
 * `zmanuals:` to avoid collisions with other takazudomodular apps hosted on
 * the same origin.
 */
export const LANG_STORAGE_KEY = 'zmanuals:lang';

/** Query-string parameter name used as a first-class persistence mechanism. */
export const LANG_QUERY_PARAM = 'lang';

const DEFAULT_LANG: Lang = 'ja';

type LanguageContextValue = {
  lang: Lang;
  setLang: (next: Lang) => void;
  supportedLangs: ReadonlyArray<Lang>;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function isLang(value: string | null | undefined): value is Lang {
  return value === 'ja' || value === 'en';
}

/**
 * Read the initial language in priority order:
 *   1. `?lang=` query string on the current URL
 *   2. `localStorage` under {@link LANG_STORAGE_KEY}
 *   3. Default {@link DEFAULT_LANG}
 *
 * Only called inside a `useEffect`, never at module eval, so `output: 'export'`
 * builds remain safe (no build-time window/localStorage access).
 */
function readPersistedLang(): Lang {
  if (typeof window === 'undefined') return DEFAULT_LANG;
  try {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get(LANG_QUERY_PARAM);
    if (isLang(urlLang)) return urlLang;
  } catch {
    // URL parsing failures fall through to localStorage.
  }
  try {
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (isLang(stored)) return stored;
  } catch {
    // Private-mode / access-denied: fall through to default.
  }
  return DEFAULT_LANG;
}

/**
 * Sync the `?lang=` query string on the current URL without triggering a
 * navigation. When setting to {@link DEFAULT_LANG}, the param is removed
 * entirely so default-state URLs stay clean.
 */
function syncLangToUrl(lang: Lang) {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    if (lang === DEFAULT_LANG) {
      url.searchParams.delete(LANG_QUERY_PARAM);
    } else {
      url.searchParams.set(LANG_QUERY_PARAM, lang);
    }
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(null, '', next);
  } catch {
    // Non-fatal: URL sync is a best-effort UX enhancement.
  }
}

function writeLangToStorage(lang: Lang) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // Quota exceeded / private mode: persistence is best-effort.
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Deliberately ignore persisted values during the initial render so that
  // server and first client render always agree on `ja`, avoiding hydration
  // mismatches. The real value is resolved in the mount-time effect below.
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    const persisted = readPersistedLang();
    if (persisted !== DEFAULT_LANG) {
      setLangState(persisted);
    }
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    writeLangToStorage(next);
    syncLangToUrl(next);
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      supportedLangs: SUPPORTED_LANGS,
    }),
    [lang, setLang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
