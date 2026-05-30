import { Navigate, Route, Routes } from 'react-router-dom';
import { AttachmentReaderPage, DocumentReaderPage } from '@/pages/document-reader';
import { HomePage } from '@/pages/home';

export const App = () => (
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/documents/:documentId" element={<DocumentReaderPage />} />
    <Route
      path="/documents/:documentId/attachments/:attachmentId"
      element={<AttachmentReaderPage />}
    />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
