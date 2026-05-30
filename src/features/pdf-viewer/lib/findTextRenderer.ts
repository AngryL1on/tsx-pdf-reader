import type { CustomTextRenderer } from 'react-pdf/dist/shared/types.js';
import type { FindMatch } from '@/features/pdf-viewer/model/types';
import type { PageTextIndex } from '@/features/pdf-viewer/lib/pdfTextSearch';

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

type FindTextRendererArgs = {
  pageIndex: number;
  pageTextIndex: PageTextIndex;
  pageMatches: FindMatch[];
  activeMatch: FindMatch | null;
};

export const createFindTextRenderer = ({
  pageIndex,
  pageTextIndex,
  pageMatches,
  activeMatch,
}: FindTextRendererArgs): CustomTextRenderer => {
  const { itemOffsets } = pageTextIndex;

  return (textItem) => {
    if (textItem.pageIndex !== pageIndex || !textItem.str) {
      return textItem.str;
    }

    const itemStart = itemOffsets[textItem.itemIndex];
    if (itemStart === undefined || itemStart < 0) {
      return textItem.str;
    }

    const itemEnd = itemStart + textItem.str.length;
    const overlaps = pageMatches.filter(
      (match) => match.end > itemStart && match.start < itemEnd,
    );

    if (!overlaps.length) {
      return textItem.str;
    }

    const segments: Array<{ start: number; end: number; active: boolean }> = [];
    for (const match of overlaps) {
      const start = Math.max(0, match.start - itemStart);
      const end = Math.min(textItem.str.length, match.end - itemStart);
      const active =
        activeMatch !== null &&
        activeMatch.pageIndex === match.pageIndex &&
        activeMatch.matchIndex === match.matchIndex;
      segments.push({ start, end, active });
    }

    segments.sort((a, b) => a.start - b.start);

    let html = '';
    let cursor = 0;
    for (const segment of segments) {
      if (segment.start > cursor) {
        html += escapeHtml(textItem.str.slice(cursor, segment.start));
      }
      const sliceStart = Math.max(cursor, segment.start);
      if (segment.end > sliceStart) {
        const markClass = segment.active ? 'pdf-find-mark pdf-find-mark--active' : 'pdf-find-mark';
        html += `<mark class="${markClass}">${escapeHtml(textItem.str.slice(sliceStart, segment.end))}</mark>`;
        cursor = segment.end;
      }
    }
    if (cursor < textItem.str.length) {
      html += escapeHtml(textItem.str.slice(cursor));
    }

    return html;
  };
};
