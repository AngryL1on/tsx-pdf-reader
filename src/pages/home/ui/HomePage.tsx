import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useDocumentsQuery } from '@/entities/document';

export const HomePage = () => {
  const { data, isPending, isError, error } = useDocumentsQuery();

  return (
    <Box sx={{ minHeight: '100%', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="md">
        <Stack spacing={2}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Документы
          </Typography>
          <Typography color="text.secondary">
            Выберите PDF для просмотра и комментирования. Данные загружаются через REST (в режиме
            разработки ответы подменяются MSW).
          </Typography>
          {isPending && (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <CircularProgress size={22} />
              <Typography color="text.secondary">Загрузка списка…</Typography>
            </Stack>
          )}
          {isError && (
            <Typography color="error">
              Не удалось загрузить документы: {error.message}
            </Typography>
          )}
          <Stack spacing={1.5}>
            {data?.map((document) => (
              <Card key={document.id} variant="outlined">
                <CardActionArea component={RouterLink} to={`/documents/${document.id}`}>
                  <CardContent>
                    <Typography variant="h6">{document.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {document.id}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};
