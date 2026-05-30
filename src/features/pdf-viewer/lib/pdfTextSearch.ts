import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import type { FindMatch } from '@/features/pdf-viewer/model/types';

export type PageTextIndex = {
  /** Смещение символа в склеенном тексте страницы для каждого TextItem. */
  itemOffsets: number[];
  text: string;
};

export type PdfTextSearchResult = {
  matches: FindMatch[];
  pageIndices: Map<number, PageTextIndex>;
};

const isTextItem = (item: unknown): item is TextItem =>
  typeof item === 'object' && item !== null && 'str' in item;

export const buildPageTextIndex = (items: unknown[]): PageTextIndex => {
  const itemOffsets = Array.from({ length: items.length }, () => -1);
  let offset = 0;
  const parts: string[] = [];
  for (let index = 0; index < items.length; index += 1) {
    const raw = items[index];
    if (!isTextItem(raw) || !raw.str) {
      continue;
    }
    itemOffsets[index] = offset;
    parts.push(raw.str);
    offset += raw.str.length;
  }
  return { itemOffsets, text: parts.join('') };
};

const searchPage = async (
  page: PDFPageProxy,
  pageIndex: number,
  needle: string,
  caseSensitive: boolean,
): Promise<{ matches: FindMatch[]; index: PageTextIndex }> => {
  const textContent = await page.getTextContent();
  const index = buildPageTextIndex(textContent.items);
  const matches: FindMatch[] = [];

  if (!index.text || !needle) {
    return { matches, index };
  }

  const haystack = caseSensitive ? index.text : index.text.toLowerCase();
  let from = 0;
  let matchIndex = 0;

  while (from < haystack.length) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) {
      break;
    }
    matches.push({
      pageIndex,
      matchIndex,
      start: at,
      end: at + needle.length,
    });
    matchIndex += 1;
    from = at + needle.length;
  }

  return { matches, index };
};

export const searchPdfText = async (
  pdf: PDFDocumentProxy,
  query: string,
  caseSensitive = false,
): Promise<PdfTextSearchResult> => {
  const trimmed = query.trim();
  if (!trimmed) {
    return { matches: [], pageIndices: new Map() };
  }
  const needle = caseSensitive ? trimmed : trimmed.toLowerCase();

  const pageResults = await Promise.all(
    Array.from({ length: pdf.numPages }, (_, index) =>
      pdf.getPage(index + 1).then((page) => searchPage(page, index, needle, caseSensitive)),
    ),
  );

  const pageIndices = new Map<number, PageTextIndex>();
  const matches: FindMatch[] = [];

  pageResults.forEach((result, pageIndex) => {
    pageIndices.set(pageIndex, result.index);
    matches.push(...result.matches);
  });

  return { matches, pageIndices };
};
