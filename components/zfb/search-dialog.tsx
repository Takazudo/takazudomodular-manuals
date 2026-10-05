import {
  computed,
  For,
  getScope,
  Show,
  signal,
  type ReadonlySignal,
  type Ref,
} from '@takazudo/zfb/zudo-react';
import MiniSearch, { type SearchResult } from 'minisearch';
import { withBasePath } from './routing';
import { highlightTerms, makeExcerpt } from './search-highlight';

export interface SearchDialogProps {
  manualId: string;
  /** Search-index content hash from the manifest; appended as `?v=` cache-bust. */
  searchIndexVersion?: string;
  open: ReadonlySignal<boolean>;
  onClose: () => void;
  /** Navigate to a page (client-side, owned by the island). */
  onNavigate: (pageNum: number) => void;
}

/**
 * Shape of each document stored in the search index JSON.
 * Matches the output spec of topic-search-index (#85).
 */
interface SearchDoc {
  id: string;
  pageNum: number;
  title: string;
  sectionName: string;
  body: string;
  url?: string;
}

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

const BATCH_SIZE = 10;
const DEBOUNCE_MS = 150;

// Module-level cache: one MiniSearch instance per `${manualId}::${version ?? ''}`,
// shared across mount/unmount cycles. Keying by version (the searchIndexVersion
// hash) ensures a new deploy bypasses a stale cache entry on long-lived tabs.
const indexCache = new Map<string, MiniSearch<SearchDoc>>();

/**
 * Test-only hook: drop the cached MiniSearch instance(s). Real application
 * code never calls this — the cache intentionally survives open/close cycles.
 * Call this in `beforeEach` so search-dialog tests start with a clean slate
 * and don't leak stale indices across test cases.
 */
export function __clearSearchIndexCacheForTests(): void {
  indexCache.clear();
}

function getIndexCacheKey(manualId: string, version: string | undefined): string {
  return `${manualId}::${version ?? ''}`;
}

