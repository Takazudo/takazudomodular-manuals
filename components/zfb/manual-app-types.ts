import type { ManualPage } from '@/lib/types/manual';
import type { Lang } from './lang';

export type ViewMode = 'page' | 'scroll';

/**
 * Minimal, fully-serializable manifest subset passed into the island via
 * `data-props`. Only scalar fields the interactive UI needs — never the page
 * collections. Only the initial page HTML travels in the separate page prop.
 */
export interface ManualAppManifest {
  title: string;
  brand: string;
  searchIndexVersion?: string;
}

/** JSON-safe initial page and chrome data transported by the island. */
export interface ManualAppProps {
  manualId: string;
  initialPageNum: number;
  initialPage: ManualPage;
  totalPages: number;
  availableLangs: readonly Lang[];
  manifest: ManualAppManifest;
}
