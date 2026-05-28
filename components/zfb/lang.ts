// Language constants and helpers shared across the zfb mega-island.
//
// Ported from `components/language/language-context.tsx`, minus the React
// context — the mega-island (`manual-app.tsx`) owns language as plain
// `useState` internally, so consumers receive `lang`/`setLang` as props
// instead of reading a context. The persistence rules (URL `?lang=` query
// param + localStorage) are identical to the Next.js viewer.

export type Lang = 'ja' | 'en';

export const SUPPORTED_LANGS: ReadonlyArray<Lang> = ['ja', 'en'];

/**
 * localStorage key for persisting the chosen language. Namespaced under
 * `zmanuals:` to avoid collisions with other takazudomodular apps hosted on
 * the same origin. Matches the Next.js viewer's key so a user's preference
 * carries across the migration.
 */
export const LANG_STORAGE_KEY = 'zmanuals:lang';

/** Query-string parameter name used as a first-class persistence mechanism. */
export const LANG_QUERY_PARAM = 'lang';

export const DEFAULT_LANG: Lang = 'ja';

/** Empty-content fallback copy, keyed by display language. */
export const EMPTY_CONTENT_MESSAGE: Record<Lang, string> = {
  ja: 'このページには翻訳がありません',
  en: 'No text extracted for this page.',
};

export function isLang(value: string | null | undefined): value is Lang {
  return value === 'ja' || value === 'en';
}

/**
 * Read the persisted language in priority order:
 *   1. `?lang=` query string on the current URL
 *   2. `localStorage` under {@link LANG_STORAGE_KEY}
 *   3. Default {@link DEFAULT_LANG}
 *
 * Only safe to call client-side (inside an effect) — guards against
 * `window`/`localStorage` being unavailable during SSR.
 */
export function readPersistedLang(): Lang {
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
 * entirely so default-state URLs stay clean. Preserves the rest of the
 * current path/search/hash so it composes with in-manual SPA navigation.
 */
export function syncLangToUrl(lang: Lang): void {
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

export function writeLangToStorage(lang: Lang): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // Quota exceeded / private mode: persistence is best-effort.
  }
}
