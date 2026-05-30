import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { AppProviders } from '@/app/providers/AppProviders';
import { bootstrapMocks } from '@/app/bootstrapMocks';
import { setupPdfWorker } from '@/shared/config/setupPdfWorker';
import '@/app/styles/global.scss';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

setupPdfWorker();

void bootstrapMocks().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </StrictMode>,
  );
});
