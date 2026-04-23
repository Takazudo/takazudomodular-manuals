'use client';

import {
  type ChangeEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import MiniSearch, { type SearchResult } from 'minisearch';
import ctl from '@netlify/classnames-template-literals';
import { useRouter } from 'next/navigation';
import { withBasePath } from '@/lib/asset-url';
import { getPagePath } from '@/lib/manual-config';
import { highlightTerms, makeExcerpt } from './highlight';

export interface SearchDialogProps {
  manualId: string;
  open: boolean;
  onClose: () => void;
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

// Module-level cache: one MiniSearch instance per manualId, shared across
// mount/unmount cycles and across sibling dialogs.
const indexCache = new Map<string, MiniSearch<SearchDoc>>();

/**
 * Test-only hook: drop the cached MiniSearch instance(s). Real application
 * code never calls this — the cache intentionally survives open/close cycles.
 */
export function __clearSearchIndexCacheForTests(): void {
  indexCache.clear();
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

const dialogStyles = ctl(`
  w-full h-full
  sm:w-[80vw] sm:h-[80vh] sm:max-w-[80rem]
  sm:mx-auto sm:my-[10vh]
  sm:rounded-lg
  bg-zd-black
  text-zd-white
  border border-zd-gray4
  p-0
  m-0
`);

const rootStyles = ctl(`
  flex flex-col
  w-full h-full
  overflow-hidden
`);

const headerStyles = ctl(`
  flex items-center gap-hgap-xs
  px-hgap-sm py-vgap-xs
  border-b border-zd-gray4
`);

const searchIconStyles = ctl(`
  flex-none
  text-zd-gray6
`);

const inputStyles = ctl(`
  flex-1
  bg-zd-black text-zd-white
  border-0
  outline-none
  text-lg
  py-vgap-xs
  placeholder:text-zd-gray6
`);

const hitCountStyles = ctl(`
  hidden sm:block
  flex-none
  text-sm text-zd-gray6
`);

const closeButtonStyles = ctl(`
  flex-none
  flex items-center justify-center
  w-[32px] h-[32px]
  rounded-md
  text-zd-gray6
  hover:text-zd-white hover:bg-zd-gray3
  focus:outline-2 focus:outline-zd-outline
`);

const resultsListStyles = ctl(`
  flex-1
  overflow-y-auto
  overscroll-contain
`);

const resultItemStyles = ctl(`
  w-full text-left
  block
  px-hgap-sm py-vgap-xs
  border-b border-zd-gray4
  hover:bg-zd-gray2
  focus:outline-2 focus:outline-zd-outline
  focus:bg-zd-gray2
  cursor-pointer
`);

const resultRowStyles = ctl(`
  flex items-start gap-hgap-xs
`);

const resultTextStyles = ctl(`
  flex-1 min-w-0
`);

const resultTitleStyles = ctl(`
  font-semibold text-zd-white
`);

const resultSectionStyles = ctl(`
  text-sm text-zd-gray6
`);

const resultExcerptStyles = ctl(`
  text-sm text-zd-gray7
  mt-vgap-2xs
`);

const pageBadgeStyles = ctl(`
  flex-none
  text-xs text-zd-gray6
  px-hgap-xs py-vgap-2xs
  border border-zd-gray4
  rounded-sm
`);

const statusStyles = ctl(`
  px-hgap-sm py-vgap-sm
  text-zd-gray6
  text-sm
`);

const errorButtonStyles = ctl(`
  mt-vgap-xs
  inline-flex items-center
  px-hgap-xs py-vgap-2xs
  border border-zd-gray4
  rounded-md
  text-zd-white
  hover:bg-zd-gray2
  focus:outline-2 focus:outline-zd-outline
`);

// ─── Component ──────────────────────────────────────────────────────────────

export function SearchDialog({ manualId, open, onClose }: SearchDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [indexInstance, setIndexInstance] = useState<MiniSearch<SearchDoc> | null>(
    () => indexCache.get(manualId) ?? null,
  );

  // ── Dialog open/close (imperative) ───────────────────────────────────────
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      // React 19 StrictMode double-invoke safety.
      if (!dialog.open) {
        dialog.showModal();
      }
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [open]);

  // ── Bridge native close event (ESC, backdrop click) to onClose ───────────
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => onClose();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  // ── Lazy-load the search index on first open ─────────────────────────────
  const loadIndex = useCallback(async () => {
    const cached = indexCache.get(manualId);
    if (cached) {
      setIndexInstance(cached);
      setLoadState('ready');
      return;
    }

    setLoadState('loading');
    try {
      const url = withBasePath(`/${manualId}/data/search-index.json`);
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch search index: ${res.status}`);
      }
      const docs = (await res.json()) as SearchDoc[];
      const instance = createMiniSearch();
      instance.addAll(docs);
      indexCache.set(manualId, instance);
      setIndexInstance(instance);
      setLoadState('ready');
    } catch (err) {
      console.error('[SearchDialog] index load failed', err);
      setLoadState('error');
    }
  }, [manualId]);

  useEffect(() => {
    if (!open) return;
    if (loadState === 'idle') {
      void loadIndex();
    }
  }, [open, loadState, loadIndex]);

  // ── Debounce query input ─────────────────────────────────────────────────
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedQuery(query);
    }, DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);

  // ── Run search when debouncedQuery / index changes ───────────────────────
  useEffect(() => {
    if (!indexInstance) {
      setResults([]);
      return;
    }
    const q = debouncedQuery.trim();
    if (!q) {
      setResults([]);
      return;
    }
    const hits = indexInstance.search(q);
    setResults(hits);
    setVisibleCount(BATCH_SIZE);
    // Reset scroll to top when the query changes.
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [debouncedQuery, indexInstance]);

  // ── Infinite scroll via IntersectionObserver ─────────────────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const list = listRef.current;
    if (!sentinel || !list) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisibleCount((prev) => {
              if (prev >= results.length) return prev;
              return Math.min(prev + BATCH_SIZE, results.length);
            });
          }
        }
      },
      { root: list, rootMargin: '200px 0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [results.length]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const handleCloseClick = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  const handleResultActivate = useCallback(
    (pageNum: number) => {
      router.push(getPagePath(manualId, pageNum));
      onClose();
    },
    [router, manualId, onClose],
  );

  const handleResultKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, pageNum: number) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleResultActivate(pageNum);
      }
    },
    [handleResultActivate],
  );

  const handleRetry = useCallback(() => {
    setLoadState('idle');
  }, []);

  // ── Derived render state ─────────────────────────────────────────────────
  const visibleResults = useMemo(() => results.slice(0, visibleCount), [results, visibleCount]);

  const hasQuery = debouncedQuery.trim().length > 0;
  const hitCountLabel = `${results.length}件の結果`;

  return (
    <dialog ref={dialogRef} className={dialogStyles} aria-label="検索" data-search-dialog>
      <div className={rootStyles}>
        {/* Header row ------------------------------------------------------ */}
        <div className={headerStyles}>
          <span className={searchIconStyles} aria-hidden="true">
            🔍
          </span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={handleInputChange}
            placeholder="検索キーワードを入力..."
            className={inputStyles}
            aria-label="検索キーワード"
            autoComplete="off"
            spellCheck={false}
          />
          {hasQuery && loadState === 'ready' ? (
            <span className={hitCountStyles} aria-hidden="true">
              {hitCountLabel}
            </span>
          ) : null}
          <button
            type="button"
            onClick={handleCloseClick}
            className={closeButtonStyles}
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        {/* Results region -------------------------------------------------- */}
        <div ref={listRef} className={resultsListStyles} aria-live="polite">
          {loadState === 'loading' ? (
            <div className={statusStyles}>検索インデックスを読み込み中...</div>
          ) : null}

          {loadState === 'error' ? (
            <div className={statusStyles}>
              <p>検索インデックスを読み込めませんでした</p>
              <button type="button" onClick={handleRetry} className={errorButtonStyles}>
                再試行
              </button>
            </div>
          ) : null}

          {loadState === 'ready' && !hasQuery ? (
            <div className={statusStyles}>検索キーワードを入力...</div>
          ) : null}

          {loadState === 'ready' && hasQuery && results.length === 0 ? (
            <div className={statusStyles}>該当なし</div>
          ) : null}

          {loadState === 'ready' && hasQuery && results.length > 0 ? (
            <>
              <span className="sr-only">{hitCountLabel}</span>
              {visibleResults.map((hit) => {
                const doc = hit as unknown as SearchResult & SearchDoc;
                const excerpt = makeExcerpt(doc.body ?? '', debouncedQuery);
                return (
                  <button
                    key={String(hit.id)}
                    type="button"
                    className={resultItemStyles}
                    onClick={() => handleResultActivate(doc.pageNum)}
                    onKeyDown={(e) => handleResultKeyDown(e, doc.pageNum)}
                  >
                    <div className={resultRowStyles}>
                      <div className={resultTextStyles}>
                        <div className={resultTitleStyles}>
                          {highlightTerms(doc.title ?? '', debouncedQuery)}
                        </div>
                        {doc.sectionName ? (
                          <div className={resultSectionStyles}>
                            {highlightTerms(doc.sectionName, debouncedQuery)}
                          </div>
                        ) : null}
                        {excerpt ? (
                          <div className={resultExcerptStyles}>
                            {highlightTerms(excerpt, debouncedQuery)}
                          </div>
                        ) : null}
                      </div>
                      <span className={pageBadgeStyles} aria-label={`ページ ${doc.pageNum}`}>
                        p.{doc.pageNum}
                      </span>
                    </div>
                  </button>
                );
              })}
              <div ref={sentinelRef} aria-hidden="true" />
            </>
          ) : null}
        </div>
      </div>
    </dialog>
  );
}

export default SearchDialog;
