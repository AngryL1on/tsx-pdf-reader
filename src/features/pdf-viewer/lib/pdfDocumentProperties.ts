import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { PdfDocumentProperties, PdfMetadataInfo } from '@/features/pdf-viewer/model/types';

const formatPdfDate = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || !value) {
    return undefined;
  }
  const cleaned = value.replace(/^D:/, '').replace(/'/g, '');
  const iso = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
};

const pickMetadata = (info: Record<string, unknown> | undefined): PdfMetadataInfo => ({
  title: typeof info?.Title === 'string' ? info.Title : undefined,
  author: typeof info?.Author === 'string' ? info.Author : undefined,
  subject: typeof info?.Subject === 'string' ? info.Subject : undefined,
  creator: typeof info?.Creator === 'string' ? info.Creator : undefined,
  producer: typeof info?.Producer === 'string' ? info.Producer : undefined,
  creationDate: formatPdfDate(info?.CreationDate),
  modificationDate: formatPdfDate(info?.ModDate),
});

export const loadPdfDocumentProperties = async ({
  pdf,
  fileName,
  fileSizeBytes,
}: {
  pdf: PDFDocumentProxy;
  fileName: string;
  fileSizeBytes: number;
}): Promise<PdfDocumentProperties> => {
  const meta = await pdf.getMetadata();
  const info = (meta.info ?? {}) as Record<string, unknown>;
  const pdfVersion =
    typeof info.PDFFormatVersion === 'string'
      ? info.PDFFormatVersion
      : typeof info.pdfVersion === 'string'
        ? info.pdfVersion
        : '—';
  return {
    fileName,
    fileSizeBytes,
    numPages: pdf.numPages,
    pdfVersion,
    metadata: pickMetadata(info),
  };
};
