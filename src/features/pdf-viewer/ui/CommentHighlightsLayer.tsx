import { Box, Tooltip } from '@mui/material';
import { alpha, type Theme } from '@mui/material/styles';
import { Fragment } from 'react';
import type { CommentDto } from '@/entities/comment';
import { DEFAULT_HIGHLIGHT_COLOR } from '@/features/manage-comments/model/highlightColors';

const LEGACY_HIGHLIGHT_WIDTH_PCT = 34;
const LEGACY_HIGHLIGHT_HEIGHT_PCT = 2.35;
const RESOLVED_TINT = '#66BB6A';

const colorForComment = (comment: CommentDto) =>
  comment.highlightColor ?? DEFAULT_HIGHLIGHT_COLOR;

type CommentHighlightsLayerProps = {
  comments: CommentDto[];
  selectedId: string | null;
  onSelect: (commentId: string) => void;
};

export const CommentHighlightsLayer = ({
  comments,
  selectedId,
  onSelect,
}: CommentHighlightsLayerProps) => (
  <Box
    sx={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
    }}
  >
    {comments.map((comment) => {
      const selected = selectedId === comment.id;
      const resolved = comment.resolved;
      const baseColor = resolved ? RESOLVED_TINT : colorForComment(comment);
      const rects =
        comment.highlightRects && comment.highlightRects.length > 0
          ? comment.highlightRects
          : null;
      const segmentStyle = {
        pointerEvents: 'auto' as const,
        cursor: 'pointer' as const,
        borderRadius: '1px',
        opacity: resolved ? 0.5 : 1,
        bgcolor: selected ? alpha(baseColor, 0.55) : alpha(baseColor, 0.38),
        boxShadow: selected ? `inset 0 0 0 2px ${baseColor}` : 'none',
        zIndex: selected ? 2 : 1,
        transition: (theme: Theme) =>
          theme.transitions.create(['background-color', 'box-shadow', 'opacity'], {
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
                    onSelect(comment.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      event.stopPropagation();
                      onSelect(comment.id);
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
              onSelect(comment.id);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.stopPropagation();
                onSelect(comment.id);
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
);
