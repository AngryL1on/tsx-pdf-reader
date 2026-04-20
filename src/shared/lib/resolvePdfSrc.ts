/**
 * Same-origin paths from API (e.g. `/sample.pdf`) must respect Vite `base`
 * (`import.meta.env.BASE_URL`), otherwise the file 404s when the app is not at `/`.
 */
export const resolvePdfSrc = (pdfUrl: string): string => {
  if (/^https?:\/\//i.test(pdfUrl)) {
    return pdfUrl;
  }
  const path = pdfUrl.replace(/^\/+/, '');
  if (typeof window === 'undefined') {
    return `${import.meta.env.BASE_URL}${path}`;
  }
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return new URL(path, `${window.location.origin}${base}`).href;
};
