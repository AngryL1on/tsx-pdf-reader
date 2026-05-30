import { useEffect } from 'react';

type ShortcutHandlers = {
  onFind?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onNextPage?: () => void;
  onPrevPage?: () => void;
  onFirstPage?: () => void;
  onLastPage?: () => void;
};

export const usePdfViewerShortcuts = (handlers: ShortcutHandlers, enabled: boolean) => {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.ctrlKey || event.metaKey;
      if (mod && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        handlers.onFind?.();
        return;
      }
      if (mod && (event.key === '=' || event.key === '+')) {
        event.preventDefault();
        handlers.onZoomIn?.();
        return;
      }
      if (mod && event.key === '-') {
        event.preventDefault();
        handlers.onZoomOut?.();
        return;
      }
      if (event.key === 'PageDown' || event.key === 'ArrowDown') {
        handlers.onNextPage?.();
        return;
      }
      if (event.key === 'PageUp' || event.key === 'ArrowUp') {
        handlers.onPrevPage?.();
        return;
      }
      if (event.key === 'Home') {
        event.preventDefault();
        handlers.onFirstPage?.();
        return;
      }
      if (event.key === 'End') {
        event.preventDefault();
        handlers.onLastPage?.();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, handlers]);
};
