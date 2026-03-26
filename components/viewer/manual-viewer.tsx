'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ManualPage } from '@/lib/types/manual';
import { getPagePath } from '@/lib/manual-config';
import { useViewMode } from './view-mode-context';
import { PageViewer } from '@/components/page-viewer';
import { ScrollViewer, type ScrollViewerHandle } from './scroll-viewer';
import { SidebarThumbs } from './sidebar-thumbs';
import { ThumbsModal } from './thumbs-modal';

interface ManualViewerProps {
  page: ManualPage;
  allPages: ManualPage[];
  currentPage: number;
  totalPages: number;
  manualId: string;
}

export function ManualViewer({
  page,
  allPages,
  currentPage,
  totalPages,
  manualId,
}: ManualViewerProps) {
  const router = useRouter();
  const { viewMode, sidebarOpen, thumbsModalOpen, closeThumbsModal } = useViewMode();

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
      // Update URL without navigation so bookmarks/refresh land on the right page
      const newPath = `/manuals${getPagePath(manualId, pageNum)}`;
      window.history.replaceState(null, '', newPath);
    },
    [manualId],
  );

  return (
    <>
      <SidebarThumbs
        pages={allPages}
        currentPage={effectiveCurrentPage}
        totalPages={totalPages}
        manualId={manualId}
        isOpen={sidebarOpen}
        onPageSelect={handlePageSelect}
      />

      <ThumbsModal
        pages={allPages}
        currentPage={effectiveCurrentPage}
        isOpen={thumbsModalOpen}
        onClose={closeThumbsModal}
        onPageSelect={handlePageSelect}
      />

      {viewMode === 'scroll' ? (
        <ScrollViewer
          ref={scrollViewerRef}
          pages={allPages}
          initialPage={currentPage}
          totalPages={totalPages}
          manualId={manualId}
          onCurrentPageChange={handleScrollPageChange}
        />
      ) : (
        <PageViewer
          page={page}
          currentPage={currentPage}
          totalPages={totalPages}
          manualId={manualId}
        />
      )}
    </>
  );
}
