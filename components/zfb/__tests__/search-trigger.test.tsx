import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createIslandTest } from '@takazudo/zfb/zudo-react/testing';
import { SearchTrigger } from '@/components/zfb/search-trigger';
import { __clearSearchIndexCacheForTests } from '@/components/zfb/search-dialog';

const active: Array<ReturnType<typeof createIslandTest>> = [];
beforeEach(() => {
  __clearSearchIndexCacheForTests();
  vi.spyOn(HTMLDialogElement.prototype, 'showModal').mockImplementation(function (
    this: HTMLDialogElement,
  ) {
    this.open = true;
  });
  vi.spyOn(HTMLDialogElement.prototype, 'close').mockImplementation(function (
    this: HTMLDialogElement,
  ) {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('[]', { status: 200 })),
  );
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (X11; Linux x86_64)');
});
afterEach(() => {
  for (const test of active) test.dispose();
  active.length = 0;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
async function renderTrigger(mac = false) {
  if (mac)
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    );
  function TestTrigger() {
    return <SearchTrigger manualId="oxi-one-mk2" onNavigate={vi.fn()} />;
  }
  const test = createIslandTest(TestTrigger, {}, { document });
  active.push(test);
  const before = test.host.querySelector('button');
  expect(test.hydrate()).not.toBeNull();
  await test.flush();
  expect(test.host.querySelector('button')).toBe(before);
  expect(test.diagnostics).toEqual([]);
  return {
    test,
    button: test.host.querySelector<HTMLButtonElement>('button[aria-label="検索"]')!,
    dialog: test.host.querySelector('dialog')!,
  };
}
function key(options: KeyboardEventInit) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', cancelable: true, ...options }));
}
describe('SearchTrigger', () => {
  it('renders an accessible icon button', async () => {
    expect((await renderTrigger()).button.tagName).toBe('BUTTON');
  });
  it('shows Ctrl+K on non-Mac platforms', async () => {
    expect((await renderTrigger()).button.textContent).toContain('Ctrl+K');
  });
  it('shows ⌘K on Mac platforms after hydration', async () => {
    expect((await renderTrigger(true)).button.textContent).toContain('⌘K');
  });
  it('opens on button click', async () => {
    const { test, button, dialog } = await renderTrigger();
    expect(dialog.open).toBe(false);
    button.click();
    await test.flush();
    expect(dialog.open).toBe(true);
  });
  it('toggles on Ctrl+K', async () => {
    const { test, dialog } = await renderTrigger();
    key({ ctrlKey: true });
    await test.flush();
    expect(dialog.open).toBe(true);
    key({ ctrlKey: true });
    await test.flush();
    expect(dialog.open).toBe(false);
  });
  it('toggles on Cmd+K on Mac', async () => {
    const { test, dialog } = await renderTrigger(true);
    key({ metaKey: true });
    await test.flush();
    expect(dialog.open).toBe(true);
  });
  it('ignores plain k and mixed modifiers', async () => {
    const { test, dialog } = await renderTrigger();
    key({});
    key({ ctrlKey: true, metaKey: true });
    key({ ctrlKey: true, altKey: true });
    await test.flush();
    expect(dialog.open).toBe(false);
  });
  it('removes the global shortcut listener on disposal', async () => {
    const { test } = await renderTrigger();
    test.dispose();
    const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });
});
