export interface ManualPage {
  pageNum: number;
  image: string;
  title: string;
  sectionName: string | null;
  /** Text content - language depends on which file was loaded (pages-ja.json or pages-en.json) */
  content: string;
  /**
   * Pre-rendered HTML of `content`, produced at build time by
   * `scripts/pdf-md-to-html.js` (hljs highlight classes, tables wrapped in
   * `<div class="table-wrapper">`). The zfb island injects this via
   * `dangerouslySetInnerHTML` inside a `.zd-prose` container, shipping zero
   * markdown JS to the client. Optional because data predating the
   * md-to-html build step lacks it. The `.zd-prose` wrapper is NOT baked in.
   */
  contentHtml?: string;
  hasContent: boolean;
  tags?: string[];
}

/**
 * Derive thumbnail image path from full image path.
 * /oxi-one-mk2/pages/page-001.png → /oxi-one-mk2/thumbs/thumb-001.png
 */
export function getThumbImage(page: ManualPage): string {
  return page.image.replace('/pages/page-', '/thumbs/thumb-');
}

export interface ManualPagesData {
  metadata: {
    processedAt: string;
    /** Language code: 'ja' for Japanese, 'en' for English */
    language: 'ja' | 'en';
    /** Method used to generate this content */
    translationMethod?: string;
    extractionMethod?: string;
    imageFormat: string;
    imageDPI: number;
  };
  pages: ManualPage[];
}

export interface ManualManifest {
  title: string;
  brand: string;
  /** Catalog product slug in the takazudomodular repo; consumed by its /l-sync-manual-index, not by this viewer */
  productSlug?: string;
  version?: string;
  totalPages: number;
  contentPages?: number;
  lastUpdated?: string;
  /** Date when this translation was last updated (YYYYMMDD format) */
  updatedAt?: string;
  /**
   * Content hash of the search index JSON (e.g., SHA-1 hex digest).
   * Appended to the fetch URL as a ?v= query string so a deploy that changes
   * the index evicts cached copies held by long-lived tabs and CDNs.
   * Written at build time by the search-index script.
   */
  searchIndexVersion?: string;
  /**
   * Whether this manual has an English translation (pages-en.json).
   * Set by the PDF pipeline at manifest generation time. Defaults to false
   * when absent (e.g. manifests generated before this field was added are
   * backfilled via scripts/backfill-has-english.js).
   */
  hasEnglish?: boolean;
  source?: {
    filename: string;
    processedAt: string;
    imageDPI: number;
    imageFormat: string;
  };
}
