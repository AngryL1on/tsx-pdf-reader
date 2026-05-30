import type { HighlightRectDto } from '@/entities/comment/model/types';

export type CommentTool = 'view' | 'text' | 'highlight' | 'pin';

export type PendingCommentDraft = {
  pageIndex: number;
  relX: number;
  relY: number;
  highlightRects?: HighlightRectDto[];
  highlightColor: string;
};
