import {
  BorderColor as BorderColorIcon,
  NearMe as NearMeIcon,
  TextFields as TextFieldsIcon,
  TouchApp as TouchAppIcon,
} from '@mui/icons-material';
import { Stack, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';
import type { CommentTool } from '@/features/manage-comments/model/commentTools';
import { HighlightColorPicker } from '@/features/manage-comments/ui/HighlightColorPicker';

type CommentToolsBarProps = {
  tool: CommentTool;
  highlightColor: string;
  onToolChange: (tool: CommentTool) => void;
  onHighlightColorChange: (color: string) => void;
};

export const CommentToolsBar = ({
  tool,
  highlightColor,
  onToolChange,
  onHighlightColorChange,
}: CommentToolsBarProps) => (
  <Stack
    direction="row"
    spacing={1}
    sx={{
      alignItems: 'center',
      flexWrap: 'wrap',
      px: 2,
      py: 0.75,
      gap: 1,
      borderBottom: 1,
      borderColor: 'divider',
      bgcolor: 'background.paper',
    }}
  >
    <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5, flexShrink: 0 }}>
      Комментарии:
    </Typography>
    <ToggleButtonGroup
      size="small"
      exclusive
      value={tool}
      onChange={(_, value: CommentTool | null) => {
        if (value) {
          onToolChange(value);
        }
      }}
      sx={{ flexWrap: 'wrap' }}
    >
      <ToggleButton value="view">
        <Tooltip title="Просмотр">
          <TouchAppIcon fontSize="small" />
        </Tooltip>
      </ToggleButton>
      <ToggleButton value="text">
        <Tooltip title="Выделить текст">
          <TextFieldsIcon fontSize="small" />
        </Tooltip>
      </ToggleButton>
      <ToggleButton value="highlight">
        <Tooltip title="Подсветить область">
          <BorderColorIcon fontSize="small" />
        </Tooltip>
      </ToggleButton>
      <ToggleButton value="pin">
        <Tooltip title="Комментарий на странице">
          <NearMeIcon fontSize="small" />
        </Tooltip>
      </ToggleButton>
    </ToggleButtonGroup>
    {tool !== 'view' && (
      <HighlightColorPicker
        value={highlightColor}
        onChange={onHighlightColorChange}
        compact
      />
    )}
    {tool !== 'view' && (
      <Typography variant="caption" color="primary" sx={{ flex: 1, minWidth: 120 }}>
        {tool === 'text' && 'Выделите текст на странице'}
        {tool === 'highlight' && 'Потяните мышью по области'}
        {tool === 'pin' && 'Кликните в нужное место'}
      </Typography>
    )}
  </Stack>
);
