/**
 * Tests for components/zfb/language-toggle.tsx (Preact, prop-based).
 *
 * Decision (#135): re-pointed at the zfb equivalent now. The original
 * components/language/language-toggle.tsx (Next-coupled, context-based) is
 * deleted in #137.
 *
 * The zfb LanguageToggle is a pure presentational component — it receives
 * `lang`, `setLang`, and `availableLangs` as props. No LanguageProvider
 * wrapper, no manual-registry mock, no next/navigation.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { LanguageToggle } from '@/components/zfb/language-toggle';
import type { Lang } from '@/components/zfb/lang';

const ALL_LANGS: readonly Lang[] = ['ja', 'en'];
const JA_ONLY: readonly Lang[] = ['ja'];

afterEach(() => {
  cleanup();
});

describe('LanguageToggle — default state', () => {
  it('shows JA as the active option when lang is "ja"', () => {
    render(<LanguageToggle lang="ja" setLang={vi.fn()} availableLangs={ALL_LANGS} />);

    const jaButton = screen.getByRole('button', { name: '日本語表示' });
    const enButton = screen.getByRole('button', { name: 'English' });

    expect(jaButton.getAttribute('aria-pressed')).toBe('true');
    expect(enButton.getAttribute('aria-pressed')).toBe('false');
  });

  it('shows EN as the active option when lang is "en"', () => {
    render(<LanguageToggle lang="en" setLang={vi.fn()} availableLangs={ALL_LANGS} />);

    const jaButton = screen.getByRole('button', { name: '日本語表示' });
    const enButton = screen.getByRole('button', { name: 'English' });

    expect(enButton.getAttribute('aria-pressed')).toBe('true');
    expect(jaButton.getAttribute('aria-pressed')).toBe('false');
  });
});

describe('LanguageToggle — interaction', () => {
  it('calls setLang("en") when the EN button is clicked', () => {
    const setLang = vi.fn();
    render(<LanguageToggle lang="ja" setLang={setLang} availableLangs={ALL_LANGS} />);

    fireEvent.click(screen.getByRole('button', { name: 'English' }));

    expect(setLang).toHaveBeenCalledWith('en');
    expect(setLang).toHaveBeenCalledTimes(1);
  });

  it('calls setLang("ja") when the JA button is clicked', () => {
    const setLang = vi.fn();
    render(<LanguageToggle lang="en" setLang={setLang} availableLangs={ALL_LANGS} />);

    fireEvent.click(screen.getByRole('button', { name: '日本語表示' }));

    expect(setLang).toHaveBeenCalledWith('ja');
    expect(setLang).toHaveBeenCalledTimes(1);
  });
});

describe('LanguageToggle — EN unavailable', () => {
  it('marks the EN button aria-disabled and ignores clicks when EN not in availableLangs', () => {
    const setLang = vi.fn();
    render(<LanguageToggle lang="ja" setLang={setLang} availableLangs={JA_ONLY} />);

    const jaButton = screen.getByRole('button', { name: '日本語表示' });
    const enButton = screen.getByRole('button', { name: 'English' });

    expect(enButton.getAttribute('aria-disabled')).toBe('true');
    // aria-pressed still reflects state, not availability.
    expect(enButton.getAttribute('aria-pressed')).toBe('false');
    expect(jaButton.getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(enButton);

    // Click is a no-op when EN is unavailable.
    expect(setLang).not.toHaveBeenCalled();
  });

  it('shows the Japanese-only tooltip when EN is unavailable', () => {
    render(<LanguageToggle lang="ja" setLang={vi.fn()} availableLangs={JA_ONLY} />);

    expect(screen.getByRole('tooltip').textContent).toBe('この資料は日本語のみ対応です');
  });

  it('does not render the tooltip when EN is available', () => {
    render(<LanguageToggle lang="ja" setLang={vi.fn()} availableLangs={ALL_LANGS} />);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
