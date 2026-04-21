export type NormalizedPoint = {
  relX: number;
  relY: number;
};

export const toNormalizedPoint = (
  clientX: number,
  clientY: number,
  rect: DOMRectReadOnly,
): NormalizedPoint => {
  const relX = (clientX - rect.left) / rect.width;
  const relY = (clientY - rect.top) / rect.height;
  return {
    relX: clamp01(relX),
    relY: clamp01(relY),
  };
};

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
