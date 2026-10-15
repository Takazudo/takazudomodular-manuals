'use client';

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
  const handleNavigate = (pageNum: number) => {
    window.location.href = getPagePath(manualId, pageNum);
  };

  return (
    <SearchTrigger
      manualId={manualId}
      searchIndexVersion={searchIndexVersion}
      onNavigate={handleNavigate}
    />
  );
}
