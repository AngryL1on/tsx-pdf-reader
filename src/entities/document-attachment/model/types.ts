export type DocumentAttachmentDto = {
  id: string;
  documentId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

export type EmbeddedPdfAttachment = {
  key: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  blobUrl: string;
};
