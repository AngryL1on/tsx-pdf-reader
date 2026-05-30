import type { PDFDocumentProxy } from 'pdfjs-dist';
import {
  DEFAULT_SCALE_DELTA,
  MAX_AUTO_SCALE,
  MAX_SCALE,
  MIN_SCALE,
  SCROLLBAR_PADDING,
  VERTICAL_PADDING,
} from '@/features/pdf-viewer/model/constants';

export type ResolvedPdfScale = {
  /** Числовой scale для react-pdf Page `scale=`. */
  scale: number;
  pageWidth: number;
  pageHeight: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Логика масштаба из pdf.js PDFViewer.#setScale (web/pdf_viewer.js).
 */
export const resolvePdfScale = async ({
  pdf,
  pageNumber,
  scaleValue,
  containerWidth,
  containerHeight,
  rotation = 0,
  scrollHorizontal = false,
}: {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  scaleValue: string;
  containerWidth: number;
  containerHeight: number;
  rotation?: number;
  scrollHorizontal?: boolean;
}): Promise<ResolvedPdfScale> => {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1, rotation });

  let hPadding = SCROLLBAR_PADDING;
  let vPadding = VERTICAL_PADDING;
  if (scrollHorizontal) {
    [hPadding, vPadding] = [vPadding, hPadding];
  }

  const pageWidthScale = (containerWidth - hPadding) / viewport.width;
  const pageHeightScale = (containerHeight - vPadding) / viewport.height;

  const numericScale = Number.parseFloat(scaleValue);
  let scale: number;

  if (numericScale > 0) {
    scale = clamp(numericScale, MIN_SCALE, MAX_SCALE);
  } else {
    switch (scaleValue) {
      case 'page-actual':
        scale = 1;
        break;
      case 'page-width':
        scale = clamp(pageWidthScale, MIN_SCALE, MAX_SCALE);
        break;
      case 'page-height':
        scale = clamp(pageHeightScale, MIN_SCALE, MAX_SCALE);
        break;
      case 'page-fit':
        scale = clamp(Math.min(pageWidthScale, pageHeightScale), MIN_SCALE, MAX_SCALE);
        break;
      case 'auto': {
        const isPortrait = viewport.width <= viewport.height;
        const horizontalScale = isPortrait
          ? pageWidthScale
          : Math.min(pageHeightScale, pageWidthScale);
        scale = clamp(Math.min(MAX_AUTO_SCALE, horizontalScale), MIN_SCALE, MAX_SCALE);
        break;
      }
      default:
        scale = clamp(pageWidthScale, MIN_SCALE, MAX_SCALE);
    }
  }

  return {
    scale,
    pageWidth: viewport.width * scale,
    pageHeight: viewport.height * scale,
  };
};

/** Увеличение/уменьшение как pdf.js updateScale с DEFAULT_SCALE_DELTA. */
export const scaleByDelta = (currentScale: number, steps: number) => {
  const delta = steps > 0 ? DEFAULT_SCALE_DELTA : 1 / DEFAULT_SCALE_DELTA;
  const round = steps > 0 ? Math.ceil : Math.floor;
  let newScale = currentScale;
  let remaining = Math.abs(steps);
  while (remaining > 0) {
    newScale = round(newScale * delta * 100) / 100;
    remaining -= 1;
  }
  return clamp(newScale, MIN_SCALE, MAX_SCALE);
};
