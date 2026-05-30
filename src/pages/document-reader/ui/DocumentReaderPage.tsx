import { Box, Button, Typography } from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { DocumentReaderShell } from '@/pages/document-reader/ui/DocumentReaderShell';
import { PdfWorkspace } from '@/widgets/pdf-workspace';

export const DocumentReaderPage = () => {
  const { documentId } = useParams();

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

  return (
    <DocumentReaderShell backTo="/" backLabel="← К списку">
      <PdfWorkspace documentId={documentId} />
    </DocumentReaderShell>
  );
};
