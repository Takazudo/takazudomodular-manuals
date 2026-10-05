import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { signal, type Ref } from '@takazudo/zfb/zudo-react';
import { createIslandTest } from '@takazudo/zfb/zudo-react/testing';
import { ScrollViewer, type ScrollViewerHandle } from '../scroll-viewer';
import type { ManualPage } from '@/lib/types/manual';
import type { Lang } from '../lang';

const observers: FakeIntersectionObserver[] = [];
class FakeIntersectionObserver {
  nodes = new Set<Element>();
  disconnected = false;
  constructor(readonly callback: IntersectionObserverCallback) {
    observers.push(this);
  }
  observe(element: Element) {
    this.nodes.add(element);
  }
  unobserve(element: Element) {
    this.nodes.delete(element);
  }
  disconnect() {
    this.disconnected = true;
    this.nodes.clear();
  }
  emit(element: Element, ratio = 1) {
    this.callback(
      [
        {
          target: element,
          isIntersecting: ratio > 0,
          intersectionRatio: ratio,
        } as IntersectionObserverEntry,
      ],
      this as unknown as IntersectionObserver,
    );
  }
}
const makePage = (pageNum: number): ManualPage => ({
  pageNum,
  image: `/oxi-one-mk2/pages/page-${String(pageNum).padStart(3, '0')}.png`,
  title: `Page ${pageNum}`,
  sectionName: null,
  content: `Content ${pageNum}`,
  contentHtml: `<p>Content ${pageNum}</p>`,
  hasContent: true,
});
const active: ReturnType<typeof createIslandTest>[] = [];
let writes: number[] = [];
const frames = new Map<number, FrameRequestCallback>();
beforeEach(() => {
  writes = [];
  observers.length = 0;
  frames.clear();
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  let nextFrame = 0;
  vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => {
    frames.set(++nextFrame, callback);
    return nextFrame;
  });
  vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation((id) => {
    frames.delete(id);
  });
  const scroll = new WeakMap<HTMLElement, number>();
  vi.spyOn(HTMLElement.prototype, 'scrollTop', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return scroll.get(this) ?? 0;
  });
  vi.spyOn(HTMLElement.prototype, 'scrollTop', 'set').mockImplementation(function (
    this: HTMLElement,
    value: number,
  ) {
    scroll.set(this, value);
    if (this.dataset.testid === 'scroll-image-column') writes.push(value);
  });
  vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return Number(this.dataset.page ?? 0) * 100;
  });
});
afterEach(() => {
  for (const test of active.splice(0)) test.dispose();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
async function mountViewer() {
  const pages = signal(Array.from({ length: 10 }, (_, i) => makePage(i + 1)));
  const lang = signal<Lang>('ja');
  const detected = signal(2);
  const handleRef: Ref<ScrollViewerHandle> = { current: null };
  function Viewer() {
    return (
      <ScrollViewer
        pages={pages}
        lang={lang}
        initialPage={detected.value}
        totalPages={10}
        manualId="oxi-one-mk2"
        handleRef={handleRef}
        onCurrentPageChange={(page) => {
          detected.value = page;
        }}
      />
    );
  }
  const test = createIslandTest(Viewer, {}, { document });
  active.push(test);
  expect(test.hydrate()).not.toBeNull();
  await test.flush();
  expect(test.diagnostics).toEqual([]);
  const get = (selector: string) => {
    const node = test.host.querySelector<HTMLElement>(selector);
    if (!node) throw new Error(`Missing ${selector}`);
    return node;
  };
  return { test, pages, lang, detected, handleRef, get };
}
function runFrames() {
  for (const [id, callback] of [...frames]) {
    frames.delete(id);
    callback(0);
  }
}

describe('ScrollViewer mount snap and lazy observer', () => {
  it('snaps once and never re-snaps after observer-driven parent page updates (#154)', async () => {
    const { get, test, detected } = await mountViewer();
    expect(writes).toEqual([200]);
    observers[0].emit(get('[data-page="4"]'));
    runFrames();
    await test.flush();
    expect(detected.value).toBe(4);
    expect(writes).toEqual([200]);
    expect(get('[data-testid="scroll-translation-panel"]').textContent).toBe('Content 4');
  });
  it('keeps image DOM and scroll offset across live language changes', async () => {
    const { get, pages, lang, test } = await mountViewer();
    const image = get('[data-testid="scroll-page-image-2"]');
    get('[data-testid="scroll-image-column"]').scrollTop = 350;
    pages.value = pages.value.map((page) => ({
      ...page,
      contentHtml: `<p>English ${page.pageNum}</p>`,
    }));
    lang.value = 'en';
    await test.flush();
    expect(get('[data-testid="scroll-page-image-2"]')).toBe(image);
    expect(get('[data-testid="scroll-image-column"]').scrollTop).toBe(350);
    expect(get('[data-testid="scroll-translation-panel"]').textContent).toBe('English 2');
    expect(get('[data-testid="scroll-translation-panel"]').getAttribute('lang')).toBe('en');
  });
  it('preloads the jump target while suppressing intermediate lazy entries until scrollend', async () => {
    const { get, test, handleRef } = await mountViewer();
    const container = get('[data-testid="scroll-image-column"]');
    const scroll = vi.spyOn(container, 'scrollTo').mockImplementation(() => {});
    handleRef.current?.scrollToPage(10);
    await test.flush();
    expect(scroll).toHaveBeenCalledWith({ top: 1000, behavior: 'smooth' });
    expect(get('[data-testid="scroll-page-image-10"]')).toBeTruthy();
    observers[1].emit(get('[data-page="6"]'));
    await test.flush();
    expect(test.host.querySelector('[data-testid="scroll-page-image-6"]')).toBeNull();
    container.dispatchEvent(new Event('scrollend'));
    observers[1].emit(get('[data-page="6"]'));
    await test.flush();
    expect(get('[data-testid="scroll-page-image-6"]')).toBeTruthy();
  });
  it('disconnects both observers, cancels pending frames and clears the jump timer on disposal', async () => {
    const { get, test, handleRef } = await mountViewer();
    vi.spyOn(get('[data-testid="scroll-image-column"]'), 'scrollTo').mockImplementation(() => {});
    const clearTimer = vi.spyOn(globalThis, 'clearTimeout');
    handleRef.current?.scrollToPage(10);
    observers[0].emit(get('[data-page="8"]'));
    expect(frames.size).toBe(1);
    test.dispose();
    expect(observers.every((observer) => observer.disconnected)).toBe(true);
    expect(handleRef.current).toBeNull();
    expect(frames.size).toBe(0);
    expect(clearTimer).toHaveBeenCalled();
  });
});
