import { Box, Stack, Tooltip, Typography } from '@mui/material';
import {
  DEFAULT_HIGHLIGHT_COLOR,
  HIGHLIGHT_COLORS,
} from '@/features/manage-comments/model/highlightColors';

type HighlightColorPickerProps = {
  value: string;
  onChange: (color: string) => void;
  compact?: boolean;
};

export const HighlightColorPicker = ({
  value,
  onChange,
  compact = false,
}: HighlightColorPickerProps) => (
  <Stack spacing={0.5}>
    {!compact && (
      <Typography variant="caption" color="text.secondary">
        Цвет подсветки
      </Typography>
    )}
    <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap' }}>
      {HIGHLIGHT_COLORS.map((option) => {
        const selected =
          option.value.toLowerCase() === (value || DEFAULT_HIGHLIGHT_COLOR).toLowerCase();
        return (
          <Tooltip key={option.id} title={option.label}>
            <Box
              component="button"
              type="button"
              aria-label={option.label}
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              sx={{
                width: compact ? 22 : 28,
                height: compact ? 22 : 28,
                borderRadius: '50%',
                border: 2,
                borderColor: selected ? 'primary.main' : 'divider',
                bgcolor: option.value,
                cursor: 'pointer',
                p: 0,
                boxShadow: selected ? 2 : 0,
                transform: selected ? 'scale(1.08)' : 'none',
                transition: (theme) =>
                  theme.transitions.create(['transform', 'border-color', 'box-shadow'], {
                    duration: theme.transitions.duration.shorter,
                  }),
              }}
            />
          </Tooltip>
        );
      })}
    </Stack>
  </Stack>
);
