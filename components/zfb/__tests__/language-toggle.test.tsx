import { afterEach, describe, expect, it, vi } from 'vitest';
import { signal } from '@takazudo/zfb/zudo-react';
import { createIslandTest } from '@takazudo/zfb/zudo-react/testing';
import { LanguageToggle } from '@/components/zfb/language-toggle';
import type { Lang } from '@/components/zfb/lang';

const active: Array<ReturnType<typeof createIslandTest>> = [];
afterEach(() => {
  for (const test of active) test.dispose();
  active.length = 0;
});
function renderToggle(initial: Lang = 'ja', availableLangs: readonly Lang[] = ['ja', 'en']) {
  const lang = signal<Lang>(initial);
  const setLang = vi.fn((next: Lang) => {
    lang.value = next;
  });
  function TestToggle() {
    return <LanguageToggle lang={lang} setLang={setLang} availableLangs={availableLangs} />;
  }
  const test = createIslandTest(TestToggle, {}, { document });
  active.push(test);
  const before = test.host.querySelector('button');
  expect(test.hydrate()).not.toBeNull();
  expect(test.host.querySelector('button')).toBe(before);
  expect(test.diagnostics).toEqual([]);
  const ja = test.host.querySelector<HTMLButtonElement>('[aria-label="日本語表示"]')!;
  const en = test.host.querySelector<HTMLButtonElement>('[aria-label="English"]')!;
  return { test, lang, setLang, ja, en };
}
describe('LanguageToggle', () => {
  it('shows JA active initially', () => {
    const { ja, en } = renderToggle();
    expect(ja.getAttribute('aria-pressed')).toBe('true');
    expect(en.getAttribute('aria-pressed')).toBe('false');
  });
  it('shows EN active initially', () => {
    const { ja, en } = renderToggle('en');
    expect(en.getAttribute('aria-pressed')).toBe('true');
    expect(ja.getAttribute('aria-pressed')).toBe('false');
  });
  it('calls setLang once and updates pressed state and appearance when EN is clicked', async () => {
    const { test, ja, en, setLang } = renderToggle();
    const before = en.className;
    en.click();
    await test.flush();
    expect(setLang).toHaveBeenCalledTimes(1);
    expect(setLang).toHaveBeenCalledWith('en');
    expect(en.getAttribute('aria-pressed')).toBe('true');
    expect(ja.getAttribute('aria-pressed')).toBe('false');
    expect(en.className).not.toBe(before);
  });
  it('calls setLang once and updates pressed state when JA is clicked', async () => {
    const { test, ja, en, setLang } = renderToggle('en');
    ja.click();
    await test.flush();
    expect(setLang).toHaveBeenCalledTimes(1);
    expect(setLang).toHaveBeenCalledWith('ja');
    expect(ja.getAttribute('aria-pressed')).toBe('true');
    expect(en.getAttribute('aria-pressed')).toBe('false');
  });
  it('disables English and ignores its clicks for Japanese-only manuals', () => {
    const { en, ja, setLang } = renderToggle('ja', ['ja']);
    expect(en.getAttribute('aria-disabled')).toBe('true');
    expect(en.getAttribute('aria-pressed')).toBe('false');
    expect(ja.getAttribute('aria-pressed')).toBe('true');
    en.click();
    expect(setLang).not.toHaveBeenCalled();
  });
  it('explains unavailable English with a tooltip', () => {
    const { test } = renderToggle('ja', ['ja']);
    expect(test.host.querySelector('[role="tooltip"]')?.textContent).toBe(
      'この資料は日本語のみ対応です',
    );
  });
  it('omits the tooltip when English is available', () => {
    expect(renderToggle().test.host.querySelector('[role="tooltip"]')).toBeNull();
  });
  it('releases button listeners on disposal', () => {
    const { test, en, setLang } = renderToggle();
    test.dispose();
    en.click();
    expect(setLang).not.toHaveBeenCalled();
  });
});
