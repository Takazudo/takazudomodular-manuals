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
  totalPages: number;
  metadata: ManualMetadata;
  pages: ManualPage[];
}
