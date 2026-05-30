export type {
  CommentAuthorDto,
  CommentDto,
  CreateCommentBody,
  HighlightRectDto,
  UpdateCommentBody,
} from './model/types';
export { commentApi } from './api/commentApi';
export { commentQueryKeys, useCommentsQuery } from './api/useCommentQueries';
