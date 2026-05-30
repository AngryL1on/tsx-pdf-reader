export type {
  DocumentAttachmentDto,
  EmbeddedPdfAttachment,
} from '@/entities/document-attachment/model/types';
export { attachmentApi } from '@/entities/document-attachment/api/attachmentApi';
export { openAttachmentInNewTab } from '@/entities/document-attachment/lib/openAttachment';
export {
  attachmentQueryKeys,
  useDocumentAttachmentsQuery,
} from '@/entities/document-attachment/api/useAttachmentQueries';
export {
  useDeleteAttachmentMutation,
  useUploadAttachmentMutation,
} from '@/entities/document-attachment/api/useAttachmentMutations';
