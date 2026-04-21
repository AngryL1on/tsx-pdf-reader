import type { HighlightRectDto } from '@/entities/comment/model/types';
import { clamp01 } from '@/shared/lib/coords';

type Box = { left: number; top: number; right: number; bottom: number };

const toBox = (r: DOMRectReadOnly): Box => ({
  left: r.left,
  top: r.top,
  right: r.right,
  bottom: r.bottom,
});

/**
 * Склеивает соседние client-rect'ы одной строки (pdf.js отдаёт много узких прямоугольников).
 */
export const mergePdfSelectionRects = (rects: DOMRectReadOnly[]): DOMRect[] => {
  const boxes = rects
    .map(toBox)
    .filter((r) => r.right - r.left > 0.5 && r.bottom - r.top > 0.5)
    .sort((a, b) => a.top - b.top || a.left - b.left);
  if (!boxes.length) {
    return [];
  }
  const merged: Box[] = [];
  let cur = { ...boxes[0] };
  for (let i = 1; i < boxes.length; i++) {
    const r = boxes[i];
    const overlapY = Math.min(cur.bottom, r.bottom) - Math.max(cur.top, r.top);
    const curH = cur.bottom - cur.top;
    const rH = r.bottom - r.top;
    const minH = Math.min(curH, rH);
    const sameBand = minH > 0 && overlapY / minH > 0.35;
    if (sameBand) {
      cur.left = Math.min(cur.left, r.left);
      cur.top = Math.min(cur.top, r.top);
      cur.right = Math.max(cur.right, r.right);
      cur.bottom = Math.max(cur.bottom, r.bottom);
    } else {
      merged.push(cur);
      cur = { ...r };
    }
  }
  merged.push(cur);
  return merged.map(
    (m) => new DOMRect(m.left, m.top, m.right - m.left, m.bottom - m.top),
  );
};

export const clientRectsToHighlightDtos = (
  rects: DOMRectReadOnly[],
  pageRect: DOMRectReadOnly,
): HighlightRectDto[] => {
  const pw = pageRect.width;
  const ph = pageRect.height;
  if (pw <= 0 || ph <= 0) {
    return [];
  }
  const out: HighlightRectDto[] = [];
  for (const r of rects) {
    const left = Math.max(r.left, pageRect.left);
    const top = Math.max(r.top, pageRect.top);
    const right = Math.min(r.right, pageRect.right);
    const bottom = Math.min(r.bottom, pageRect.bottom);
    if (right <= left || bottom <= top) {
      continue;
    }
    const w = right - left;
    const h = bottom - top;
    out.push({
      relLeft: clamp01((left - pageRect.left) / pw),
      relTop: clamp01((top - pageRect.top) / ph),
      relWidth: clamp01(w / pw),
      relHeight: clamp01(h / ph),
    });
  }
  return out;
};

export const centerFromHighlightRects = (
  rects: HighlightRectDto[],
): { relX: number; relY: number } => {
  if (!rects.length) {
    return { relX: 0, relY: 0 };
  }
  const left = Math.min(...rects.map((r) => r.relLeft));
  const top = Math.min(...rects.map((r) => r.relTop));
  const right = Math.max(...rects.map((r) => r.relLeft + r.relWidth));
  const bottom = Math.max(...rects.map((r) => r.relTop + r.relHeight));
  return {
    relX: clamp01((left + right) / 2),
    relY: clamp01((top + bottom) / 2),
  };
};

export const selectionIsInsideElement = (
  selection: Selection,
  element: HTMLElement,
): boolean => {
  if (!selection.rangeCount) {
    return false;
  }
  return element.contains(selection.getRangeAt(0).commonAncestorContainer);
};

export const findPresentationRectAtPoint = (
  clientX: number,
  clientY: number,
  surface: HTMLElement,
): DOMRect | null => {
  const stack = document.elementsFromPoint(clientX, clientY);
  for (const node of stack) {
    if (!(node instanceof HTMLElement)) {
      continue;
    }
    if (!surface.contains(node)) {
      continue;
    }
    if (node.getAttribute('role') === 'presentation') {
      return node.getBoundingClientRect();
    }
  }
  return null;
};
