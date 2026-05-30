import { useEffect, useState, type RefObject } from 'react';

/** Синхронизирует текущую страницу с наиболее видимой в контейнере прокрутки. */
export const usePageVisibility = (
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  onPageChange: (pageNumber: number) => void,
) => {
  const [observed, setObserved] = useState(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const pages = container.querySelectorAll<HTMLElement>('[data-pdf-page]');
    if (!pages.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0]?.target as HTMLElement | undefined;
        const page = top?.dataset.pdfPage;
        if (page) {
          onPageChange(Number(page));
        }
      },
      { root: container, threshold: [0.35, 0.55, 0.75] },
    );

    pages.forEach((page) => observer.observe(page));
    setObserved(pages.length);

    return () => observer.disconnect();
  }, [containerRef, enabled, onPageChange, observed]);

  return observed;
};
