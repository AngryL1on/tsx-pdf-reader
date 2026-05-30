import { createRestClient } from '@/shared/api';
import { getApiBaseUrl } from '@/shared/config/api';
import type { DocumentAttachmentDto } from '@/entities/document-attachment/model/types';

const client = createRestClient();

const joinUrl = (path: string) => {
  const base = getApiBaseUrl().replace(/\/+$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
};

export const attachmentApi = {
  listByDocument: (documentId: string) =>
    client.get<DocumentAttachmentDto[]>(`/documents/${documentId}/attachments`),

  upload: async (documentId: string, file: File): Promise<DocumentAttachmentDto> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(joinUrl(`/documents/${documentId}/attachments`), {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const message = await response.text().catch(() => response.statusText);
      throw new Error(message || `HTTP ${response.status}`);
    }
    return response.json() as Promise<DocumentAttachmentDto>;
  },

  remove: (documentId: string, attachmentId: string) =>
    client.delete(`/documents/${documentId}/attachments/${attachmentId}`),

  fileUrl: (documentId: string, attachmentId: string) =>
    joinUrl(`/documents/${documentId}/attachments/${attachmentId}/file`),
};
