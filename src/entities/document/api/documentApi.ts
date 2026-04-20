import { createRestClient } from '@/shared/api';
import type { DocumentDto } from '@/entities/document/model/types';

const client = createRestClient();

export const documentApi = {
  list: () => client.get<DocumentDto[]>('/documents'),
  getById: (documentId: string) => client.get<DocumentDto>(`/documents/${documentId}`),
};
