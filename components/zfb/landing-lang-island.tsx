'use client';

import { LanguageToggle } from './language-toggle';
import type { Lang } from './lang';
import { useLang } from './use-lang';

export interface LandingLangIslandProps {
  availableLangs: readonly Lang[];
}

/**
 * Island root for the landing-page language toggle. Owns its own lang state
 * so the LanguageToggle is self-contained (not wired to the mega-island, which
 * only mounts on detail pages). Serializable props: only `availableLangs`
 * (string array). Uses useLang() for SSR-safe effect-based localStorage read.
 */
export default function LandingLangIsland({ availableLangs }: LandingLangIslandProps) {
  const [lang, setLang] = useLang();

  return <LanguageToggle lang={lang} setLang={setLang} availableLangs={availableLangs} />;
}
