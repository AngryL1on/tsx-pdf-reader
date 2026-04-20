import { useQuery } from '@tanstack/react-query';
import { documentApi } from '@/entities/document/api/documentApi';

export const documentQueryKeys = {
  all: ['documents'] as const,
  list: () => [...documentQueryKeys.all, 'list'] as const,
  detail: (id: string) => [...documentQueryKeys.all, 'detail', id] as const,
};

export const useDocumentsQuery = () =>
  useQuery({
    queryKey: documentQueryKeys.list(),
    queryFn: () => documentApi.list(),
  });

export const useDocumentQuery = (documentId: string | undefined) =>
  useQuery({
    queryKey: documentQueryKeys.detail(documentId ?? ''),
    queryFn: () => documentApi.getById(documentId!),
    enabled: Boolean(documentId),
  });
