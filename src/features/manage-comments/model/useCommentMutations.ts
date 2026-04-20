import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commentApi, commentQueryKeys, type CreateCommentBody } from '@/entities/comment';

export const useCreateCommentMutation = (documentId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCommentBody) => commentApi.create(documentId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: commentQueryKeys.byDocument(documentId) });
    },
  });
};

export const useDeleteCommentMutation = (documentId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => commentApi.remove(commentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: commentQueryKeys.byDocument(documentId) });
    },
  });
};
