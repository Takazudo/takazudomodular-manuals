import { afterEach, describe, expect, it, vi } from 'vitest';
import { signal } from '@takazudo/zfb/zudo-react';
import { createIslandTest } from '@takazudo/zfb/zudo-react/testing';
import type { ManualPage } from '@/lib/types/manual';
import type { Lang } from '../zfb/lang';
import { PageViewer } from '../zfb/page-viewer';

const pageWithContent = (lang: Lang): ManualPage => ({
  pageNum: 1,
  image: '/oxi-one-mk2/pages/page-001.png',
  title: 'Intro',
  sectionName: 'Overview',
  content: lang === 'ja' ? 'こんにちは' : 'Hello world',
  contentHtml: lang === 'ja' ? '<p>こんにちは</p>' : '<p>Hello world</p>',
  hasContent: true,
});
const pageWithoutContent: ManualPage = {
  pageNum: 2,
  image: '/oxi-one-mk2/pages/page-002.png',
  title: 'Blank',
  sectionName: null,
  content: '',
  hasContent: false,
};
const active: ReturnType<typeof createIslandTest>[] = [];
afterEach(() => {
  for (const test of active.splice(0)) test.dispose();
  vi.restoreAllMocks();
});

async function renderPage(
  initialPage = pageWithContent('ja'),
  initialLang: Lang = 'ja',
  zoom = false,
) {
  const page = signal(initialPage);
  const lang = signal(initialLang);
  const currentPage = signal(initialPage.pageNum);
  const zoomEnabled = signal(zoom);
  const navDisabled = signal(false);
  const navigate = vi.fn();
  const home = vi.fn();
  function Viewer() {
    return (
      <PageViewer
        page={page}
        lang={lang}
        currentPage={currentPage}
        totalPages={10}
        manualId="oxi-one-mk2"
        onNavigate={navigate}
        onNavigateHome={home}
        zoomEnabled={zoomEnabled}
        navDisabled={navDisabled}
      />
    );
  }
  const test = createIslandTest(Viewer, {}, { document });
  active.push(test);
  const originalImage = test.host.querySelector('[data-testid="page-image"]');
  expect(test.hydrate()).not.toBeNull();
  await test.flush();
  expect(test.diagnostics).toEqual([]);
  if (originalImage)
    expect(test.host.querySelector('[data-testid="page-image"]')).toBe(originalImage);
  const get = (id: string) => {
    const node = test.host.querySelector<HTMLElement>(`[data-testid="${id}"]`);
    if (!node) throw new Error(`Missing ${id}`);
    return node;
  };
  return { test, get, page, lang, currentPage, zoomEnabled, navDisabled, navigate, home };
}

describe('PageViewer — language wiring', () => {
  for (const lang of ['ja', 'en'] as const) {
    it(`hydrates translated ${lang} content`, async () => {
      const { get } = await renderPage(pageWithContent(lang), lang);
      expect(get('translation-panel').getAttribute('lang')).toBe(lang);
      expect(get('translation-panel').innerHTML).toContain(
        lang === 'ja' ? 'こんにちは' : 'Hello world',
      );
    });
    it(`renders ${lang} empty-state copy`, async () => {
      const { get } = await renderPage(pageWithoutContent, lang);
      expect(get('no-translation-message').getAttribute('lang')).toBe(lang);
      expect(get('no-translation-message').textContent).toBe(
        lang === 'ja' ? 'このページには翻訳がありません' : 'No text extracted for this page.',
      );
    });
  }
});

describe('PageViewer — scroll reset on navigation', () => {
  it('resets both scroll columns on a changed page', async () => {
    const { get, page, currentPage, test } = await renderPage();
    get('page-image-scroll').scrollTop = 500;
    get('translation-column').scrollTop = 800;
    page.value = { ...pageWithContent('ja'), pageNum: 2 };
    currentPage.value = 2;
    await test.flush();
    expect(get('page-image-scroll').scrollTop).toBe(0);
    expect(get('translation-column').scrollTop).toBe(0);
  });
  it('updates language live without resetting the same page scroll', async () => {
    const { get, page, lang, test } = await renderPage();
    get('translation-column').scrollTop = 600;
    page.value = pageWithContent('en');
    lang.value = 'en';
    await test.flush();
    expect(get('translation-column').scrollTop).toBe(600);
    expect(get('translation-panel').getAttribute('lang')).toBe('en');
    expect(get('translation-panel').innerHTML).toContain('Hello world');
  });
});

