import {
  Alert,
  Box,
  CircularProgress,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEventHandler,
} from 'react';
import { Document, Page } from 'react-pdf';
import type { CommentDto } from '@/entities/comment';
import { useCommentsQuery } from '@/entities/comment';
import { useDocumentQuery } from '@/entities/document';
import type { EmbeddedPdfAttachment } from '@/entities/document-attachment';
import {
  CommentsPanel,
  CommentToolsBar,
  PageAnnotationLayer,
  useCreateCommentMutation,
  type CommentTool,
  type PendingCommentDraft,
} from '@/features/manage-comments';
import {
  loadStoredHighlightColor,
  storeHighlightColor,
} from '@/features/manage-comments/model/highlightColors';
import {
  centerFromDraft,
  pinHighlightRect,
} from '@/features/manage-comments/lib/annotationGeometry';
import {
  DEFAULT_SCALE,
  DEFAULT_SCALE_VALUE,
  PdfFindBar,
  PdfSidePanel,
  PdfViewerMenu,
  createFindTextRenderer,
  PdfViewerToolbar,
  buildSpreadGroups,
  loadPdfOutline,
  pagesForScrollPageMode,
  resolvePdfScale,
  scaleByDelta,
  searchPdfText,
  type PageTextIndex,
  useHandPan,
  usePageVisibility,
  usePdfViewerShortcuts,
  type CursorTool,
  type FindMatch,
  type OutlineItem,
  type ScrollMode,
  type SidePanelTab,
  type SpreadMode,
} from '@/features/pdf-viewer';
import { toNormalizedPoint } from '@/shared/lib/coords';
import {
  centerFromHighlightRects,
  clientRectsToHighlightDtos,
  mergePdfSelectionRects,
  selectionIsInsideElement,
} from '@/shared/lib/selectionHighlight';
import { useContainerWidth } from '@/shared/lib/useContainerWidth';
import { usePdfFileData } from '@/shared/lib/usePdfFileData';

export type PdfWorkspacePdfSource = {
  filename: string;
  pdfUrl: string;
};

type PdfWorkspaceProps = {
  documentId: string;
  /** Просмотр прикреплённого PDF вместо основного файла документа. */
  pdfSource?: PdfWorkspacePdfSource;
};

const rootCommentsOnPage = (items: CommentDto[], pageIndex: number) =>
  items.filter((item) => !item.parentCommentId && item.pageIndex === pageIndex);

const clampPage = (page: number, numPages: number) =>
  Math.min(Math.max(page, 1), Math.max(numPages, 1));

