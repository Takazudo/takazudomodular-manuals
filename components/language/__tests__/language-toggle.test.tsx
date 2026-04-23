import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

/**
 * Mock the manual-registry module so the tests can drive `hasLanguage` per
 * manualId/lang without loading the real JSON data files or the rest of the
 * registry surface area. Only `hasLanguage` is consumed by LanguageToggle.
 */
vi.mock('@/lib/manual-registry', () => ({
  hasLanguage: vi.fn(),
}));

import { hasLanguage } from '@/lib/manual-registry';
import { LanguageProvider } from '../language-context';
import { LanguageToggle } from '../language-toggle';

/** Replace the current URL via history.replaceState — does not navigate. */
function setUrl(search: string) {
  window.history.replaceState(null, '', `/${search}`);
}

const hasLanguageMock = vi.mocked(hasLanguage);

beforeEach(() => {
  setUrl('');
  window.localStorage.clear();
  // Default: EN is available for whatever manual the test targets.
  hasLanguageMock.mockReset();
  hasLanguageMock.mockReturnValue(true);
});

afterEach(() => {
  cleanup();
  setUrl('');
  window.localStorage.clear();
  vi.restoreAllMocks();
});

function renderToggle(manualId: string | null) {
  return render(
    <LanguageProvider>
      <LanguageToggle manualId={manualId} />
    </LanguageProvider>,
  );
}

describe('LanguageToggle — gating', () => {
  it('renders nothing when manualId is null', () => {
    const { container } = renderToggle(null);
    expect(container.firstChild).toBeNull();
  });
});

describe('LanguageToggle — default state', () => {
  it('shows JA as the active option by default', () => {
    renderToggle('oxi-one-mk2');

    const jaButton = screen.getByRole('button', { name: '日本語表示' });
    const enButton = screen.getByRole('button', { name: 'English' });

    // aria-pressed reflects the active language.
    expect(jaButton.getAttribute('aria-pressed')).toBe('true');
    expect(enButton.getAttribute('aria-pressed')).toBe('false');
  });
});

describe('LanguageToggle — interaction', () => {
  it('clicking EN switches the active language to en', () => {
    renderToggle('oxi-one-mk2');

    const jaButton = screen.getByRole('button', { name: '日本語表示' });
    const enButton = screen.getByRole('button', { name: 'English' });

    fireEvent.click(enButton);

    // After click, aria-pressed should flip — verifies setLang('en') fired.
    expect(enButton.getAttribute('aria-pressed')).toBe('true');
    expect(jaButton.getAttribute('aria-pressed')).toBe('false');
  });

  it('clicking JA switches the active language back to ja', () => {
    // Seed URL so the provider resolves to EN after mount.
    setUrl('?lang=en');
    renderToggle('oxi-one-mk2');

    const jaButton = screen.getByRole('button', { name: '日本語表示' });
    const enButton = screen.getByRole('button', { name: 'English' });

    // Sanity check: post-mount, EN should be active.
    expect(enButton.getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(jaButton);

    expect(jaButton.getAttribute('aria-pressed')).toBe('true');
    expect(enButton.getAttribute('aria-pressed')).toBe('false');
  });
});

describe('LanguageToggle — EN unavailable', () => {
  it('marks the EN button aria-disabled and ignores clicks', () => {
    hasLanguageMock.mockImplementation((_manualId, lang) => lang === 'ja');

    renderToggle('only-ja-manual');

    const jaButton = screen.getByRole('button', { name: '日本語表示' });
    const enButton = screen.getByRole('button', { name: 'English' });

    expect(enButton.getAttribute('aria-disabled')).toBe('true');
    // aria-pressed still reflects state, not availability.
    expect(enButton.getAttribute('aria-pressed')).toBe('false');
    expect(jaButton.getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(enButton);

    // Click is a no-op: JA stays active, EN stays inactive.
    expect(jaButton.getAttribute('aria-pressed')).toBe('true');
    expect(enButton.getAttribute('aria-pressed')).toBe('false');
  });

  it('shows the Japanese-only tooltip when EN is unavailable', () => {
    hasLanguageMock.mockImplementation((_manualId, lang) => lang === 'ja');

    renderToggle('only-ja-manual');

    expect(screen.getByRole('tooltip').textContent).toBe('この資料は日本語のみ対応です');
  });

  it('does not render the tooltip when EN is available', () => {
    renderToggle('oxi-one-mk2');
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});

describe('LanguageToggle — aria-pressed follows current lang', () => {
  it('reflects the persisted language from the URL on mount', () => {
    setUrl('?lang=en');

    renderToggle('oxi-one-mk2');

    const jaButton = screen.getByRole('button', { name: '日本語表示' });
    const enButton = screen.getByRole('button', { name: 'English' });

    // LanguageProvider resolves the URL param inside a mount effect; by the
    // time Testing Library's render() returns, the effect has flushed.
    expect(enButton.getAttribute('aria-pressed')).toBe('true');
    expect(jaButton.getAttribute('aria-pressed')).toBe('false');
  });
});
