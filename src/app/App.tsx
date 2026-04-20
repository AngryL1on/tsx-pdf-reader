import { Navigate, Route, Routes } from 'react-router-dom';
import { DocumentReaderPage } from '@/pages/document-reader';
import { HomePage } from '@/pages/home';

export const App = () => (
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/documents/:documentId" element={<DocumentReaderPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
