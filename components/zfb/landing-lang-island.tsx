'use client';

import { useState, useCallback } from 'preact/hooks';
import { LanguageToggle } from './language-toggle';
import type { Lang } from './lang';
import { DEFAULT_LANG, readPersistedLang, writeLangToStorage, syncLangToUrl } from './lang';

export interface LandingLangIslandProps {
  availableLangs: readonly Lang[];
}

/**
 * Island root for the landing-page language toggle. Owns its own lang state
 * so the LanguageToggle is self-contained (not wired to the mega-island, which
 * only mounts on detail pages). Serializable props: only `availableLangs`
 * (string array). Mirrors the ManualApp lang state init pattern.
 */
export default function LandingLangIsland({ availableLangs }: LandingLangIslandProps) {
  const [lang, setLangState] = useState<Lang>(() => readPersistedLang() ?? DEFAULT_LANG);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    writeLangToStorage(next);
    syncLangToUrl(next);
  }, []);

  return <LanguageToggle lang={lang} setLang={setLang} availableLangs={availableLangs} />;
}
