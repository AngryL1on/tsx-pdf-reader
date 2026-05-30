import {
  Fullscreen as FullscreenIcon,
  PanTool as PanToolIcon,
  RotateLeft as RotateLeftIcon,
  RotateRight as RotateRightIcon,
  TouchApp as TouchAppIcon,
} from '@mui/icons-material';
import { Divider, Menu, MenuItem, Typography } from '@mui/material';
import type { CursorTool, ScrollMode, SpreadMode } from '@/features/pdf-viewer/model/types';

type PdfViewerMenuProps = {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  scrollMode: ScrollMode;
  spreadMode: SpreadMode;
  cursorTool: CursorTool;
  rotation: number;
  onScrollModeChange: (mode: ScrollMode) => void;
  onSpreadModeChange: (mode: SpreadMode) => void;
  onCursorToolChange: (tool: CursorTool) => void;
  onRotateCw: () => void;
  onRotateCcw: () => void;
  onPresentationMode: () => void;
};

const checked = (active: boolean) => (active ? '✓ ' : '');

export const PdfViewerMenu = ({
  anchorEl,
  open,
  onClose,
  scrollMode,
  spreadMode,
  cursorTool,
  rotation,
  onScrollModeChange,
  onSpreadModeChange,
  onCursorToolChange,
  onRotateCw,
  onRotateCcw,
  onPresentationMode,
}: PdfViewerMenuProps) => (
  <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
    <MenuItem disabled>
      <Typography variant="caption" color="text.secondary">
        Прокрутка
      </Typography>
    </MenuItem>
    <MenuItem onClick={() => onScrollModeChange('page')}>
      {checked(scrollMode === 'page')}Постранично
    </MenuItem>
    <MenuItem onClick={() => onScrollModeChange('vertical')}>
      {checked(scrollMode === 'vertical')}Вертикальная
    </MenuItem>
    <MenuItem onClick={() => onScrollModeChange('horizontal')}>
      {checked(scrollMode === 'horizontal')}Горизонтальная
    </MenuItem>
    <MenuItem onClick={() => onScrollModeChange('wrapped')}>
      {checked(scrollMode === 'wrapped')}Плитка
    </MenuItem>

    <Divider />
    <MenuItem disabled>
      <Typography variant="caption" color="text.secondary">
        Разворот
      </Typography>
    </MenuItem>
    <MenuItem onClick={() => onSpreadModeChange('none')}>
      {checked(spreadMode === 'none')}Одна страница
    </MenuItem>
    <MenuItem onClick={() => onSpreadModeChange('odd')}>
      {checked(spreadMode === 'odd')}Разворот (нечётные справа)
    </MenuItem>
    <MenuItem onClick={() => onSpreadModeChange('even')}>
      {checked(spreadMode === 'even')}Разворот (чётные слева)
    </MenuItem>

    <Divider />
    <MenuItem onClick={() => onCursorToolChange('select')}>
      <TouchAppIcon fontSize="small" sx={{ mr: 1 }} />
      {checked(cursorTool === 'select')}Выделение
    </MenuItem>
    <MenuItem onClick={() => onCursorToolChange('hand')}>
      <PanToolIcon fontSize="small" sx={{ mr: 1 }} />
      {checked(cursorTool === 'hand')}Рука (панорамирование)
    </MenuItem>

    <Divider />
    <MenuItem onClick={onRotateCcw}>
      <RotateLeftIcon fontSize="small" sx={{ mr: 1 }} />
      Повернуть против часовой ({rotation}°)
    </MenuItem>
    <MenuItem onClick={onRotateCw}>
      <RotateRightIcon fontSize="small" sx={{ mr: 1 }} />
      Повернуть по часовой ({rotation}°)
    </MenuItem>

    <Divider />
    <MenuItem onClick={onPresentationMode}>
      <FullscreenIcon fontSize="small" sx={{ mr: 1 }} />
      Полноэкранный режим
    </MenuItem>
  </Menu>
);
