import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import type { CreateCommentBody, HighlightRectDto } from '@/entities/comment';
import { useCreateCommentMutation } from '@/features/manage-comments/model/useCommentMutations';

type DraftPoint = {
  pageIndex: number;
  relX: number;
  relY: number;
  highlightRects: HighlightRectDto[];
};

type AddCommentDialogProps = {
  documentId: string;
  open: boolean;
  draft: DraftPoint | null;
  onClose: () => void;
};

export const AddCommentDialog = ({ documentId, open, draft, onClose }: AddCommentDialogProps) => {
  const [text, setText] = useState('');
  const createMutation = useCreateCommentMutation(documentId);

  const handleSubmit = async () => {
    if (!draft) {
      return;
    }
    const body: CreateCommentBody = {
      pageIndex: draft.pageIndex,
      relX: draft.relX,
      relY: draft.relY,
      text: text.trim(),
      highlightRects: draft.highlightRects,
    };
    if (!body.text) {
      return;
    }
    await createMutation.mutateAsync(body);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Новый комментарий</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {draft && (
            <Typography variant="body2" color="text.secondary">
              Страница {draft.pageIndex + 1}, центр якоря{' '}
              {(draft.relX * 100).toFixed(1)}% × {(draft.relY * 100).toFixed(1)}% · фрагментов
              подсветки: {draft.highlightRects.length}
            </Typography>
          )}
          <TextField
            label="Текст комментария"
            value={text}
            onChange={(event) => setText(event.target.value)}
            multiline
            minRows={3}
            autoFocus
          />
          {createMutation.isError && (
            <Typography color="error" variant="body2">
              {(createMutation.error as Error).message}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button
          onClick={() => void handleSubmit()}
          variant="contained"
          disabled={!draft || !text.trim() || createMutation.isPending}
        >
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
};
