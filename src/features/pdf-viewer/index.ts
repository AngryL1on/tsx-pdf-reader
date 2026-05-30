export { CommentHighlightsLayer } from '@/features/pdf-viewer/ui/CommentHighlightsLayer';
export { DocumentPropertiesDialog } from '@/features/pdf-viewer/ui/DocumentPropertiesDialog';
export { PdfFindBar } from '@/features/pdf-viewer/ui/PdfFindBar';
export { PdfSidePanel } from '@/features/pdf-viewer/ui/PdfSidePanel';
export { PdfViewerMenu } from '@/features/pdf-viewer/ui/PdfViewerMenu';
export { PdfViewerToolbar } from '@/features/pdf-viewer/ui/PdfViewerToolbar';

export {
  DEFAULT_SCALE,
  DEFAULT_SCALE_VALUE,
  MAX_SCALE,
  MIN_SCALE,
  SCALE_PRESET_OPTIONS,
} from '@/features/pdf-viewer/model/constants';
export type {
  CursorTool,
  FindMatch,
  OutlineItem,
  PdfDocumentProperties,
  ScalePreset,
  ScrollMode,
  SidePanelTab,
  SpreadMode,
} from '@/features/pdf-viewer/model/types';

export { resolvePdfScale, scaleByDelta } from '@/features/pdf-viewer/lib/resolvePdfScale';
export type { ResolvedPdfScale } from '@/features/pdf-viewer/lib/resolvePdfScale';
export { loadPdfDocumentProperties } from '@/features/pdf-viewer/lib/pdfDocumentProperties';
export { downloadPdfBytes, printPdfBytes } from '@/features/pdf-viewer/lib/pdfActions';
export { loadPdfOutline } from '@/features/pdf-viewer/lib/pdfOutline';
export { createFindTextRenderer } from '@/features/pdf-viewer/lib/findTextRenderer';
export { searchPdfText } from '@/features/pdf-viewer/lib/pdfTextSearch';
export type { PageTextIndex, PdfTextSearchResult } from '@/features/pdf-viewer/lib/pdfTextSearch';
export { buildSpreadGroups, pagesForScrollPageMode } from '@/features/pdf-viewer/lib/pageLayout';

export { useHandPan } from '@/features/pdf-viewer/hooks/useHandPan';
export { usePageVisibility } from '@/features/pdf-viewer/hooks/usePageVisibility';
export { usePdfViewerShortcuts } from '@/features/pdf-viewer/hooks/usePdfViewerShortcuts';
