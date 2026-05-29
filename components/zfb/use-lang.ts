'use client';

import { useCallback, useEffect, useState } from 'preact/hooks';
import {
  DEFAULT_LANG,
  readPersistedLang,
  syncLangToUrl,
  writeLangToStorage,
  type Lang,
} from './lang';

/**
 * Shared lang state hook used by both ManualApp and LandingLangIsland.
 *
 * SSR-safe: state initializes to DEFAULT_LANG ("ja") on first render so
 * SSR and hydration always agree. The real persisted preference is read
 * from localStorage/URL in a useEffect, avoiding hydration mismatches.
 *
 * Returns [lang, setLang] mirroring useState ergonomics.
 */
export function useLang(): [Lang, (next: Lang) => void] {
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

  return [lang, setLang];
}
