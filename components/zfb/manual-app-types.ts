import type { Lang } from './lang';

export type ViewMode = 'page' | 'scroll';

/**
 * Minimal, fully-serializable manifest subset passed into the island via
 * `data-props`. Only scalar fields the interactive UI needs — never the page
 * data or HTML (those would bloat the serialized props; see the island docs).
 */
export interface ManualAppManifest {
  title: string;
  brand: string;
  searchIndexVersion?: string;
}

/**
 * Props for the ManualApp mega-island. SCALARS ONLY — these are JSON-serialized
 * into the `data-props` attribute by `<Island>` and re-parsed on the client.
 * The SSR'd current-page body is passed as island CHILDREN, not props (see
 * `manual-app.tsx` for the capture-and-reinject hydration pattern).
 */
export interface ManualAppProps {
  manualId: string;
  initialPageNum: number;
  totalPages: number;
  availableLangs: readonly Lang[];
  /** Always "ja" at SSR (deterministic first paint); resolved post-mount. */
  initialLang: Lang;
  manifest: ManualAppManifest;
}
