import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  Menu as MenuIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
} from '@mui/icons-material';
import {
  Box,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  CUSTOM_SCALE_SELECT_VALUE,
  formatScalePercentLabel,
  isLayoutScalePreset,
  isPresetScaleValue,
  MAX_SCALE,
  MIN_SCALE,
  SCALE_PRESET_OPTIONS,
} from '@/features/pdf-viewer/model/constants';

type PdfViewerToolbarProps = {
  pageNumber: number;
  numPages: number;
  currentScaleValue: string;
  currentScale: number;
  sidePanelOpen: boolean;
  findOpen: boolean;
  onPageNumberChange: (page: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onFirstPage: () => void;
  onLastPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onScaleValueChange: (value: string) => void;
  onToggleSidePanel: () => void;
  onToggleFind: () => void;
  onOpenMenu: (anchor: HTMLElement) => void;
};

const resolveScaleLabel = (currentScaleValue: string, currentScale: number) => {
  const preset = SCALE_PRESET_OPTIONS.find((option) => option.value === currentScaleValue);
  if (preset) {
    return preset.label;
  }
  if (isPresetScaleValue(currentScaleValue)) {
    return formatScalePercentLabel(currentScale);
  }
  const numeric = Number.parseFloat(currentScaleValue);
  if (Number.isFinite(numeric) && numeric > 0) {
    return formatScalePercentLabel(numeric);
  }
  return formatScalePercentLabel(currentScale);
};

export const PdfViewerToolbar = ({
  pageNumber,
  numPages,
  currentScaleValue,
  currentScale,
  sidePanelOpen,
  findOpen,
  onPageNumberChange,
  onPrevPage,
  onNextPage,
  onFirstPage,
  onLastPage,
  onZoomIn,
  onZoomOut,
  onScaleValueChange,
  onToggleSidePanel,
  onToggleFind,
  onOpenMenu,
}: PdfViewerToolbarProps) => {
  const presetOption = SCALE_PRESET_OPTIONS.find((option) => option.value === currentScaleValue);
  const selectValue = presetOption?.value ?? CUSTOM_SCALE_SELECT_VALUE;
  const selectedLabel = resolveScaleLabel(currentScaleValue, currentScale);

  const handleScaleChange = (value: string) => {
    if (value === CUSTOM_SCALE_SELECT_VALUE) {
      return;
    }
    if (isLayoutScalePreset(value)) {
      onScaleValueChange(value);
      return;
    }
    const zoom = Number.parseFloat(value);
    if (Number.isFinite(zoom) && zoom > 0) {
      onScaleValueChange(String(zoom));
    }
  };

  return (
    <Box
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          alignItems: 'center',
          flexWrap: 'nowrap',
          p: 1,
          minWidth: 'min-content',
        }}
      >
        <Tooltip title="Боковая панель">
          <IconButton
            size="small"
            color={sidePanelOpen ? 'primary' : 'default'}
            onClick={onToggleSidePanel}
          >
            <MenuIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Поиск (Ctrl+F)">
          <IconButton size="small" color={findOpen ? 'primary' : 'default'} onClick={onToggleFind}>
            <SearchIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Первая страница">
          <span>
            <IconButton size="small" onClick={onFirstPage} disabled={pageNumber <= 1}>
              <FirstPageIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Предыдущая">
          <span>
            <IconButton size="small" onClick={onPrevPage} disabled={pageNumber <= 1}>
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <TextField
          size="small"
          type="number"
          value={pageNumber}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (Number.isFinite(next)) {
              onPageNumberChange(next);
            }
          }}
          slotProps={{
            htmlInput: {
              min: 1,
              max: Math.max(numPages, 1),
              style: { width: 48, textAlign: 'center' },
            },
          }}
          sx={{ width: 72 }}
        />
        <Typography variant="body2" color="text.secondary">
          / {Math.max(numPages, 1)}
        </Typography>

        <Tooltip title="Следующая">
          <span>
            <IconButton size="small" onClick={onNextPage} disabled={pageNumber >= numPages}>
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Последняя страница">
          <span>
            <IconButton size="small" onClick={onLastPage} disabled={pageNumber >= numPages}>
              <LastPageIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Уменьшить">
          <span>
            <IconButton size="small" onClick={onZoomOut} disabled={currentScale <= MIN_SCALE}>
              <ZoomOutIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Select
          size="small"
          value={selectValue}
          onChange={(event) => handleScaleChange(event.target.value)}
          renderValue={() => selectedLabel}
          displayEmpty
          MenuProps={{
            slotProps: {
              paper: { sx: { minWidth: 200 } },
            },
          }}
          sx={{ minWidth: { xs: 130, sm: 168 }, flexShrink: 0 }}
        >
          {SCALE_PRESET_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
          <MenuItem value={CUSTOM_SCALE_SELECT_VALUE} sx={{ display: 'none' }}>
            {selectedLabel}
          </MenuItem>
        </Select>
        <Tooltip title="Увеличить">
          <span>
            <IconButton size="small" onClick={onZoomIn} disabled={currentScale >= MAX_SCALE}>
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Дополнительно">
          <IconButton
            size="small"
            onClick={(event) => onOpenMenu(event.currentTarget)}
            sx={{ ml: 'auto' }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
};
