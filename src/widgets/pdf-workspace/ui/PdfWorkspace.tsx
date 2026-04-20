import { DeleteOutlined as DeleteOutlineIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  Pagination,
  Paper,
  Stack,
  ToggleButton,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useMemo, useState, type MouseEventHandler } from 'react';
import { Document, Page } from 'react-pdf';
import type { CommentDto } from '@/entities/comment';
import { useCommentsQuery } from '@/entities/comment';
import { useDocumentQuery } from '@/entities/document';
import { AddCommentDialog, useDeleteCommentMutation } from '@/features/manage-comments';
import { toNormalizedPoint } from '@/shared/lib/coords';
import { useContainerWidth } from '@/shared/lib/useContainerWidth';
import { usePdfFileData } from '@/shared/lib/usePdfFileData';

type PdfWorkspaceProps = {
  documentId: string;
};

/** Доля страницы: «полоска» как выделение текста вокруг якоря (relX, relY). */
const HIGHLIGHT_WIDTH_PCT = 34;
const HIGHLIGHT_HEIGHT_PCT = 2.35;

const sortComments = (items: CommentDto[]) =>
  [...items].sort((a, b) => {
    if (a.pageIndex !== b.pageIndex) {
      return a.pageIndex - b.pageIndex;
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

export const PdfWorkspace = ({ documentId }: PdfWorkspaceProps) => {
  const { ref: canvasRef, width: containerWidth } = useContainerWidth<HTMLDivElement>();
  const { data: document, isPending, isError, error } = useDocumentQuery(documentId);
  const { data: comments = [] } = useCommentsQuery(documentId);
  const deleteMutation = useDeleteCommentMutation(documentId);
  const pdfFile = usePdfFileData(document?.pdfUrl);

  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [placementMode, setPlacementMode] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<{ pageIndex: number; relX: number; relY: number } | null>(
    null,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogKey, setDialogKey] = useState(0);

  const sortedComments = useMemo(() => sortComments(comments), [comments]);
  const pageComments = useMemo(
    () => sortedComments.filter((item) => item.pageIndex === pageNumber - 1),
    [sortedComments, pageNumber],
  );

  const pageWidth = Math.max(280, Math.min(containerWidth - 16, 960));

  if (isPending) {
    return (
      <Stack spacing={1} sx={{ height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
        <Typography color="text.secondary">Загрузка документа…</Typography>
      </Stack>
    );
  }

  if (isError || !document) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          Не удалось загрузить метаданные: {error?.message ?? 'неизвестная ошибка'}
        </Alert>
      </Box>
    );
  }

  const handlePageClick: MouseEventHandler<HTMLDivElement> = (event) => {
    if (!placementMode) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const { relX, relY } = toNormalizedPoint(event.clientX, event.clientY, rect);
    setDraft({ pageIndex: pageNumber - 1, relX, relY });
    setDialogKey((value) => value + 1);
    setDialogOpen(true);
    setPlacementMode(false);
  };

  return (
    <>
      <Stack direction="row" sx={{ height: '100%', minHeight: 0 }}>
        <Stack sx={{ flex: 1, minWidth: 0, p: 2, gap: 2, overflow: 'auto' }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1}
            sx={{ alignItems: 'flex-start' }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                {document.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Нажмите кнопку ниже, затем по строке текста на странице — участок будет отмечен
                синим, как выделение.
              </Typography>
            </Box>
            <ToggleButton
              value="placement"
              selected={placementMode}
              onChange={() => setPlacementMode((value) => !value)}
              color="primary"
            >
              Указать комментарий на странице
            </ToggleButton>
          </Stack>

          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Pagination
              color="primary"
              count={Math.max(numPages, 1)}
              page={pageNumber}
              onChange={(_, page) => setPageNumber(page)}
              disabled={numPages === 0}
            />
            {placementMode && (
              <Chip label="Режим выбора на странице" color="primary" variant="outlined" />
            )}
          </Stack>

          <Box
            ref={canvasRef}
            sx={{
              borderRadius: 2,
              border: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              p: 2,
              display: 'flex',
              justifyContent: 'center',
              cursor: placementMode ? 'crosshair' : 'default',
            }}
          >
            {pdfFile.status === 'error' && (
              <Alert severity="error" sx={{ m: 2 }}>
                <Typography variant="body2" sx={{ display: 'block', mb: 1 }}>
                  Не удалось скачать PDF по сети.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {pdfFile.message}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
                  Для <code>/sample.pdf</code> выполните <code>npm run ensure-sample-pdf</code>. Для
                  внешних URL нужен CORS или прокси на вашем домене.
                </Typography>
              </Alert>
            )}
            {(pdfFile.status === 'idle' || pdfFile.status === 'loading') && (
              <Stack spacing={1} sx={{ py: 6, alignItems: 'center' }}>
                <CircularProgress />
                <Typography color="text.secondary">Загружаем файл PDF…</Typography>
              </Stack>
            )}
            {pdfFile.status === 'ready' && (
              <Document
                key={`${document.id}:${document.pdfUrl}`}
                file={pdfFile.file}
                loading={
                  <Stack spacing={1} sx={{ py: 6, alignItems: 'center' }}>
                    <CircularProgress />
                    <Typography color="text.secondary">Разбираем PDF…</Typography>
                  </Stack>
                }
                error={
                  <Alert severity="error" sx={{ m: 2 }}>
                    Файл загружен, но pdf.js не смог его открыть. Проверьте, что это неповреждённый
                    PDF, и обновите страницу.
                  </Alert>
                }
                onLoadSuccess={({ numPages: nextTotal }) => {
                  setNumPages(nextTotal);
                  setPageNumber((current) => Math.min(current, Math.max(nextTotal, 1)));
                }}
              >
                <Box
                  sx={{ position: 'relative', display: 'inline-block' }}
                  onClick={handlePageClick}
                >
                  <Page
                    pageNumber={pageNumber}
                    width={pageWidth}
                    renderAnnotationLayer
                    renderTextLayer
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      pointerEvents: 'none',
                    }}
                  >
                    {pageComments.map((comment) => {
                      const selected = selectedId === comment.id;
                      return (
                        <Tooltip key={comment.id} title={comment.text} followCursor>
                          <Box
                            role="button"
                            tabIndex={0}
                            aria-label={`Комментарий, страница ${comment.pageIndex + 1}: ${comment.text}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedId(comment.id);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                event.stopPropagation();
                                setSelectedId(comment.id);
                              }
                            }}
                            sx={{
                              position: 'absolute',
                              left: `${comment.relX * 100}%`,
                              top: `${comment.relY * 100}%`,
                              width: `${HIGHLIGHT_WIDTH_PCT}%`,
                              height: `${HIGHLIGHT_HEIGHT_PCT}%`,
                              transform: 'translate(-12%, -50%)',
                              pointerEvents: 'auto',
                              cursor: 'pointer',
                              borderRadius: '1px',
                              bgcolor: (theme) =>
                                selected
                                  ? alpha(theme.palette.primary.main, 0.42)
                                  : alpha(theme.palette.primary.main, 0.26),
                              boxShadow: selected
                                ? (theme) => `inset 0 0 0 2px ${theme.palette.primary.main}`
                                : 'none',
                              zIndex: selected ? 2 : 1,
                              transition: (theme) =>
                                theme.transitions.create(['background-color', 'box-shadow'], {
                                  duration: theme.transitions.duration.shorter,
                                }),
                            }}
                          />
                        </Tooltip>
                      );
                    })}
                  </Box>
                </Box>
              </Document>
            )}
          </Box>
        </Stack>

        <Paper
          elevation={0}
          square
          sx={{
            width: { xs: '100%', md: 360 },
            borderLeft: { md: 1 },
            borderTop: { xs: 1, md: 0 },
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            minHeight: { xs: 320, md: 'auto' },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Комментарии
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {sortedComments.length} шт.
            </Typography>
          </Box>
          <Divider />
          <List dense sx={{ py: 0, overflow: 'auto', flex: 1 }}>
            {sortedComments.map((comment) => (
              <ListItem
                key={comment.id}
                disablePadding
                secondaryAction={
                  <Tooltip title="Удалить">
                    <span>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => void deleteMutation.mutateAsync(comment.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                }
              >
                <ListItemButton
                  selected={selectedId === comment.id}
                  onClick={() => {
                    setSelectedId(comment.id);
                    setPageNumber(comment.pageIndex + 1);
                  }}
                  alignItems="flex-start"
                >
                  <Stack spacing={0.5} sx={{ pr: 4 }}>
                    <Typography variant="caption" color="text.secondary">
                      стр. {comment.pageIndex + 1} · {comment.author.name}
                    </Typography>
                    <Typography variant="body2">{comment.text}</Typography>
                  </Stack>
                </ListItemButton>
              </ListItem>
            ))}
            {sortedComments.length === 0 && (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Пока нет комментариев. Добавьте первый, выбрав место на странице.
                </Typography>
              </Box>
            )}
          </List>
        </Paper>
      </Stack>

      <AddCommentDialog
        key={dialogKey}
        documentId={documentId}
        open={dialogOpen}
        draft={draft}
        onClose={() => {
          setDialogOpen(false);
          setDraft(null);
        }}
      />
    </>
  );
};
