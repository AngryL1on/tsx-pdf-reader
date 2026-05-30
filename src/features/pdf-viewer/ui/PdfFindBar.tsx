import {
  Close as CloseIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
} from '@mui/icons-material';
import {
  Checkbox,
  FormControlLabel,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

type PdfFindBarProps = {
  query: string;
  caseSensitive: boolean;
  matchCount: number;
  activeMatchIndex: number;
  searching: boolean;
  onQueryChange: (value: string) => void;
  onCaseSensitiveChange: (value: boolean) => void;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
};

export const PdfFindBar = ({
  query,
  caseSensitive,
  matchCount,
  activeMatchIndex,
  searching,
  onQueryChange,
  onCaseSensitiveChange,
  onPrev,
  onNext,
  onClose,
}: PdfFindBarProps) => (
  <Stack
    direction="row"
    spacing={1}
    sx={{
      alignItems: 'center',
      flexWrap: 'wrap',
      px: 2,
      py: 1,
      borderBottom: 1,
      borderColor: 'divider',
      bgcolor: 'action.hover',
    }}
  >
    <TextField
      size="small"
      placeholder="Найти в документе"
      value={query}
      onChange={(event) => onQueryChange(event.target.value)}
      autoFocus
      sx={{ minWidth: 220, flex: 1 }}
    />
    <FormControlLabel
      control={
        <Checkbox
          size="small"
          checked={caseSensitive}
          onChange={(event) => onCaseSensitiveChange(event.target.checked)}
        />
      }
      label="Учитывать регистр"
    />
    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
      {searching
        ? 'Поиск…'
        : query
          ? matchCount
            ? `${activeMatchIndex + 1} из ${matchCount}`
            : 'Не найдено'
          : ''}
    </Typography>
    <Tooltip title="Предыдущее совпадение">
      <span>
        <IconButton size="small" onClick={onPrev} disabled={!matchCount}>
          <KeyboardArrowUpIcon fontSize="small" />
        </IconButton>
      </span>
    </Tooltip>
    <Tooltip title="Следующее совпадение">
      <span>
        <IconButton size="small" onClick={onNext} disabled={!matchCount}>
          <KeyboardArrowDownIcon fontSize="small" />
        </IconButton>
      </span>
    </Tooltip>
    <IconButton size="small" onClick={onClose} aria-label="Закрыть поиск">
      <CloseIcon fontSize="small" />
    </IconButton>
  </Stack>
);
