export type ScrollMode = 'page' | 'vertical' | 'horizontal' | 'wrapped';

export type SpreadMode = 'none' | 'odd' | 'even';

export type CursorTool = 'select' | 'hand';

export type ScalePreset =
  | 'auto'
  | 'page-actual'
  | 'page-fit'
  | 'page-width'
  | 'custom';

export type SidePanelTab = 'thumbnails' | 'outline' | 'attachments' | 'none';

export type FindMatch = {
  pageIndex: number;
  matchIndex: number;
  /** Индексы в склеенном тексте страницы (getTextContent). */
  start: number;
  end: number;
};

export type OutlineItem = {
  title: string;
  pageIndex: number | null;
  items: OutlineItem[];
};

export type PdfMetadataInfo = {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
};

export type PdfDocumentProperties = {
  fileName: string;
  fileSizeBytes: number;
  numPages: number;
  pdfVersion: string;
  metadata: PdfMetadataInfo;
};
