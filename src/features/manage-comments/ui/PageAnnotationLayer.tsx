import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useRef, useState, type PointerEventHandler } from 'react';
import type { CommentDto } from '@/entities/comment';
import {
  highlightRectFromRelBox,
  relPointFromClient,
} from '@/features/manage-comments/lib/annotationGeometry';
import type { CommentTool, PendingCommentDraft } from '@/features/manage-comments/model/commentTools';
import { InlineCommentEditor } from '@/features/manage-comments/ui/InlineCommentEditor';
import { CommentHighlightsLayer } from '@/features/pdf-viewer';

type PageAnnotationLayerProps = {
  pageIndex: number;
  tool: CommentTool;
  highlightColor: string;
  comments: CommentDto[];
  selectedId: string | null;
  pendingDraft: PendingCommentDraft | null;
  saving: boolean;
  saveError?: string;
  onSelect: (commentId: string) => void;
  onPendingDraft: (draft: PendingCommentDraft) => void;
  onUpdateDraftColor: (color: string) => void;
  onSave: (text: string) => void;
  onCancelPending: () => void;
};

export const PageAnnotationLayer = ({
  pageIndex,
  tool,
  highlightColor,
  comments,
  selectedId,
  pendingDraft,
  saving,
  saveError,
  onSelect,
  onPendingDraft,
  onUpdateDraftColor,
  onSave,
  onCancelPending,
}: PageAnnotationLayerProps) => {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragPreview, setDragPreview] = useState<ReturnType<typeof highlightRectFromRelBox> | null>(
    null,
  );

  const highlightMode = tool === 'highlight';
  const showPendingHere = pendingDraft?.pageIndex === pageIndex;
  const anchorSelector = `[data-pdf-page-surface="${String(pageIndex)}"]`;

  const finishHighlight = (endX: number, endY: number, startX: number, startY: number) => {
    const rect = highlightRectFromRelBox(startX, startY, endX, endY);
    if (rect.relWidth < 0.01 && rect.relHeight < 0.01) {
      return;
    }
    onPendingDraft({
      pageIndex,
      relX: rect.relLeft + rect.relWidth / 2,
      relY: rect.relTop,
      highlightRects: [rect],
      highlightColor,
    });
  };

  const handlePointerDown: PointerEventHandler<HTMLDivElement> = (event) => {
    if (!highlightMode || !surfaceRef.current) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const pageRect = surfaceRef.current.getBoundingClientRect();
    const { x, y } = relPointFromClient(event.clientX, event.clientY, pageRect);
    setDragStart({ x, y });
    setDragPreview(highlightRectFromRelBox(x, y, x, y));
  };

  const handlePointerMove: PointerEventHandler<HTMLDivElement> = (event) => {
    if (!highlightMode || !dragStart || !surfaceRef.current) {
      return;
    }
    const pageRect = surfaceRef.current.getBoundingClientRect();
    const { x, y } = relPointFromClient(event.clientX, event.clientY, pageRect);
    setDragPreview(highlightRectFromRelBox(dragStart.x, dragStart.y, x, y));
  };

  const handlePointerUp: PointerEventHandler<HTMLDivElement> = (event) => {
    if (!highlightMode || !dragStart || !surfaceRef.current) {
      return;
    }
    const pageRect = surfaceRef.current.getBoundingClientRect();
    const { x, y } = relPointFromClient(event.clientX, event.clientY, pageRect);
    finishHighlight(x, y, dragStart.x, dragStart.y);
    setDragStart(null);
    setDragPreview(null);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* already released */
    }
  };

  return (
    <>
      <Box
        ref={surfaceRef}
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: highlightMode ? 'auto' : 'none',
          cursor: highlightMode ? 'crosshair' : 'default',
          zIndex: highlightMode ? 10 : 6,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <CommentHighlightsLayer comments={comments} selectedId={selectedId} onSelect={onSelect} />

        {dragPreview && (
          <Box
            sx={{
              position: 'absolute',
              left: `${dragPreview.relLeft * 100}%`,
              top: `${dragPreview.relTop * 100}%`,
              width: `${dragPreview.relWidth * 100}%`,
              height: `${dragPreview.relHeight * 100}%`,
              bgcolor: alpha(highlightColor, 0.38),
              border: 2,
              borderColor: highlightColor,
              borderRadius: '2px',
              pointerEvents: 'none',
            }}
          />
        )}
      </Box>

      {showPendingHere && pendingDraft && (
        <InlineCommentEditor
          draft={pendingDraft}
          anchorSelector={anchorSelector}
          saving={saving}
          errorMessage={saveError}
          onColorChange={onUpdateDraftColor}
          onSave={onSave}
          onCancel={onCancelPending}
        />
      )}
    </>
  );
};
