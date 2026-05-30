import type { CommentDto } from '@/entities/comment/model/types';

export type CommentThread = {
  root: CommentDto;
  replies: CommentDto[];
};

export const buildCommentThreads = (comments: CommentDto[]): CommentThread[] => {
  const roots = comments
    .filter((item) => !item.parentCommentId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const repliesByParent = new Map<string, CommentDto[]>();
  for (const item of comments) {
    if (!item.parentCommentId) {
      continue;
    }
    const list = repliesByParent.get(item.parentCommentId) ?? [];
    list.push(item);
    repliesByParent.set(item.parentCommentId, list);
  }

  return roots.map((root) => ({
    root,
    replies: (repliesByParent.get(root.id) ?? []).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    ),
  }));
};

export const countReplies = (comments: CommentDto[]) =>
  comments.filter((item) => item.parentCommentId).length;
