import { useQuery } from '@tanstack/react-query';
import { commentApi } from '@/entities/comment/api/commentApi';

export const commentQueryKeys = {
  all: ['comments'] as const,
  byDocument: (documentId: string) => [...commentQueryKeys.all, documentId] as const,
};

export const useCommentsQuery = (documentId: string | undefined) =>
  useQuery({
    queryKey: commentQueryKeys.byDocument(documentId ?? ''),
    queryFn: () => commentApi.listByDocument(documentId!),
    enabled: Boolean(documentId),
  });
