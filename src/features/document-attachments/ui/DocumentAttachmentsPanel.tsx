import {
  Add as AddIcon,
  Delete as DeleteIcon,
  OpenInNew as OpenInNewIcon,
  PictureAsPdf as PictureAsPdfIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useDeleteAttachmentMutation,
  useDocumentAttachmentsQuery,
  useUploadAttachmentMutation,
  type DocumentAttachmentDto,
  type EmbeddedPdfAttachment,
} from '@/entities/document-attachment';
import type { EmbeddedAttachmentLocationState } from '@/pages/document-reader';
import { formatFileSize } from '@/features/document-attachments/lib/formatFileSize';

const ACCEPTED_EXTENSIONS = ['.pdf'];
const MAX_FILE_BYTES = 25 * 1024 * 1024;

const isPdfFile = (file: File) =>
  file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

type DocumentAttachmentsPanelProps = {
  documentId: string;
  embedded: EmbeddedPdfAttachment[];
  embeddedLoading: boolean;
};

export const DocumentAttachmentsPanel = ({
  documentId,
  embedded,
  embeddedLoading,
}: DocumentAttachmentsPanelProps) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const { data: uploaded = [], isPending: uploadedLoading } = useDocumentAttachmentsQuery(
    documentId,
  );
  const uploadMutation = useUploadAttachmentMutation(documentId);
  const deleteMutation = useDeleteAttachmentMutation(documentId);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    setLocalError(null);
    uploadMutation.reset();
    if (!isPdfFile(file)) {
      setLocalError('Можно прикреплять только PDF');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setLocalError('Файл больше 25 МБ');
      return;
    }
    void uploadMutation.mutateAsync(file).catch(() => undefined);
  };

  const handleOpenUploaded = (item: DocumentAttachmentDto) => {
    navigate(`/documents/${documentId}/attachments/${item.id}`);
  };

  const handleOpenEmbedded = (item: EmbeddedPdfAttachment) => {
    const state: EmbeddedAttachmentLocationState = {
      blobUrl: item.blobUrl,
      filename: item.filename,
    };
    navigate(`/documents/${documentId}/attachments/embedded`, { state });
  };

  const loading = embeddedLoading || uploadedLoading;
  const empty = !loading && embedded.length === 0 && uploaded.length === 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept={ACCEPTED_EXTENSIONS.join(',')}
        onChange={handleFileChange}
      />
      <Button
        size="small"
        variant="outlined"
        startIcon={uploadMutation.isPending ? <CircularProgress size={16} /> : <AddIcon />}
        disabled={uploadMutation.isPending}
        onClick={() => fileInputRef.current?.click()}
        fullWidth
      >
        Прикрепить PDF
      </Button>

      {(localError || uploadMutation.isError) && (
        <Alert severity="error" sx={{ py: 0 }}>
          {localError ??
            ((uploadMutation.error as Error).message || 'Не удалось загрузить файл')}
        </Alert>
      )}

      {loading && (
        <Typography variant="body2" color="text.secondary" sx={{ px: 0.5 }}>
          Загрузка вложений…
        </Typography>
      )}

      {empty && (
        <Typography variant="body2" color="text.secondary" sx={{ px: 0.5 }}>
          Вложений нет. Прикрепите PDF к документу.
        </Typography>
      )}

      {uploaded.length > 0 && (
        <>
          <Typography variant="caption" color="text.secondary" sx={{ px: 0.5 }}>
            Прикреплённые
          </Typography>
          <List dense disablePadding>
            {uploaded.map((item) => (
              <ListItem
                key={item.id}
                secondaryAction={
                  <Box>
                    <Tooltip title="Открыть в режиме чтения">
                      <IconButton size="small" onClick={() => handleOpenUploaded(item)}>
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Удалить">
                      <span>
                        <IconButton
                          size="small"
                          disabled={deleteMutation.isPending}
                          onClick={() => void deleteMutation.mutateAsync(item.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                }
                sx={{ pr: 10 }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <PictureAsPdfIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText
                  primary={item.filename}
                  secondary={formatFileSize(item.sizeBytes)}
                  slotProps={{ primary: { noWrap: true, title: item.filename } }}
                />
              </ListItem>
            ))}
          </List>
        </>
      )}

      {embedded.length > 0 && (
        <>
          <Typography variant="caption" color="text.secondary" sx={{ px: 0.5, pt: 0.5 }}>
            Встроенные в PDF
          </Typography>
          <List dense disablePadding>
            {embedded.map((item) => (
              <ListItem
                key={item.key}
                secondaryAction={
                  <Tooltip title="Открыть в режиме чтения">
                    <IconButton size="small" onClick={() => handleOpenEmbedded(item)}>
                      <OpenInNewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                }
                sx={{ pr: 6 }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <PictureAsPdfIcon fontSize="small" color="action" />
                </ListItemIcon>
                <ListItemText
                  primary={item.filename}
                  secondary={formatFileSize(item.sizeBytes)}
                  slotProps={{ primary: { noWrap: true, title: item.filename } }}
                />
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Box>
  );
};
