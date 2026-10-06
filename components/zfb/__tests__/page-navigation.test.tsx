// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { signal } from '@takazudo/zfb/zudo-react';
import { createIslandTest } from '@takazudo/zfb/zudo-react/testing';
import { PageNavigation } from '../page-navigation';

const active: Array<ReturnType<typeof createIslandTest>> = [];
afterEach(() => {
  for (const test of active) test.dispose();
  active.length = 0;
});

function navigation(initialPage = 3) {
  const currentPage = signal(initialPage);
  const navDisabled = signal(false);
  const onNavigate = vi.fn((page: number) => {
    currentPage.value = page;
  });
  function Fixture() {
    return (
      <PageNavigation
        currentPage={currentPage}
        totalPages={8}
        navDisabled={navDisabled}
        onNavigate={onNavigate}
      />
    );
  }
  const test = createIslandTest(Fixture, {}, { document });
  active.push(test);
  const select = test.host.querySelector('select')!;
  return { test, select, currentPage, navDisabled, onNavigate };
}

describe('PageNavigation installed form contract', () => {
  it('renders the current option selected on the server and hydrates the same control', async () => {
    const { test, select } = navigation();
    expect(select.value).toBe('3');
    expect(select.querySelectorAll('[selected]')).toHaveLength(1);
    expect(select.querySelector('[selected]')?.getAttribute('value')).toBe('3');
    expect(test.hydrate()).not.toBeNull();
    await test.flush();
    expect(test.host.querySelector('select')).toBe(select);
    expect(select.value).toBe('3');
    expect(test.diagnostics).toEqual([]);
  });

  it('navigates using the native changed value and follows subsequent history updates', async () => {
    const { test, select, currentPage, onNavigate } = navigation();
    test.hydrate();
    await test.flush();
    select.value = '6';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await test.flush();
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith(6);
    expect(currentPage.value).toBe(6);
    expect(select.value).toBe('6');
    currentPage.value = 2;
    await test.flush();
    expect(select.value).toBe('2');
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(test.host.querySelector('[data-testid="prev-page-button"]')).not.toBeNull();
    currentPage.value = 1;
    await test.flush();
    expect(select.value).toBe('1');
    expect(test.host.querySelector('[data-testid="prev-page-button-disabled"]')).not.toBeNull();
  });

  it('disables the control and rejects navigation while required data is unavailable', async () => {
    const { test, select, navDisabled, onNavigate } = navigation();
    test.hydrate();
    navDisabled.value = true;
    await test.flush();
    expect(select.disabled).toBe(true);
    select.value = '7';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await test.flush();
    expect(onNavigate).not.toHaveBeenCalled();
  });
});
