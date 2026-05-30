/**
 * Открывает файл вложения в новой вкладке.
 * Прямой window.open на /api/... в dev попадает в SPA и редиректит на главную.
 */
export const openAttachmentInNewTab = async (
  fileUrl: string,
  mimeType = 'application/pdf',
): Promise<void> => {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error('Не удалось загрузить файл');
  }
  const blob = await response.blob();
  const typed =
    blob.type && blob.type !== 'application/octet-stream'
      ? blob
      : new Blob([blob], { type: mimeType });
  const objectUrl = URL.createObjectURL(typed);
  const opened = window.open(objectUrl, '_blank', 'noopener,noreferrer');
  if (!opened) {
    URL.revokeObjectURL(objectUrl);
    throw new Error('Браузер заблокировал новую вкладку');
  }
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 120_000);
};