function createMiniSearch(): MiniSearch<SearchDoc> {
  return new MiniSearch<SearchDoc>({
    fields: ['title', 'sectionName', 'body'],
    storeFields: ['pageNum', 'title', 'sectionName', 'body', 'url'],
    idField: 'id',
    searchOptions: {
      prefix: true,
      fuzzy: 0.2,
      boost: { title: 3, sectionName: 2 },
    },
  });
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const dialogStyles =
  'w-full h-full sm:w-[80vw] sm:h-[80vh] sm:max-w-[80rem] sm:mx-auto sm:my-[10vh] sm:rounded-lg bg-zd-black text-zd-white border border-zd-gray4 p-0 m-0';

const rootStyles = 'flex flex-col w-full h-full overflow-hidden';

const headerStyles = 'flex items-center gap-hgap-xs px-hgap-sm py-vgap-xs border-b border-zd-gray4';

const searchIconStyles = 'flex-none text-zd-gray6';

const inputStyles =
  'flex-1 bg-zd-black text-zd-white border-0 outline-none text-lg py-vgap-xs placeholder:text-zd-gray6';

const hitCountStyles = 'hidden sm:block flex-none text-sm text-zd-gray6';

const closeButtonStyles =
  'flex-none flex items-center justify-center w-[32px] h-[32px] rounded-md text-zd-gray6 hover:text-zd-white hover:bg-zd-gray3 focus:outline-2 focus:outline-zd-outline';

const resultsListStyles = 'flex-1 overflow-y-auto overscroll-contain';

const resultItemStyles =
  'w-full text-left block px-hgap-sm py-vgap-xs border-b border-zd-gray4 hover:bg-zd-gray2 focus:outline-2 focus:outline-zd-outline focus:bg-zd-gray2 cursor-pointer';

const resultRowStyles = 'flex items-start gap-hgap-xs';

const resultTextStyles = 'flex-1 min-w-0';

const resultTitleStyles = 'font-semibold text-zd-white';

const resultSectionStyles = 'text-sm text-zd-gray6';

const resultExcerptStyles = 'text-sm text-zd-gray7 mt-vgap-2xs';

const pageBadgeStyles =
  'flex-none text-xs text-zd-gray6 px-hgap-xs py-vgap-2xs border border-zd-gray4 rounded-sm';

const statusStyles = 'px-hgap-sm py-vgap-sm text-zd-gray6 text-sm';

const errorButtonStyles =
  'mt-vgap-xs inline-flex items-center px-hgap-xs py-vgap-2xs border border-zd-gray4 rounded-md text-zd-white hover:bg-zd-gray2 focus:outline-2 focus:outline-zd-outline';

// ─── Component ──────────────────────────────────────────────────────────────

export function SearchDialog({
  manualId,
  searchIndexVersion,
  open,
  onClose,
  onNavigate,
}: SearchDialogProps) {
  const scope = getScope();
  const dialogRef: Ref<HTMLDialogElement> = { current: null };
  const inputRef: Ref<HTMLInputElement> = { current: null };
  const sentinelRef: Ref<HTMLDivElement> = { current: null };
  const listRef: Ref<HTMLDivElement> = { current: null };
  const loadState = signal<LoadState>('idle');
  const query = signal('');
  const debouncedQuery = signal('');
  const visibleCount = signal(BATCH_SIZE);
  const indexInstance = signal<MiniSearch<SearchDoc> | null>(null);
  const results = computed(() => {
    const index = indexInstance.value;
    const q = debouncedQuery.value.trim();
    return index && q ? index.search(q) : [];
  });
  const hasQuery = computed(() => debouncedQuery.value.trim().length > 0);
  const hitCountLabel = computed(() => `${results.value.length}件の結果`);
  const readyQuery = computed(() => loadState.value === 'ready' && hasQuery.value);
  // Include the settled query in each key: highlighting belongs to that query,
  // while increasing the batch size keeps the existing result buttons intact.
  const visibleResults = computed(() =>
    readyQuery.value
      ? results.value.slice(0, visibleCount.value).map((hit) => ({
          key: `${debouncedQuery.value}::${hit.id}`,
          hit: hit as SearchResult & SearchDoc,
          query: debouncedQuery.value,
        }))
      : [],
  );
  const liveStatusText = computed(() => {
    if (loadState.value === 'loading') return '検索インデックスを読み込み中...';
    if (loadState.value === 'error') return '検索インデックスを読み込めませんでした';
    if (readyQuery.value) return results.value.length === 0 ? '該当なし' : hitCountLabel.value;
    return '';
  });

  scope.effect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open.value) {
      if (!dialog.open) dialog.showModal();
      const frame = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(frame);
    }
    if (dialog.open) dialog.close();
  });

  const loadIndex = async () => {
    const cacheKey = getIndexCacheKey(manualId, searchIndexVersion);
    const cached = indexCache.get(cacheKey);
    if (cached) {
      indexInstance.value = cached;
      loadState.value = 'ready';
      return;
    }
    loadState.value = 'loading';
    try {
      const path = searchIndexVersion
        ? `/${manualId}/data/search-index.json?v=${searchIndexVersion}`
        : `/${manualId}/data/search-index.json`;
      const res = await fetch(withBasePath(path), { signal: scope.abortSignal });
      if (!res.ok) throw new Error(`Failed to fetch search index: ${res.status}`);
      const docs = (await res.json()) as SearchDoc[];
      if (scope.abortSignal.aborted) return;
      const instance = createMiniSearch();
      instance.addAll(docs);
      indexCache.set(cacheKey, instance);
      indexInstance.value = instance;
      loadState.value = 'ready';
    } catch (err) {
      if (scope.abortSignal.aborted) return;
      console.error('[SearchDialog] index load failed', err);
      loadState.value = 'error';
    }
  };
  scope.effect(() => {
    if (open.value && loadState.value === 'idle') void loadIndex();
  });
  scope.effect(() => {
    const next = query.value;
    const timer = setTimeout(() => {
      debouncedQuery.value = next;
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  });
  scope.effect(() => {
    // Reset pagination and scroll for each settled result set.
    void results.value;
    visibleCount.value = BATCH_SIZE;
    if (listRef.current) listRef.current.scrollTop = 0;
  });
  scope.effect(() => {
    // A query or appended batch can leave the sentinel inside the observer's
    // margin without crossing it. Re-observe after either update so a tall
    // viewport can request the next batch without requiring a new crossing.
    const total = results.value.length;
    const count = visibleCount.value;
    const sentinel = sentinelRef.current;
    const list = listRef.current;
    if (!sentinel || !list || typeof IntersectionObserver === 'undefined') return;
    let active = true;
    const observer = new IntersectionObserver(
      (entries) => {
        if (active && count < total && entries.some((entry) => entry.isIntersecting)) {
          visibleCount.value = Math.min(count + BATCH_SIZE, total);
        }
      },
      { root: list, rootMargin: '200px 0px' },
    );
    observer.observe(sentinel);
    return () => {
      active = false;
      observer.disconnect();
    };
  });

  const handleResultActivate = (pageNum: number) => {
    onNavigate(pageNum);
    onClose();
  };
  const handleResultKeyDown = (event: KeyboardEvent, pageNum: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleResultActivate(pageNum);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      class={dialogStyles}
      aria-label="検索"
      data-search-dialog
      on:close={onClose}
    >
      <span class="sr-only" aria-live="polite" aria-atomic="true">
        {liveStatusText}
      </span>
      <div class={rootStyles}>
        <div class={headerStyles}>
          <span class={searchIconStyles} aria-hidden="true">
            🔍
          </span>
          <input
            ref={inputRef}
            type="search"
            modelValue={query}
            placeholder="検索キーワードを入力..."
            class={inputStyles}
            aria-label="検索キーワード"
            autocomplete="off"
            spellcheck={false}
          />
          <Show when={readyQuery}>
            {() => (
              <span class={hitCountStyles} aria-hidden="true">
                {hitCountLabel}
              </span>
            )}
          </Show>
          <button
            type="button"
            on:click={() => dialogRef.current?.close()}
            class={closeButtonStyles}
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>
        <div ref={listRef} class={resultsListStyles}>
          <Show when={computed(() => loadState.value === 'loading')}>
            {() => <div class={statusStyles}>検索インデックスを読み込み中...</div>}
          </Show>
          <Show when={computed(() => loadState.value === 'error')}>
            {() => (
              <div class={statusStyles}>
                <p>検索インデックスを読み込めませんでした</p>
                <button
                  type="button"
                  on:click={() => {
                    loadState.value = 'idle';
                  }}
                  class={errorButtonStyles}
                >
                  再試行
                </button>
              </div>
            )}
          </Show>
          <Show when={computed(() => loadState.value === 'ready' && !hasQuery.value)}>
            {() => <div class={statusStyles}>検索キーワードを入力...</div>}
          </Show>
          <Show when={computed(() => readyQuery.value && results.value.length === 0)}>
            {() => <div class={statusStyles}>該当なし</div>}
          </Show>
          <For each={visibleResults} by={(item) => item.key}>
            {(item) => {
              const { hit: doc, query: settledQuery } = item.value;
              const excerpt = makeExcerpt(doc.body ?? '', settledQuery);
              return (
                <button
                  type="button"
                  class={resultItemStyles}
                  on:click={() => handleResultActivate(doc.pageNum)}
                  on:keydown={(event) => handleResultKeyDown(event, doc.pageNum)}
                >
                  <div class={resultRowStyles}>
                    <div class={resultTextStyles}>
                      <div class={resultTitleStyles}>
                        {highlightTerms(doc.title ?? '', settledQuery)}
                      </div>
                      {doc.sectionName ? (
                        <div class={resultSectionStyles}>
                          {highlightTerms(doc.sectionName, settledQuery)}
                        </div>
                      ) : null}
                      {excerpt ? (
                        <div class={resultExcerptStyles}>
                          {highlightTerms(excerpt, settledQuery)}
                        </div>
                      ) : null}
                    </div>
                    <span class={pageBadgeStyles} aria-label={`ページ ${doc.pageNum}`}>
                      p.{doc.pageNum}
                    </span>
                  </div>
                </button>
              );
            }}
          </For>
          <div ref={sentinelRef} aria-hidden="true" />
        </div>
      </div>
    </dialog>
  );
}

export default SearchDialog;
