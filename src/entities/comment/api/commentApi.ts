import { createRestClient } from '@/shared/api';
import type {
  CommentDto,
  CreateCommentBody,
  UpdateCommentBody,
} from '@/entities/comment/model/types';

const client = createRestClient();

export const commentApi = {
  listByDocument: (documentId: string) =>
    client.get<CommentDto[]>(`/documents/${documentId}/comments`),
  create: (documentId: string, body: CreateCommentBody) =>
    client.post<CommentDto>(`/documents/${documentId}/comments`, body),
  update: (commentId: string, body: UpdateCommentBody) =>
    client.patch<CommentDto>(`/comments/${commentId}`, body),
  remove: (commentId: string) => client.delete(`/comments/${commentId}`),
};
