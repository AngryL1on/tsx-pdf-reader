import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { OutlineItem } from '@/features/pdf-viewer/model/types';

type RawOutline = {
  title: string;
  dest?: string | unknown[] | null;
  url?: string | null;
  items?: RawOutline[];
};

const resolvePageIndex = async (
  pdf: PDFDocumentProxy,
  dest: string | unknown[] | null | undefined,
): Promise<number | null> => {
  if (!dest) {
    return null;
  }
  try {
    let explicitDest: unknown = dest;
    if (typeof dest === 'string') {
      explicitDest = await pdf.getDestination(dest);
    }
    if (!Array.isArray(explicitDest) || explicitDest[0] == null) {
      return null;
    }
    const pageIndex = await pdf.getPageIndex(
      explicitDest[0] as Parameters<PDFDocumentProxy['getPageIndex']>[0],
    );
    return pageIndex;
  } catch {
    return null;
  }
};

const mapOutline = async (
  pdf: PDFDocumentProxy,
  items: RawOutline[] | null | undefined,
): Promise<OutlineItem[]> => {
  if (!items?.length) {
    return [];
  }
  const result: OutlineItem[] = [];
  for (const item of items) {
    const pageIndex = await resolvePageIndex(pdf, item.dest);
    result.push({
      title: item.title || 'Без названия',
      pageIndex,
      items: await mapOutline(pdf, item.items),
    });
  }
  return result;
};

export const loadPdfOutline = async (pdf: PDFDocumentProxy): Promise<OutlineItem[]> => {
  const raw = (await pdf.getOutline()) as RawOutline[] | null;
  return mapOutline(pdf, raw);
};
