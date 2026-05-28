'use client';

import { useCallback } from 'preact/hooks';
import { SearchTrigger } from './search-trigger';
import { getPagePath } from './routing';

export interface LandingSearchIslandProps {
  manualId: string;
  searchIndexVersion?: string;
}

/**
 * Island root for the landing-page search trigger. Uses a full-page navigation
 * (`location.href`) because the mega-island (which normally owns the client-side
 * `history.pushState` navigation) is not mounted on the landing page.
 */
export default function LandingSearchIsland({
  manualId,
  searchIndexVersion,
}: LandingSearchIslandProps) {
  const handleNavigate = useCallback(
    (pageNum: number) => {
      window.location.href = getPagePath(manualId, pageNum);
    },
    [manualId],
  );

  return (
    <SearchTrigger
      manualId={manualId}
      searchIndexVersion={searchIndexVersion}
      onNavigate={handleNavigate}
    />
  );
}
