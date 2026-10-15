'use client';

import { getScope, signal, type Signal } from '@takazudo/zfb/zudo-react';
import {
  DEFAULT_LANG,
  readPersistedLang,
  syncLangToUrl,
  writeLangToStorage,
  type Lang,
} from './lang';

/** Deterministic SSR state; resolve browser preferences only after activation. */
export function useLang(): [Signal<Lang>, (next: Lang) => void] {
  const lang = signal<Lang>(DEFAULT_LANG);
  getScope().onActivate(() => {
    lang.value = readPersistedLang();
  });
  const setLang = (next: Lang) => {
    lang.value = next;
    writeLangToStorage(next);
    syncLangToUrl(next);
  };
  return [lang, setLang];
}
