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
import { alpha, type Theme } from '@mui/material/styles';
import { Fragment, useEffect, useMemo, useRef, useState, type MouseEventHandler } from 'react';
import { Document, Page } from 'react-pdf';
import type { CommentDto, HighlightRectDto } from '@/entities/comment';
import { useCommentsQuery } from '@/entities/comment';
import { useDocumentQuery } from '@/entities/document';
import { AddCommentDialog, useDeleteCommentMutation } from '@/features/manage-comments';
import {
  centerFromHighlightRects,
  clientRectsToHighlightDtos,
  findPresentationRectAtPoint,
  mergePdfSelectionRects,
  selectionIsInsideElement,
} from '@/shared/lib/selectionHighlight';
import { useContainerWidth } from '@/shared/lib/useContainerWidth';
import { usePdfFileData } from '@/shared/lib/usePdfFileData';

type PdfWorkspaceProps = {
  documentId: string;
};

type CommentPlacementDraft = {
  pageIndex: number;
  relX: number;
  relY: number;
  highlightRects: HighlightRectDto[];
};

/** Доля страницы: запасной маркер для старых комментариев без highlightRects. */
const LEGACY_HIGHLIGHT_WIDTH_PCT = 34;
const LEGACY_HIGHLIGHT_HEIGHT_PCT = 2.35;

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
  const [draft, setDraft] = useState<CommentPlacementDraft | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogKey, setDialogKey] = useState(0);

  const pageSurfaceRef = useRef<HTMLDivElement>(null);

  const sortedComments = useMemo(() => sortComments(comments), [comments]);
  const pageComments = useMemo(
    () => sortedComments.filter((item) => item.pageIndex === pageNumber - 1),
    [sortedComments, pageNumber],
  );

  const pageWidth = Math.max(280, Math.min(containerWidth - 16, 960));

  useEffect(() => {
    if (!placementMode || pdfFile.status !== 'ready') {
      return;
    }
    const onWindowMouseUp = () => {
      const surface = pageSurfaceRef.current;
      if (!surface) {
        return;
      }
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        return;
      }
      if (!selectionIsInsideElement(selection, surface)) {
        return;
      }
      const pageRect = surface.getBoundingClientRect();
      const merged = mergePdfSelectionRects(Array.from(selection.getRangeAt(0).getClientRects()));
      const highlightRects = clientRectsToHighlightDtos(merged, pageRect);
      selection.removeAllRanges();
      if (!highlightRects.length) {
        return;
      }
      const { relX, relY } = centerFromHighlightRects(highlightRects);
      setDraft({
        pageIndex: pageNumber - 1,
        relX,
        relY,
        highlightRects,
      });
      setDialogKey((value) => value + 1);
      setDialogOpen(true);
      setPlacementMode(false);
    };
    window.addEventListener('mouseup', onWindowMouseUp);
    return () => window.removeEventListener('mouseup', onWindowMouseUp);
  }, [placementMode, pdfFile.status, pageNumber]);

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

  const handleSurfaceClick: MouseEventHandler<HTMLDivElement> = (event) => {
    if (!placementMode) {
      return;
    }
    const surface = pageSurfaceRef.current;
    if (!surface) {
      return;
    }
    const glyph = findPresentationRectAtPoint(event.clientX, event.clientY, surface);
    if (!glyph) {
      return;
    }
    const highlightRects = clientRectsToHighlightDtos([glyph], surface.getBoundingClientRect());
    if (!highlightRects.length) {
      return;
    }
    const { relX, relY } = centerFromHighlightRects(highlightRects);
    setDraft({
      pageIndex: pageNumber - 1,
      relX,
      relY,
      highlightRects,
    });
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
                Включите режим ниже, затем выделите текст мышью на странице (как в редакторе) — под
                выделение попадут точные прямоугольники. Либо один раз кликните по букве: подсветится
                соответствующий фрагмент text layer.
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
                  ref={pageSurfaceRef}
                  sx={{ position: 'relative', display: 'inline-block' }}
                  onClick={handleSurfaceClick}
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
                      const rects =
                        comment.highlightRects && comment.highlightRects.length > 0
                          ? comment.highlightRects
                          : null;
                      const segmentStyle = {
                        pointerEvents: 'auto' as const,
                        cursor: 'pointer' as const,
                        borderRadius: '1px',
                        bgcolor: (theme: Theme) =>
                          selected
                            ? alpha(theme.palette.primary.main, 0.42)
                            : alpha(theme.palette.primary.main, 0.26),
                        boxShadow: selected
                          ? (theme: Theme) => `inset 0 0 0 2px ${theme.palette.primary.main}`
                          : 'none',
                        zIndex: selected ? 2 : 1,
                        transition: (theme: Theme) =>
                          theme.transitions.create(['background-color', 'box-shadow'], {
                            duration: theme.transitions.duration.shorter,
                          }),
                      };
                      if (rects) {
                        return (
                          <Fragment key={comment.id}>
                            {rects.map((r, index) => (
                              <Tooltip
                                key={`${comment.id}-${String(index)}`}
                                title={comment.text}
                                followCursor
                              >
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
                                    left: `${r.relLeft * 100}%`,
                                    top: `${r.relTop * 100}%`,
                                    width: `${r.relWidth * 100}%`,
                                    height: `${r.relHeight * 100}%`,
                                    ...segmentStyle,
                                  }}
                                />
                              </Tooltip>
                            ))}
                          </Fragment>
                        );
                      }
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
                              width: `${LEGACY_HIGHLIGHT_WIDTH_PCT}%`,
                              height: `${LEGACY_HIGHLIGHT_HEIGHT_PCT}%`,
                              transform: 'translate(-12%, -50%)',
                              ...segmentStyle,
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
                  Пока нет комментариев. Добавьте первый, выделив текст на странице.
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
