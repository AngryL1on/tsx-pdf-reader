import { pdfjs } from 'react-pdf';
// Версия pdfjs-dist должна совпадать с зависимостью react-pdf (см. package.json).
// ?url — чтобы Vite отдал стабильный URL воркера, совпадающий с основной библиотекой.
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export const setupPdfWorker = () => {
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
};
