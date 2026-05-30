import type { SpreadMode } from '@/features/pdf-viewer/model/types';

/** Группы номеров страниц (1-based) для режима разворота, как в PDF.js. */
export const buildSpreadGroups = (numPages: number, spread: SpreadMode): number[][] => {
  if (numPages <= 0) {
    return [];
  }
  if (spread === 'none') {
    return Array.from({ length: numPages }, (_, index) => [index + 1]);
  }
  if (spread === 'odd') {
    const groups: number[][] = [[1]];
    for (let page = 2; page <= numPages; page += 2) {
      groups.push(page + 1 <= numPages ? [page, page + 1] : [page]);
    }
    return groups;
  }
  const groups: number[][] = [[1]];
  for (let page = 2; page <= numPages; page += 2) {
    groups.push(page + 1 <= numPages ? [page, page + 1] : [page]);
  }
  return groups;
};

/** Номера страниц, видимые в текущем режиме «постраничной» прокрутки. */
export const pagesForScrollPageMode = (
  pageNumber: number,
  numPages: number,
  spread: SpreadMode,
): number[] => {
  const groups = buildSpreadGroups(numPages, spread);
  const group = groups.find((items) => items.includes(pageNumber)) ?? [pageNumber];
  return group;
};
