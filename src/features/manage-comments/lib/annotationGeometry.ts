import type { HighlightRectDto } from '@/entities/comment/model/types';
import { clamp01 } from '@/shared/lib/coords';

export const relPointFromClient = (
  clientX: number,
  clientY: number,
  pageRect: DOMRectReadOnly,
) => ({
  x: clamp01((clientX - pageRect.left) / pageRect.width),
  y: clamp01((clientY - pageRect.top) / pageRect.height),
});

export const highlightRectFromRelBox = (
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): HighlightRectDto => {
  const relLeft = clamp01(Math.min(x0, x1));
  const relTop = clamp01(Math.min(y0, y1));
  const relRight = clamp01(Math.max(x0, x1));
  const relBottom = clamp01(Math.max(y0, y1));
  return {
    relLeft,
    relTop,
    relWidth: Math.max(relRight - relLeft, 0.008),
    relHeight: Math.max(relBottom - relTop, 0.008),
  };
};

export const centerFromDraft = (draft: {
  highlightRects?: HighlightRectDto[];
  relX: number;
  relY: number;
}) => {
  if (draft.highlightRects?.length) {
    const left = Math.min(...draft.highlightRects.map((r) => r.relLeft));
    const top = Math.min(...draft.highlightRects.map((r) => r.relTop));
    const right = Math.max(...draft.highlightRects.map((r) => r.relLeft + r.relWidth));
    return { relX: clamp01((left + right) / 2), relY: clamp01(top) };
  }
  return { relX: draft.relX, relY: draft.relY };
};

export const pinHighlightRect = (relX: number, relY: number): HighlightRectDto => ({
  relLeft: clamp01(relX - 0.01),
  relTop: clamp01(relY - 0.01),
  relWidth: 0.02,
  relHeight: 0.02,
});
