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
  /** Корневой комментарий привязан к странице; ответы наследуют якорь родителя. */
  pageIndex: number;
  relX: number;
  relY: number;
  highlightRects?: HighlightRectDto[];
  /** HEX-цвет подсветки на странице, например `#FFEB3B`. */
  highlightColor?: string;
  text: string;
  author: CommentAuthorDto;
  createdAt: string;
  resolved: boolean;
  /** Если задан — это ответ на корневой комментарий (один уровень, как в Instagram). */
  parentCommentId?: string;
};

export type CreateCommentBody = {
  text: string;
  parentCommentId?: string;
  pageIndex?: number;
  relX?: number;
  relY?: number;
  highlightRects?: HighlightRectDto[];
  highlightColor?: string;
};

export type UpdateCommentBody = {
  text?: string;
  resolved?: boolean;
};
