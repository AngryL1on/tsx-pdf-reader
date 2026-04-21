export type CommentAuthorDto = {
  id: string;
  name: string;
};

/** Нормализованный прямоугольник подсветки (0–1 относительно обёртки страницы). */
export type HighlightRectDto = {
  relLeft: number;
  relTop: number;
  relWidth: number;
  relHeight: number;
};

export type CommentDto = {
  id: string;
  documentId: string;
  pageIndex: number;
  relX: number;
  relY: number;
  /** Если есть — рисуем точные подсветки; иначе используется только якорь (relX, relY). */
  highlightRects?: HighlightRectDto[];
  text: string;
  author: CommentAuthorDto;
  createdAt: string;
};

export type CreateCommentBody = {
  pageIndex: number;
  relX: number;
  relY: number;
  text: string;
  highlightRects?: HighlightRectDto[];
};
