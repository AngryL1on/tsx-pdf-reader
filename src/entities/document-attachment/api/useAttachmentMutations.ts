import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attachmentApi } from '@/entities/document-attachment/api/attachmentApi';
import { attachmentQueryKeys } from '@/entities/document-attachment/api/useAttachmentQueries';

export const useUploadAttachmentMutation = (documentId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => attachmentApi.upload(documentId, file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: attachmentQueryKeys.byDocument(documentId),
      });
    },
  });
};

export const useDeleteAttachmentMutation = (documentId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) => attachmentApi.remove(documentId, attachmentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: attachmentQueryKeys.byDocument(documentId),
      });
    },
  });
};
