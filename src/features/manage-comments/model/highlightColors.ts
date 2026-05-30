export type HighlightColorOption = {
  id: string;
  value: string;
  label: string;
};

export const HIGHLIGHT_COLORS: HighlightColorOption[] = [
  { id: 'yellow', value: '#FFEB3B', label: 'Жёлтый' },
  { id: 'orange', value: '#FFCC80', label: 'Оранжевый' },
  { id: 'pink', value: '#F48FB1', label: 'Розовый' },
  { id: 'purple', value: '#CE93D8', label: 'Фиолетовый' },
  { id: 'blue', value: '#90CAF9', label: 'Голубой' },
  { id: 'green', value: '#A5D6A7', label: 'Зелёный' },
];

export const DEFAULT_HIGHLIGHT_COLOR = HIGHLIGHT_COLORS[0].value;

const STORAGE_KEY = 'pdf-reader-highlight-color';

export const isValidHighlightColor = (value: string) =>
  HIGHLIGHT_COLORS.some((item) => item.value.toLowerCase() === value.toLowerCase()) ||
  /^#[0-9A-Fa-f]{6}$/.test(value);

export const loadStoredHighlightColor = (): string => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isValidHighlightColor(stored)) {
      return stored;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_HIGHLIGHT_COLOR;
};

export const storeHighlightColor = (color: string) => {
  try {
    localStorage.setItem(STORAGE_KEY, color);
  } catch {
    /* ignore */
  }
};
