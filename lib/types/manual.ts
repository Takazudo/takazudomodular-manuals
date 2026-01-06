export interface ManualPage {
  pageNum: number;
  image: string;
  title: string;
  sectionName: string | null;
  translation: string;
  hasContent: boolean;
  tags?: string[];
}

export interface ManualPart {
  part: string;
  pageRange: [number, number];
  totalPages?: number;
  metadata?: {
    processedAt: string;
    translationMethod: string;
    imageFormat: string;
    imageDPI: number;
  };
  pages: ManualPage[];
}

export interface PartInfo {
  part: string;
  pageRange: [number, number];
  file: string;
  sections?: string[];
  totalPages?: number;
  contentPages?: number;
}

export interface ManualManifest {
  title: string;
  brand: string;
  version?: string;
  totalPages: number;
  contentPages?: number;
  lastUpdated?: string;
  source?: {
    filename: string;
    processedAt: string;
    imageDPI: number;
    imageFormat: string;
  };
  parts: PartInfo[];
  _future_parts?: PartInfo[];
}
