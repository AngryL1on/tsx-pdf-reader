import { Box, Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
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
    <Stack sx={{ height: '100%', bgcolor: 'background.default' }}>
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Button component={RouterLink} to="/" variant="text" color="inherit">
          ← К списку
        </Button>
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <PdfWorkspace documentId={documentId} />
      </Box>
    </Stack>
  );
};
