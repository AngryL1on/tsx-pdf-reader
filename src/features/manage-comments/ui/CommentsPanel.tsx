import { DeleteOutlined as DeleteOutlineIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  Collapse,
  Divider,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import type { CommentDto } from '@/entities/comment';
import { DEFAULT_HIGHLIGHT_COLOR } from '@/features/manage-comments/model/highlightColors';
import {
  buildCommentThreads,
  countReplies,
} from '@/features/manage-comments/lib/buildCommentThreads';
import {
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useUpdateCommentMutation,
} from '@/features/manage-comments/model/useCommentMutations';

type CommentsPanelProps = {
  documentId: string;
  comments: CommentDto[];
  selectedId: string | null;
  onSelect: (commentId: string) => void;
  onNavigate: (pageIndex: number) => void;
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

export const CommentsPanel = ({
  documentId,
  comments,
  selectedId,
  onSelect,
  onNavigate,
}: CommentsPanelProps) => {
  const threads = useMemo(() => buildCommentThreads(comments), [comments]);
  const replyCount = countReplies(comments);
  const openCount = threads.filter((t) => !t.root.resolved).length;

  const createMutation = useCreateCommentMutation(documentId);
  const updateMutation = useUpdateCommentMutation(documentId);
  const deleteMutation = useDeleteCommentMutation(documentId);

  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleToggleResolved = (comment: CommentDto, resolved: boolean) => {
    if (comment.parentCommentId) {
      return;
    }
    void updateMutation.mutateAsync({
      commentId: comment.id,
      body: { resolved },
    });
  };

  const handleSubmitReply = async (parentId: string) => {
    const text = replyText.trim();
    if (!text) {
      return;
    }
    await createMutation.mutateAsync({ text, parentCommentId: parentId });
    setReplyText('');
    setReplyingToId(null);
  };

  return (
    <Paper
      elevation={0}
      square
      sx={{
        width: { xs: '100%', lg: 360 },
        height: { xs: 'min(42vh, 320px)', lg: 'auto' },
        flexShrink: 0,
        borderLeft: { lg: 1 },
        borderTop: { xs: 1, lg: 0 },
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ p: 2, flexShrink: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Комментарии
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {openCount} открытых · {threads.length} обсуждений
          {replyCount > 0 ? ` · ${replyCount} ответов` : ''}
        </Typography>
      </Box>
      <Divider />

      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {threads.length === 0 && (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Пока нет комментариев. Выделите текст, область или поставьте метку на странице.
            </Typography>
          </Box>
        )}

        {threads.map(({ root, replies }) => {
          const threadSelected =
            selectedId === root.id || replies.some((r) => r.id === selectedId);
          return (
            <Box
              key={root.id}
              sx={{
                px: 1.5,
                py: 1.25,
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: threadSelected ? 'action.selected' : 'transparent',
                opacity: root.resolved ? 0.72 : 1,
              }}
            >
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'flex-start' }}>
                <FormControlLabel
                  sx={{ m: 0, alignItems: 'flex-start' }}
                  control={
                    <Checkbox
                      size="small"
                      checked={root.resolved}
                      disabled={updateMutation.isPending}
                      onChange={(event) => handleToggleResolved(root, event.target.checked)}
                      onClick={(event) => event.stopPropagation()}
                    />
                  }
                  label={
                    <Typography variant="caption" color="text.secondary" sx={{ pt: 0.75 }}>
                      Решён
                    </Typography>
                  }
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack
                    spacing={0.5}
                    onClick={() => {
                      onSelect(root.id);
                      onNavigate(root.pageIndex);
                    }}
                    sx={{ cursor: 'pointer' }}
                  >
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          bgcolor: root.highlightColor ?? DEFAULT_HIGHLIGHT_COLOR,
                          border: 1,
                          borderColor: 'divider',
                          flexShrink: 0,
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        стр. {root.pageIndex + 1} · {root.author.name} ·{' '}
                        {formatTime(root.createdAt)}
                      </Typography>
                    </Stack>
                    <Typography
                      variant="body2"
                      sx={{
                        textDecoration: root.resolved ? 'line-through' : 'none',
                        color: root.resolved ? 'text.secondary' : 'text.primary',
                      }}
                    >
                      {root.text}
                    </Typography>
                  </Stack>

                  {replies.length > 0 && (
                    <Stack spacing={1} sx={{ mt: 1.5, pl: 1.5, borderLeft: 2, borderColor: 'divider' }}>
                      {replies.map((reply) => (
                        <Box
                          key={reply.id}
                          onClick={() => {
                            onSelect(reply.id);
                            onNavigate(reply.pageIndex);
                          }}
                          sx={{ cursor: 'pointer' }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            {reply.author.name} · {formatTime(reply.createdAt)}
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                            {reply.text}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}

                  <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: 'center' }}>
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => {
                        setReplyingToId((current) => (current === root.id ? null : root.id));
                        setReplyText('');
                      }}
                    >
                      {replyingToId === root.id ? 'Скрыть' : 'Ответить'}
                    </Button>
                    <Tooltip title="Удалить обсуждение">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => void deleteMutation.mutateAsync(root.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>

                  <Collapse in={replyingToId === root.id}>
                    <Stack spacing={1} sx={{ mt: 1 }} onClick={(event) => event.stopPropagation()}>
                      <TextField
                        size="small"
                        placeholder={`Ответить ${root.author.name}…`}
                        value={replyText}
                        onChange={(event) => setReplyText(event.target.value)}
                        multiline
                        minRows={2}
                        autoFocus
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                            event.preventDefault();
                            void handleSubmitReply(root.id);
                          }
                        }}
                      />
                      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                        <Button size="small" onClick={() => setReplyingToId(null)}>
                          Отмена
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          disabled={!replyText.trim() || createMutation.isPending}
                          onClick={() => void handleSubmitReply(root.id)}
                        >
                          Отправить
                        </Button>
                      </Stack>
                    </Stack>
                  </Collapse>
                </Box>
              </Stack>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
};