export const PdfWorkspace = ({ documentId, pdfSource }: PdfWorkspaceProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  const {
    ref: scrollContainerRef,
    elementRef: scrollContainerElementRef,
    width: containerWidth,
    height: containerHeight,
  } = useContainerWidth<HTMLDivElement>();
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const scrollToPageOnNavigate = useRef(false);

  const { data: document, isPending, isError, error } = useDocumentQuery(documentId);
  const { data: comments = [] } = useCommentsQuery(documentId);
  const createMutation = useCreateCommentMutation(documentId);
  const pdfUrl = pdfSource?.pdfUrl ?? document?.pdfUrl;
  const pdfFile = usePdfFileData(pdfUrl);
  const isAttachmentView = Boolean(pdfSource);

  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [currentScaleValue, setCurrentScaleValue] = useState(DEFAULT_SCALE_VALUE);
  const [currentScale, setCurrentScale] = useState(DEFAULT_SCALE);
  const [pageLayoutWidth, setPageLayoutWidth] = useState(720);
  const [rotation, setRotation] = useState(0);
  const [scrollMode, setScrollMode] = useState<ScrollMode>('page');
  const [spreadMode, setSpreadMode] = useState<SpreadMode>('none');
  const [cursorTool, setCursorTool] = useState<CursorTool>('select');
  const [sidePanelTab, setSidePanelTab] = useState<SidePanelTab>('none');
  const [findOpen, setFindOpen] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [findCaseSensitive, setFindCaseSensitive] = useState(false);
  const [findMatches, setFindMatches] = useState<FindMatch[]>([]);
  const [activeFindIndex, setActiveFindIndex] = useState(0);
  const [findSearching, setFindSearching] = useState(false);
  const [findPageIndices, setFindPageIndices] = useState<Map<number, PageTextIndex>>(
    () => new Map(),
  );
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [outlineLoading, setOutlineLoading] = useState(false);
  const [embeddedAttachments, setEmbeddedAttachments] = useState<EmbeddedPdfAttachment[]>([]);
  const [embeddedAttachmentsLoading, setEmbeddedAttachmentsLoading] = useState(false);

  const [commentTool, setCommentTool] = useState<CommentTool>('view');
  const [highlightColor, setHighlightColor] = useState(loadStoredHighlightColor);
  const [pendingDraft, setPendingDraft] = useState<PendingCommentDraft | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const applyHighlightColor = useCallback((color: string) => {
    setHighlightColor(color);
    storeHighlightColor(color);
    setPendingDraft((draft) => (draft ? { ...draft, highlightColor: color } : draft));
  }, []);

  const openPendingDraft = useCallback(
    (draft: Omit<PendingCommentDraft, 'highlightColor'>) => {
      setPendingDraft({ ...draft, highlightColor });
      setCommentTool('view');
    },
    [highlightColor],
  );

  const annotationActive = commentTool !== 'view';
  const handPanEnabled = commentTool === 'view' && cursorTool === 'hand' && !pendingDraft;
  const findActive = findOpen && Boolean(findQuery.trim());
  const canSelectPdfText =
    !pendingDraft && commentTool === 'view' && cursorTool === 'select';
  const enablePdfTextLayer =
    canSelectPdfText || (commentTool === 'text' && !pendingDraft) || findActive;
  const pageWidth = Math.max(120, Math.round(pageLayoutWidth));
  const activeFindMatch = findMatches[activeFindIndex] ?? null;

  const enterPresentationMode = useCallback(async () => {
    const element = fullscreenRef.current;
    if (!element) {
      return;
    }
    setMenuAnchor(null);
    try {
      if (window.document.fullscreenElement === element) {
        await window.document.exitFullscreen();
      } else {
        await element.requestFullscreen();
      }
    } catch {
      /* fullscreen API unavailable or denied */
    }
  }, []);

  const closeFind = useCallback(() => {
    const container = scrollContainerElementRef.current;
    const scrollTop = container?.scrollTop ?? 0;
    const scrollLeft = container?.scrollLeft ?? 0;

    setFindOpen(false);
    setFindQuery('');
    setFindMatches([]);
    setFindPageIndices(new Map());
    setActiveFindIndex(0);
    setFindSearching(false);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = scrollContainerElementRef.current;
        if (!el) {
          return;
        }
        el.scrollTop = scrollTop;
        el.scrollLeft = scrollLeft;
      });
    });
  }, []);

  useHandPan(handPanEnabled, scrollContainerElementRef);

  const scrollToPageElement = useCallback((page: number) => {
    const tryScroll = (attempt = 0) => {
      const container = scrollContainerElementRef.current;
      const target = container?.querySelector<HTMLElement>(
        `[data-pdf-page="${String(page)}"]`,
      );
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }
      if (attempt < 8) {
        requestAnimationFrame(() => tryScroll(attempt + 1));
      }
    };
    tryScroll();
  }, []);

  const goToPage = useCallback(
    (page: number) => {
      const clamped = clampPage(page, numPages);
      scrollToPageOnNavigate.current = true;
      setPageNumber(clamped);
    },
    [numPages],
  );

  useEffect(() => {
    if (!scrollToPageOnNavigate.current || numPages <= 0) {
      return;
    }
    scrollToPageOnNavigate.current = false;
    scrollToPageElement(pageNumber);
  }, [
    pageNumber,
    numPages,
    scrollMode,
    spreadMode,
    pdfFile.status,
    scrollToPageElement,
  ]);

  usePageVisibility(
    scrollContainerElementRef,
    scrollMode !== 'page' && numPages > 0,
    (page) => setPageNumber(page),
  );

  useEffect(() => {
    if (!pdf || containerWidth < 80) {
      return;
    }
    const height = containerHeight > 0 ? containerHeight : window.innerHeight;
    let cancelled = false;
    void resolvePdfScale({
      pdf,
      pageNumber,
      scaleValue: currentScaleValue,
      containerWidth,
      containerHeight: height,
      rotation,
      scrollHorizontal: scrollMode === 'horizontal',
    }).then((result) => {
      if (!cancelled) {
        setCurrentScale(result.scale);
        setPageLayoutWidth(result.pageWidth);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [
    pdf,
    pageNumber,
    currentScaleValue,
    containerWidth,
    containerHeight,
    rotation,
    scrollMode,
  ]);

  const loadSidePanelData = useCallback(async (loadedPdf: PDFDocumentProxy) => {
    setOutlineLoading(true);
    setEmbeddedAttachmentsLoading(true);
    try {
      const [outlineResult, rawAttachments] = await Promise.all([
        loadPdfOutline(loadedPdf),
        loadedPdf.getAttachments().catch(() => null),
      ]);
      setOutline(outlineResult);
      setEmbeddedAttachments((previous) => {
        previous.forEach((item) => URL.revokeObjectURL(item.blobUrl));
        if (!rawAttachments) {
          return [];
        }
        return Object.entries(rawAttachments).flatMap(([key, value]) => {
          const item = value as {
            filename?: string;
            content?: Uint8Array;
            mimeType?: string;
          };
          if (!item.content?.length) {
            return [];
          }
          const mimeType = item.mimeType ?? 'application/pdf';
          const blob = new Blob([Uint8Array.from(item.content)], { type: mimeType });
          return [
            {
              key,
              filename: item.filename ?? key,
              mimeType,
              sizeBytes: item.content.length,
              blobUrl: URL.createObjectURL(blob),
            },
          ];
        });
      });
    } finally {
      setOutlineLoading(false);
      setEmbeddedAttachmentsLoading(false);
    }
  }, []);

  useEffect(
    () => () => {
      embeddedAttachments.forEach((item) => URL.revokeObjectURL(item.blobUrl));
    },
    [embeddedAttachments],
  );

  useEffect(() => {
    if (!pdf || !findOpen || !findQuery.trim()) {
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void searchPdfText(pdf, findQuery, findCaseSensitive)
        .then(({ matches, pageIndices }) => {
          if (cancelled) {
            return;
          }
          setFindSearching(false);
          setFindMatches(matches);
          setFindPageIndices(pageIndices);
          setActiveFindIndex(0);
          if (matches[0]) {
            goToPage(matches[0].pageIndex + 1);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setFindSearching(false);
          }
        });
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [pdf, findOpen, findQuery, findCaseSensitive, goToPage]);

  useEffect(() => {
    if (!findActive || !findMatches.length) {
      return;
    }
    const timer = window.setTimeout(() => {
      scrollContainerElementRef.current
        ?.querySelector('.pdf-find-mark--active')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [activeFindIndex, findMatches, findActive, pageLayoutWidth, currentScale]);

  const handleFindQueryChange = (value: string) => {
    setFindQuery(value);
    if (!value.trim()) {
      setFindMatches([]);
      setFindPageIndices(new Map());
      setActiveFindIndex(0);
      setFindSearching(false);
      return;
    }
    setFindSearching(true);
  };

  const navigateFind = (direction: 1 | -1) => {
    if (!findMatches.length) {
      return;
    }
    const nextIndex = (activeFindIndex + direction + findMatches.length) % findMatches.length;
    setActiveFindIndex(nextIndex);
    goToPage(findMatches[nextIndex].pageIndex + 1);
  };

  const applyNumericZoom = (next: number) => {
    const prev = currentScale;
    setCurrentScale(next);
    setCurrentScaleValue(String(next));
    if (prev > 0) {
      setPageLayoutWidth((layout) => Math.max(120, Math.round(layout * (next / prev))));
    }
  };

  const zoomIn = () => {
    applyNumericZoom(scaleByDelta(currentScale, 1));
  };

  const zoomOut = () => {
    applyNumericZoom(scaleByDelta(currentScale, -1));
  };

  usePdfViewerShortcuts(
    {
      onFind: () => setFindOpen(true),
      onZoomIn: zoomIn,
      onZoomOut: zoomOut,
      onNextPage: () => goToPage(pageNumber + 1),
      onPrevPage: () => goToPage(pageNumber - 1),
      onFirstPage: () => goToPage(1),
      onLastPage: () => goToPage(numPages),
    },
    pdfFile.status === 'ready',
  );

  useEffect(() => {
    if (commentTool !== 'text' || pdfFile.status !== 'ready') {
      return;
    }
    const onWindowMouseUp = () => {
      const container = scrollContainerElementRef.current;
      if (!container) {
        return;
      }
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        return;
      }
      const surfaces = container.querySelectorAll<HTMLElement>('[data-pdf-page-surface]');
      const surface = Array.from(surfaces).find((element: HTMLElement) =>
        selectionIsInsideElement(selection, element),
      );
      if (!surface) {
        return;
      }
      const pageIndex = Number(surface.dataset.pdfPageSurface);
      if (!Number.isFinite(pageIndex)) {
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
      openPendingDraft({ pageIndex, relX, relY, highlightRects });
    };
    window.addEventListener('mouseup', onWindowMouseUp);
    return () => window.removeEventListener('mouseup', onWindowMouseUp);
  }, [commentTool, pdfFile.status, openPendingDraft]);

  const handleSavePending = async (text: string) => {
    if (!pendingDraft) {
      return;
    }
    const anchor = centerFromDraft(pendingDraft);
    const body = {
      pageIndex: pendingDraft.pageIndex,
      relX: anchor.relX,
      relY: anchor.relY,
      text,
      ...(pendingDraft.highlightRects?.length
        ? { highlightRects: pendingDraft.highlightRects }
        : {}),
      highlightColor: pendingDraft.highlightColor,
    };
    try {
      await createMutation.mutateAsync(body);
      storeHighlightColor(pendingDraft.highlightColor);
      setPendingDraft(null);
      setCommentTool('view');
    } catch {
      /* ошибка показывается в InlineCommentEditor */
    }
  };

  const handlePageSurfaceClick: MouseEventHandler<HTMLDivElement> = (event) => {
    if (pendingDraft || commentTool !== 'pin') {
      return;
    }
    event.stopPropagation();
    const surface = event.currentTarget;
    const pageIndex = Number(surface.dataset.pdfPageSurface);
    if (!Number.isFinite(pageIndex)) {
      return;
    }
    const pageRect = surface.getBoundingClientRect();
    const { relX, relY } = toNormalizedPoint(event.clientX, event.clientY, pageRect);
    openPendingDraft({
      pageIndex,
      relX,
      relY,
      highlightRects: [pinHighlightRect(relX, relY)],
    });
  };

  const visiblePages = useMemo(() => {
    if (scrollMode === 'page') {
      return pagesForScrollPageMode(pageNumber, numPages, spreadMode);
    }
    return buildSpreadGroups(numPages, spreadMode).flat();
  }, [scrollMode, pageNumber, numPages, spreadMode]);

  const renderSpreadRow = (pages: number[], rowKey: string, evenPadLeft = false) => (
    <Stack
      key={rowKey}
      direction="row"
      spacing={2}
      sx={{ justifyContent: 'center', alignItems: 'flex-start', mb: 2, maxWidth: '100%' }}
    >
      {evenPadLeft && (
        <Box sx={{ width: pageWidth, flexShrink: 0, visibility: 'hidden' }} aria-hidden />
      )}
      {pages.map((page) => {
        const pageIndex = page - 1;
        const pageComments = rootCommentsOnPage(comments, pageIndex);
        const pageTextIndex = findPageIndices.get(pageIndex);
        const pageFindMatches = findMatches.filter((match) => match.pageIndex === pageIndex);
        const findTextRenderer =
          findActive && pageTextIndex
            ? createFindTextRenderer({
                pageIndex,
                pageTextIndex,
                pageMatches: pageFindMatches,
                activeMatch: activeFindMatch,
              })
            : undefined;
        return (
          <Box
            key={page}
            data-pdf-page={page}
            data-pdf-page-surface={page - 1}
            data-editor-open={pendingDraft?.pageIndex === page - 1 ? 'true' : undefined}
            onClick={handlePageSurfaceClick}
            sx={{
              position: 'relative',
              display: 'inline-block',
              flexShrink: 0,
              cursor: commentTool === 'pin' && !pendingDraft ? 'crosshair' : undefined,
            }}
          >
            <Page
              key={`${String(page)}-${String(pageLayoutWidth)}-${String(rotation)}`}
              pageNumber={page}
              width={pageWidth}
              rotate={rotation}
              renderAnnotationLayer
              renderTextLayer={enablePdfTextLayer}
              customTextRenderer={findTextRenderer}
            />
            <PageAnnotationLayer
              pageIndex={page - 1}
              tool={commentTool}
              highlightColor={highlightColor}
              comments={pageComments}
              selectedId={selectedId}
              pendingDraft={pendingDraft}
              saving={createMutation.isPending}
              saveError={
                createMutation.isError ? (createMutation.error as Error).message : undefined
              }
              onSelect={setSelectedId}
              onPendingDraft={openPendingDraft}
              onUpdateDraftColor={applyHighlightColor}
              onSave={(text) => void handleSavePending(text)}
              onCancelPending={() => setPendingDraft(null)}
            />
          </Box>
        );
      })}
    </Stack>
  );

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

  const scrollContainerSx = {
    flex: 1,
    minHeight: 0,
    height: '100%',
    overflow: 'auto',
    p: { xs: 1, sm: 2 },
    cursor: handPanEnabled ? 'grab' : 'default',
    userSelect:
      canSelectPdfText || commentTool === 'text' ? 'text' : annotationActive ? 'none' : 'auto',
    ...(scrollMode === 'horizontal' && {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'nowrap',
      gap: 2,
    }),
    ...(scrollMode === 'wrapped' && {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 2,
      alignContent: 'flex-start',
    }),
    ...(scrollMode === 'vertical' && {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }),
  };

  return (
    <>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        sx={{ height: '100%', minHeight: 0, overflow: 'hidden' }}
      >
        <Box
          ref={fullscreenRef}
          className="pdf-workspace-fullscreen"
          sx={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box className="pdf-workspace-chrome" sx={{ px: 2, pt: 1.5, pb: 0.5, flexShrink: 0 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600 }}
              noWrap
              title={pdfSource?.filename ?? document.title}
            >
              {pdfSource?.filename ?? document.title}
            </Typography>
            {isAttachmentView && (
              <Typography variant="caption" color="text.secondary" noWrap title={document.title}>
                Вложение к документу «{document.title}»
              </Typography>
            )}
          </Box>

          <Box className="pdf-workspace-chrome" sx={{ flexShrink: 0 }}>
          <PdfViewerToolbar
            pageNumber={pageNumber}
            numPages={numPages}
            currentScaleValue={currentScaleValue}
            currentScale={currentScale}
            sidePanelOpen={sidePanelTab !== 'none'}
            findOpen={findOpen}
            onPageNumberChange={(page) => goToPage(page)}
            onPrevPage={() => goToPage(pageNumber - 1)}
            onNextPage={() => goToPage(pageNumber + 1)}
            onFirstPage={() => goToPage(1)}
            onLastPage={() => goToPage(numPages)}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onScaleValueChange={setCurrentScaleValue}
            onToggleSidePanel={() =>
              setSidePanelTab((tab) => (tab === 'none' ? 'thumbnails' : 'none'))
            }
            onToggleFind={() => (findOpen ? closeFind() : setFindOpen(true))}
            onOpenMenu={setMenuAnchor}
          />
          </Box>

          {findOpen && (
            <Box className="pdf-workspace-chrome" sx={{ flexShrink: 0 }}>
            <PdfFindBar
              query={findQuery}
              caseSensitive={findCaseSensitive}
              matchCount={findMatches.length}
              activeMatchIndex={activeFindIndex}
              searching={findSearching}
              onQueryChange={handleFindQueryChange}
              onCaseSensitiveChange={setFindCaseSensitive}
              onPrev={() => navigateFind(-1)}
              onNext={() => navigateFind(1)}
              onClose={closeFind}
            />
            </Box>
          )}

          <Box className="pdf-workspace-chrome" sx={{ flexShrink: 0 }}>
          <CommentToolsBar
            tool={commentTool}
            highlightColor={highlightColor}
            onHighlightColorChange={applyHighlightColor}
            onToolChange={(tool) => {
              setCommentTool(tool);
              if (tool !== 'view') {
                setPendingDraft(null);
                setCursorTool('select');
              }
            }}
          />
          </Box>

          <Box
            className="pdf-fullscreen-viewer"
            sx={{ flex: 1, minHeight: 0, display: 'flex', position: 'relative', overflow: 'hidden' }}
          >
            {pdfFile.status === 'error' && (
              <Alert severity="error" sx={{ m: 2 }}>
                <Typography variant="body2" sx={{ display: 'block', mb: 1 }}>
                  Не удалось скачать PDF по сети.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {pdfFile.message}
                </Typography>
              </Alert>
            )}
            {(pdfFile.status === 'idle' || pdfFile.status === 'loading') && (
              <Stack spacing={1} sx={{ py: 6, alignItems: 'center', flex: 1 }}>
                <CircularProgress />
                <Typography color="text.secondary">Загружаем файл PDF…</Typography>
              </Stack>
            )}
            {pdfFile.status === 'ready' && (
              <Document
                key={`${document.id}:${document.pdfUrl}`}
                file={pdfFile.file}
                loading={
                  <Stack spacing={1} sx={{ py: 6, alignItems: 'center', flex: 1 }}>
                    <CircularProgress />
                    <Typography color="text.secondary">Разбираем PDF…</Typography>
                  </Stack>
                }
                error={
                  <Alert severity="error" sx={{ m: 2 }}>
                    Файл загружен, но pdf.js не смог его открыть.
                  </Alert>
                }
                onLoadSuccess={(loadedPdf) => {
                  setPdf(loadedPdf);
                  setNumPages(loadedPdf.numPages);
                  setPageNumber((current) =>
                    Math.min(current, Math.max(loadedPdf.numPages, 1)),
                  );
                  void loadSidePanelData(loadedPdf);
                }}
              >
                <Box sx={{ display: 'flex', flex: 1, minHeight: 0, width: '100%', position: 'relative' }}>
                  {sidePanelTab !== 'none' && isMobile && (
                    <Box
                      aria-hidden
                      onClick={() => setSidePanelTab('none')}
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        bgcolor: 'rgba(0,0,0,0.4)',
                        zIndex: 8,
                      }}
                    />
                  )}
                  {sidePanelTab !== 'none' && (
                    <Box
                      sx={{
                        position: { xs: 'absolute', lg: 'static' },
                        left: 0,
                        top: 0,
                        bottom: 0,
                        zIndex: 9,
                        flexShrink: 0,
                      }}
                    >
                      <PdfSidePanel
                        documentId={documentId}
                        tab={sidePanelTab}
                        onTabChange={setSidePanelTab}
                        numPages={numPages}
                        pageNumber={pageNumber}
                        onPageSelect={(page) => {
                          goToPage(page);
                          if (isMobile) {
                            setSidePanelTab('none');
                          }
                        }}
                        outline={outline}
                        outlineLoading={outlineLoading}
                        embeddedAttachments={embeddedAttachments}
                        embeddedAttachmentsLoading={embeddedAttachmentsLoading}
                      />
                    </Box>
                  )}
                  <Box
                    sx={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', overflow: 'hidden' }}
                  >
                    <Box
                      ref={scrollContainerRef}
                      className="pdf-fullscreen-scroll"
                      sx={scrollContainerSx}
                    >
                      {scrollMode === 'page' &&
                        buildSpreadGroups(numPages, spreadMode)
                          .filter((group) => group.some((page) => visiblePages.includes(page)))
                          .map((group, index) =>
                            renderSpreadRow(
                              group,
                              `spread-${String(index)}`,
                              spreadMode === 'even' && group[0] === 1,
                            ),
                          )}
                      {scrollMode !== 'page' &&
                        buildSpreadGroups(numPages, spreadMode).map((group, index) =>
                          renderSpreadRow(
                            group,
                            `scroll-${String(index)}`,
                            spreadMode === 'even' && group[0] === 1,
                          ),
                        )}
                    </Box>
                  </Box>
                </Box>
              </Document>
            )}
          </Box>
        </Box>

        <CommentsPanel
          documentId={documentId}
          comments={comments}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onNavigate={(pageIndex) => goToPage(pageIndex + 1)}
        />
      </Stack>

      <PdfViewerMenu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        scrollMode={scrollMode}
        spreadMode={spreadMode}
        cursorTool={cursorTool}
        rotation={rotation}
        onScrollModeChange={setScrollMode}
        onSpreadModeChange={setSpreadMode}
        onCursorToolChange={setCursorTool}
        onRotateCw={() => setRotation((value) => (value + 90) % 360)}
        onRotateCcw={() => setRotation((value) => (value + 270) % 360)}
        onPresentationMode={() => void enterPresentationMode()}
      />
    </>
  );
};
