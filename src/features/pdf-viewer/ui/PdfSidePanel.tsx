import {
  AccountTree as AccountTreeIcon,
  Attachment as AttachmentIcon,
  ViewModule as ViewModuleIcon,
} from '@mui/icons-material';
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { Page } from 'react-pdf';
import { DocumentAttachmentsPanel } from '@/features/document-attachments';
import type { EmbeddedPdfAttachment } from '@/entities/document-attachment';
import type { OutlineItem, SidePanelTab } from '@/features/pdf-viewer/model/types';

type PdfSidePanelProps = {
  documentId: string;
  tab: SidePanelTab;
  onTabChange: (tab: SidePanelTab) => void;
  numPages: number;
  pageNumber: number;
  onPageSelect: (page: number) => void;
  outline: OutlineItem[];
  outlineLoading: boolean;
  embeddedAttachments: EmbeddedPdfAttachment[];
  embeddedAttachmentsLoading: boolean;
};

const OutlineTree = ({
  items,
  depth,
  onNavigate,
}: {
  items: OutlineItem[];
  depth: number;
  onNavigate: (pageIndex: number) => void;
}) => (
  <>
    {items.map((item, index) => (
      <Box key={`${depth}-${item.title}-${String(index)}`}>
        <ListItemButton
          disabled={item.pageIndex === null}
          sx={{ pl: 2 + depth * 2 }}
          onClick={() => {
            if (item.pageIndex !== null) {
              onNavigate(item.pageIndex + 1);
            }
          }}
        >
          <ListItemText
            primary={item.title}
            secondary={item.pageIndex !== null ? `стр. ${item.pageIndex + 1}` : undefined}
          />
        </ListItemButton>
        {item.items.length > 0 && (
          <OutlineTree items={item.items} depth={depth + 1} onNavigate={onNavigate} />
        )}
      </Box>
    ))}
  </>
);

export const PdfSidePanel = ({
  documentId,
  tab,
  onTabChange,
  numPages,
  pageNumber,
  onPageSelect,
  outline,
  outlineLoading,
  embeddedAttachments,
  embeddedAttachmentsLoading,
}: PdfSidePanelProps) => {
  if (tab === 'none') {
    return null;
  }

  return (
    <Paper
      elevation={0}
      square
      sx={{
        width: { xs: 200, sm: 220 },
        height: '100%',
        borderRight: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        bgcolor: 'background.paper',
      }}
    >
      <Tabs
        value={tab}
        onChange={(_, value: SidePanelTab) => onTabChange(value)}
        variant="fullWidth"
        sx={{ minHeight: 40 }}
      >
        <Tab icon={<ViewModuleIcon fontSize="small" />} value="thumbnails" aria-label="Миниатюры" />
        <Tab icon={<AccountTreeIcon fontSize="small" />} value="outline" aria-label="Оглавление" />
        <Tab
          icon={<AttachmentIcon fontSize="small" />}
          value="attachments"
          aria-label="Вложения"
        />
      </Tabs>

      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {tab === 'thumbnails' &&
          Array.from({ length: numPages }, (_, index) => {
            const page = index + 1;
            return (
              <Box
                key={page}
                onClick={() => onPageSelect(page)}
                sx={{
                  mb: 1,
                  p: 0.5,
                  borderRadius: 1,
                  border: 2,
                  borderColor: page === pageNumber ? 'primary.main' : 'transparent',
                  cursor: 'pointer',
                  bgcolor: 'background.default',
                }}
              >
                <Page
                  pageNumber={page}
                  width={160}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
                <Typography variant="caption" sx={{ display: 'block', textAlign: 'center' }}>
                  {page}
                </Typography>
              </Box>
            );
          })}

        {tab === 'outline' && (
          <>
            {outlineLoading && (
              <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
                Загрузка оглавления…
              </Typography>
            )}
            {!outlineLoading && outline.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
                Оглавление отсутствует
              </Typography>
            )}
            {!outlineLoading && outline.length > 0 && (
              <List dense disablePadding>
                <OutlineTree items={outline} depth={0} onNavigate={onPageSelect} />
              </List>
            )}
          </>
        )}

        {tab === 'attachments' && (
          <DocumentAttachmentsPanel
            documentId={documentId}
            embedded={embeddedAttachments}
            embeddedLoading={embeddedAttachmentsLoading}
          />
        )}
      </Box>
    </Paper>
  );
};
