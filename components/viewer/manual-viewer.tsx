'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ctl from '@netlify/classnames-template-literals';
import type { ManualPage } from '@/lib/types/manual';
import { getPagePath } from '@/lib/manual-config';
import { useLanguage, type Lang } from '@/components/language/language-context';
import { useViewMode } from './view-mode-context';
import { PageViewer } from '@/components/page-viewer';
import { ScrollViewer, type ScrollViewerHandle } from './scroll-viewer';
import { SidebarThumbs } from './sidebar-thumbs';
import { ThumbsModal } from './thumbs-modal';

const outerStyles = ctl(`
  flex
  h-screen
  pt-[60px]
`);

interface ManualViewerProps {
  allPagesJa: ManualPage[];
  allPagesEn?: ManualPage[];
  currentPage: number;
  totalPages: number;
  manualId: string;
}

export function ManualViewer({
  allPagesJa,
  allPagesEn,
  currentPage,
  totalPages,
  manualId,
}: ManualViewerProps) {
  const router = useRouter();
  const { viewMode, sidebarOpen, thumbsModalOpen, closeThumbsModal } = useViewMode();
  const { lang } = useLanguage();

  // Resolve effective language and page list. Falls back to JA silently when
  // EN was requested but not available for this manual (the toggle UI already
  // prevents this path — this is a defensive guard).
  const effectiveLang: Lang = lang === 'en' && allPagesEn ? 'en' : 'ja';
  const effectivePages = useMemo(
    () => (effectiveLang === 'en' && allPagesEn ? allPagesEn : allPagesJa),
    [effectiveLang, allPagesJa, allPagesEn],
  );

  // Current page object in the active language (for page mode).
  const currentPageObject = useMemo(
    () => effectivePages.find((p) => p.pageNum === currentPage) ?? effectivePages[0],
    [effectivePages, currentPage],
  );

  // Track current page in scroll mode (local state, updated by ScrollViewer)
  const [scrollCurrentPage, setScrollCurrentPage] = useState(currentPage);
  const scrollViewerRef = useRef<ScrollViewerHandle>(null);

  // Effective current page depends on view mode
  const effectiveCurrentPage = viewMode === 'scroll' ? scrollCurrentPage : currentPage;

  // Navigate in page mode, scroll in scroll mode
  const handlePageSelect = useCallback(
    (pageNum: number) => {
      if (viewMode === 'scroll') {
        scrollViewerRef.current?.scrollToPage(pageNum);
      } else {
        router.push(getPagePath(manualId, pageNum));
      }
    },
    [viewMode, router, manualId],
  );

  // Update URL silently and track current page in scroll mode
  const handleScrollPageChange = useCallback(
    (pageNum: number) => {
      setScrollCurrentPage(pageNum);
      const newPath = `/manuals${getPagePath(manualId, pageNum)}`;
      window.history.replaceState(null, '', newPath);
    },
    [manualId],
  );

  return (
    <>
      <ThumbsModal
        pages={allPagesJa}
        currentPage={effectiveCurrentPage}
        isOpen={thumbsModalOpen}
        onClose={closeThumbsModal}
        onPageSelect={handlePageSelect}
      />

      <div className={outerStyles}>
        {sidebarOpen && (
          <SidebarThumbs
            pages={allPagesJa}
            currentPage={effectiveCurrentPage}
            onPageSelect={handlePageSelect}
          />
        )}

        <div className="flex-1 min-w-0">
          {viewMode === 'scroll' ? (
            <ScrollViewer
              ref={scrollViewerRef}
              pages={effectivePages}
              lang={effectiveLang}
              initialPage={currentPage}
              totalPages={totalPages}
              manualId={manualId}
              onCurrentPageChange={handleScrollPageChange}
            />
          ) : currentPageObject ? (
            <PageViewer
              page={currentPageObject}
              lang={effectiveLang}
              currentPage={currentPage}
              totalPages={totalPages}
              manualId={manualId}
            />
          ) : null}
        </div>
      </div>
    </>
  );
}
