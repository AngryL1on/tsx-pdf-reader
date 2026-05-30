import { Box, Button, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

type DocumentReaderShellProps = {
  backTo: string;
  backLabel: string;
  children: React.ReactNode;
};

export const DocumentReaderShell = ({ backTo, backLabel, children }: DocumentReaderShellProps) => (
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
      <Button component={RouterLink} to={backTo} variant="text" color="inherit">
        {backLabel}
      </Button>
    </Stack>
    <Box sx={{ flex: 1, minHeight: 0 }}>{children}</Box>
  </Stack>
);
