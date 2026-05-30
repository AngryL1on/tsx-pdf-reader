import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import type { PdfDocumentProperties } from '@/features/pdf-viewer/model/types';

type DocumentPropertiesDialogProps = {
  open: boolean;
  properties: PdfDocumentProperties | null;
  onClose: () => void;
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const Row = ({ label, value }: { label: string; value: string | undefined }) => {
  if (!value) {
    return null;
  }
  return (
    <Stack direction="row" spacing={1}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  );
};

export const DocumentPropertiesDialog = ({
  open,
  properties,
  onClose,
}: DocumentPropertiesDialogProps) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle>Свойства документа</DialogTitle>
    <DialogContent>
      {properties ? (
        <Stack spacing={1} sx={{ mt: 1 }}>
          <Row label="Файл" value={properties.fileName} />
          <Row label="Размер" value={formatBytes(properties.fileSizeBytes)} />
          <Row label="Страниц" value={String(properties.numPages)} />
          <Row label="Версия PDF" value={properties.pdfVersion} />
          <Row label="Заголовок" value={properties.metadata.title} />
          <Row label="Автор" value={properties.metadata.author} />
          <Row label="Тема" value={properties.metadata.subject} />
          <Row label="Создан в" value={properties.metadata.creator} />
          <Row label="Производитель" value={properties.metadata.producer} />
          <Row label="Дата создания" value={properties.metadata.creationDate} />
          <Row label="Дата изменения" value={properties.metadata.modificationDate} />
        </Stack>
      ) : (
        <Typography color="text.secondary">Загрузка…</Typography>
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Закрыть</Button>
    </DialogActions>
  </Dialog>
);