function mockCachedImage() {
  let complete = false;
  vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockImplementation(() => complete);
  vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockImplementation(() =>
    complete ? 800 : 0,
  );
  return () => {
    complete = true;
  };
}
describe('PageViewer — loading overlay', () => {
  it('clears the overlay on image load', async () => {
    const { get, test } = await renderPage();
    expect(get('page-image-overlay').className).toContain('opacity-100');
    get('page-image').dispatchEvent(new Event('load'));
    await test.flush();
    expect(get('page-image-overlay').className).toContain('opacity-0');
    expect(get('page-image-overlay').className).not.toContain('opacity-100');
  });
  it('clears a cached image whose load event never fires', async () => {
    const complete = mockCachedImage();
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
    const { get, test } = await renderPage();
    expect(get('page-image-overlay').className).toContain('opacity-100');
    expect(frames.length).toBeGreaterThan(0);
    complete();
    for (const frame of frames) frame(0);
    await test.flush();
    expect(get('page-image-overlay').className).toContain('opacity-0');
  });
  it('does not reset a cached target to loading after navigation', async () => {
    const complete = mockCachedImage();
    const { get, test, page, currentPage } = await renderPage();
    get('page-image').dispatchEvent(new Event('load'));
    await test.flush();
    complete();
    page.value = { ...pageWithContent('ja'), pageNum: 2, image: '/oxi-one-mk2/pages/page-002.png' };
    currentPage.value = 2;
    await test.flush();
    expect(get('page-image-overlay').className).toContain('opacity-0');
    expect(get('page-image-overlay').className).not.toContain('opacity-100');
  });
  it('recovers from an image error on the next page', async () => {
    const { get, test, page, currentPage } = await renderPage();
    get('page-image').dispatchEvent(new Event('error'));
    await test.flush();
    expect(get('page-image-error')).toBeTruthy();
    page.value = { ...pageWithContent('ja'), pageNum: 2, image: '/oxi-one-mk2/pages/page-002.png' };
    currentPage.value = 2;
    await test.flush();
    expect(get('page-image').getAttribute('src')).toContain('page-002.png');
    get('page-image').dispatchEvent(new Event('load'));
    await test.flush();
    expect(get('page-image-overlay').className).toContain('opacity-0');
  });
});

describe('PageViewer — hover zoom', () => {
  it('positions magnification over the image column and disables live', async () => {
    const { get, test, zoomEnabled } = await renderPage(pageWithContent('ja'), 'ja', true);
    const image = get('page-image');
    Object.defineProperty(image, 'naturalWidth', { configurable: true, value: 1200 });
    vi.spyOn(image, 'getBoundingClientRect').mockReturnValue(new DOMRect(30, 40, 400, 600));
    vi.spyOn(get('page-image-column'), 'getBoundingClientRect').mockReturnValue(
      new DOMRect(10, 20, 500, 700),
    );
    image.dispatchEvent(new MouseEvent('mouseenter', { clientX: 200, clientY: 220 }));
    const panel = get('zoom-panel');
    expect(panel.className).toContain('is-active');
    for (const [key, value] of Object.entries({
      left: '10px',
      top: '20px',
      width: '500px',
      height: '700px',
    }))
      expect(panel.style.getPropertyValue(`--zoom-panel-${key}`)).toBe(value);
    zoomEnabled.value = false;
    await test.flush();
    expect(test.host.querySelector('[data-testid="zoom-panel"]')).toBeNull();
  });
  it('cancels queued frames when unmounted', async () => {
    let id = 0;
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(() => ++id);
    const cancel = vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
    const { get, test } = await renderPage(pageWithContent('ja'), 'ja', true);
    Object.defineProperty(get('page-image'), 'naturalWidth', { configurable: true, value: 1200 });
    get('page-image').dispatchEvent(new MouseEvent('mousemove'));
    const queued = id;
    test.dispose();
    expect(cancel).toHaveBeenCalledWith(queued);
  });
});

it('navigation reads live page/disabled state and removes its keyboard listener', async () => {
  const { get, test, currentPage, navDisabled, navigate, home } = await renderPage();
  document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
  expect(home).toHaveBeenCalledOnce();
  currentPage.value = 4;
  await test.flush();
  document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  expect(navigate).toHaveBeenLastCalledWith(5);
  const select = get('page-selector') as HTMLSelectElement;
  expect(select.value).toBe('4');
  select.value = '7';
  select.dispatchEvent(new Event('change', { bubbles: true }));
  await test.flush();
  expect(navigate).toHaveBeenLastCalledWith(7);
  navDisabled.value = true;
  await test.flush();
  expect(select.disabled).toBe(true);
  navigate.mockClear();
  document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  expect(navigate).not.toHaveBeenCalled();
  navDisabled.value = false;
  await test.flush();
  test.dispose();
  document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  expect(navigate).not.toHaveBeenCalled();
});
