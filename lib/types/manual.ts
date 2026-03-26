export interface ManualPage {
  pageNum: number;
  image: string;
  title: string;
  sectionName: string | null;
  /** Text content - language depends on which file was loaded (pages-ja.json or pages-en.json) */
  content: string;
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
  version?: string;
  totalPages: number;
  contentPages?: number;
  lastUpdated?: string;
  /** Date when this translation was last updated (YYYYMMDD format) */
  updatedAt?: string;
  source?: {
    filename: string;
    processedAt: string;
    imageDPI: number;
    imageFormat: string;
  };
}
