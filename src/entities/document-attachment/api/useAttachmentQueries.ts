import { useQuery } from '@tanstack/react-query';
import { attachmentApi } from '@/entities/document-attachment/api/attachmentApi';

export const attachmentQueryKeys = {
  all: ['document-attachments'] as const,
  byDocument: (documentId: string) => [...attachmentQueryKeys.all, documentId] as const,
};

export const useDocumentAttachmentsQuery = (documentId: string | undefined) =>
  useQuery({
    queryKey: attachmentQueryKeys.byDocument(documentId ?? ''),
    queryFn: () => attachmentApi.listByDocument(documentId!),
    enabled: Boolean(documentId),
  });
