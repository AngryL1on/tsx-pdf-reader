import { useEffect, useState } from 'react';
import { resolvePdfSrc } from '@/shared/lib/resolvePdfSrc';

export type PdfFileDataState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; resolvedUrl: string; message: string }
  | { status: 'ready'; resolvedUrl: string; file: { data: Uint8Array } };

/**
 * Загружает PDF в основном потоке и отдаёт байты для react-pdf.
 * Так надёжнее, чем передавать строковый URL: pdf.js не делает второй fetch
 * (в т.ч. из worker), что часто ломается при MSW или нестандартном SW.
 */
export const usePdfFileData = (pdfUrl: string | undefined): PdfFileDataState => {
  const [state, setState] = useState<PdfFileDataState>({ status: 'idle' });

  useEffect(() => {
    if (!pdfUrl) {
      return;
    }

    let cancelled = false;
    const resolved = resolvePdfSrc(pdfUrl);

    void fetch(resolved)
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Ответ сервера ${response.status} ${response.statusText}. Запрошен адрес: ${resolved}`,
          );
        }
        return response.arrayBuffer();
      })
      .then((buffer) => {
        if (cancelled) {
          return;
        }
        const data = new Uint8Array(buffer);
        setState({ status: 'ready', resolvedUrl: resolved, file: { data } });
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        const message = error instanceof Error ? error.message : String(error);
        setState({ status: 'error', resolvedUrl: resolved, message });
      });

    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  if (!pdfUrl) {
    return { status: 'idle' };
  }

  const resolved = resolvePdfSrc(pdfUrl);

  if (state.status === 'idle') {
    return { status: 'loading' };
  }

  if (state.status === 'ready' && state.resolvedUrl !== resolved) {
    return { status: 'loading' };
  }

  if (state.status === 'error' && state.resolvedUrl !== resolved) {
    return { status: 'loading' };
  }

  return state;
};
