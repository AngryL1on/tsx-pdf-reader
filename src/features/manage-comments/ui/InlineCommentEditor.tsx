import { Close as CloseIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Portal,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useLayoutEffect, useRef, useState } from 'react';
import type { PendingCommentDraft } from '@/features/manage-comments/model/commentTools';
import { HighlightColorPicker } from '@/features/manage-comments/ui/HighlightColorPicker';

type InlineCommentEditorProps = {
  draft: PendingCommentDraft;
  anchorSelector: string;
  saving: boolean;
  errorMessage?: string;
  onColorChange: (color: string) => void;
  onSave: (text: string) => void;
  onCancel: () => void;
};

export const InlineCommentEditor = ({
  draft,
  anchorSelector,
  saving,
  errorMessage,
  onColorChange,
  onSave,
  onCancel,
}: InlineCommentEditorProps) => {
  const [text, setText] = useState('');
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const updatePosition = () => {
      const anchor = document.querySelector<HTMLElement>(anchorSelector);
      if (!anchor) {
        return;
      }
      const pageRect = anchor.getBoundingClientRect();
      const panelWidth = panelRef.current?.offsetWidth ?? 280;
      const panelHeight = panelRef.current?.offsetHeight ?? 200;
      const rawLeft = pageRect.left + draft.relX * pageRect.width + 8;
      const rawTop = pageRect.top + draft.relY * pageRect.height + 8;
      const left = Math.min(Math.max(8, rawLeft), window.innerWidth - panelWidth - 8);
      const top = Math.min(Math.max(8, rawTop), window.innerHeight - panelHeight - 8);
      setPosition({ top, left });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorSelector, draft.relX, draft.relY, draft.pageIndex]);

  if (!position) {
    return null;
  }

  return (
    <Portal>
      <Paper
        ref={panelRef}
        elevation={8}
        sx={{
          position: 'fixed',
          top: position.top,
          left: position.left,
          width: { xs: 220, sm: 300 },
          zIndex: 1400,
          p: 1.5,
        }}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <Stack spacing={1.25}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              стр. {draft.pageIndex + 1}
            </Typography>
            <IconButton size="small" onClick={onCancel} aria-label="Отмена" type="button">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
          <HighlightColorPicker
            value={draft.highlightColor}
            onChange={onColorChange}
            compact
          />
          <TextField
            size="small"
            placeholder="Текст комментария"
            value={text}
            onChange={(event) => setText(event.target.value)}
            multiline
            minRows={2}
            autoFocus
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                if (text.trim()) {
                  onSave(text.trim());
                }
              }
              if (event.key === 'Escape') {
                onCancel();
              }
            }}
          />
          {errorMessage && (
            <Typography variant="caption" color="error">
              {errorMessage}
            </Typography>
          )}
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
            <Button size="small" type="button" onClick={onCancel}>
              Отмена
            </Button>
            <Button
              size="small"
              type="button"
              variant="contained"
              disabled={!text.trim() || saving}
              onClick={() => onSave(text.trim())}
            >
              Сохранить
            </Button>
          </Stack>
        </Stack>
      </Paper>
      <Box
        aria-hidden
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 1399,
          bgcolor: 'transparent',
        }}
        onClick={onCancel}
      />
    </Portal>
  );
};
