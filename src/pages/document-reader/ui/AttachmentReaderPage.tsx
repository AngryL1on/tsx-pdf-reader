import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { Link as RouterLink, Navigate, useLocation, useParams } from 'react-router-dom';
import {
  attachmentApi,
  useDocumentAttachmentsQuery,
} from '@/entities/document-attachment';
import { DocumentReaderShell } from '@/pages/document-reader/ui/DocumentReaderShell';
import { PdfWorkspace, type PdfWorkspacePdfSource } from '@/widgets/pdf-workspace';

export type EmbeddedAttachmentLocationState = {
  blobUrl: string;
  filename: string;
};

const isEmbeddedRoute = (attachmentId: string | undefined) => attachmentId === 'embedded';

export const AttachmentReaderPage = () => {
  const { documentId, attachmentId } = useParams();
  const location = useLocation();

  if (!documentId) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Документ не указан</Typography>
        <Button component={RouterLink} to="/">
          На главную
        </Button>
      </Box>
    );
  }

  const backTo = `/documents/${documentId}`;

  if (isEmbeddedRoute(attachmentId)) {
    const state = location.state as EmbeddedAttachmentLocationState | null;
    if (!state?.blobUrl) {
      return <Navigate to={backTo} replace />;
    }
    const pdfSource: PdfWorkspacePdfSource = {
      filename: state.filename || 'Вложение',
      pdfUrl: state.blobUrl,
    };
    return (
      <DocumentReaderShell backTo={backTo} backLabel="← К документу">
        <PdfWorkspace documentId={documentId} pdfSource={pdfSource} />
      </DocumentReaderShell>
    );
  }

  if (!attachmentId) {
    return <Navigate to={backTo} replace />;
  }

  const { data: attachments, isPending, isError } = useDocumentAttachmentsQuery(documentId);
  const attachment = attachments?.find((item) => item.id === attachmentId);

  if (isPending) {
    return (
      <DocumentReaderShell backTo={backTo} backLabel="← К документу">
        <Stack spacing={1} sx={{ py: 6, alignItems: 'center' }}>
          <CircularProgress />
          <Typography color="text.secondary">Загружаем вложение…</Typography>
        </Stack>
      </DocumentReaderShell>
    );
  }

  if (isError || !attachment) {
    return (
      <DocumentReaderShell backTo={backTo} backLabel="← К документу">
        <Box sx={{ p: 2 }}>
          <Typography color="error">Вложение не найдено</Typography>
        </Box>
      </DocumentReaderShell>
    );
  }

  const pdfSource: PdfWorkspacePdfSource = {
    filename: attachment.filename,
    pdfUrl: attachmentApi.fileUrl(documentId, attachment.id),
  };

  return (
    <DocumentReaderShell backTo={backTo} backLabel="← К документу">
      <PdfWorkspace documentId={documentId} pdfSource={pdfSource} />
    </DocumentReaderShell>
  );
};
