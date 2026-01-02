export interface ManualPage {
  pageNum: number;
  image: string;
  title: string;
  sectionName: string | null;
  translation: string;
  hasContent: boolean;
}

export interface ManualSection {
  name: string;
  pageRange: [number, number];
}

export interface ManualMetadata {
  title: string;
  sections: ManualSection[];
}

export interface ManualPart {
  part: string;
  pageRange: [number, number];
  pages: ManualPage[];
}

export interface PartInfo {
  part: string;
  pageRange: [number, number];
  file: string;
}

export interface ManualManifest {
  title: string;
  totalPages: number;
  parts: PartInfo[];
  _future_parts?: PartInfo[];
}
