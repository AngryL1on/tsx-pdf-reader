/** Как в pdf.js web/ui_utils.js */
export const DEFAULT_SCALE_VALUE = 'auto';
export const DEFAULT_SCALE = 1;
export const DEFAULT_SCALE_DELTA = 1.1;
export const MIN_SCALE = 0.1;
export const MAX_SCALE = 10;
export const MAX_AUTO_SCALE = 1.25;
export const SCROLLBAR_PADDING = 40;
export const VERTICAL_PADDING = 5;

/** @deprecated используйте DEFAULT_SCALE_DELTA */
export const ZOOM_STEP = 0.25;

export const LAYOUT_SCALE_PRESETS = [
  'auto',
  'page-actual',
  'page-fit',
  'page-width',
] as const;

/** Значение Select, когда масштаб задан числом (110%, 1.21 и т.д.), а не пунктом меню. */
export const CUSTOM_SCALE_SELECT_VALUE = 'custom';

export const formatScalePercentLabel = (scale: number) => `${Math.round(scale * 100)}%`;

export const SCALE_PRESET_OPTIONS = [
  { value: 'auto', label: 'Авто' },
  { value: 'page-actual', label: 'Реальный размер' },
  { value: 'page-fit', label: 'Вписать страницу' },
  { value: 'page-width', label: 'По ширине' },
  { value: '0.5', label: '50%' },
  { value: '0.75', label: '75%' },
  { value: '1', label: '100%' },
  { value: '1.25', label: '125%' },
  { value: '1.5', label: '150%' },
  { value: '2', label: '200%' },
] as const;

export const isLayoutScalePreset = (
  value: string,
): value is (typeof LAYOUT_SCALE_PRESETS)[number] =>
  (LAYOUT_SCALE_PRESETS as readonly string[]).includes(value);

/** Строковый пресет (auto, page-width) — не число. */
export const isPresetScaleValue = (value: string) => Number.isNaN(Number.parseFloat(value));
