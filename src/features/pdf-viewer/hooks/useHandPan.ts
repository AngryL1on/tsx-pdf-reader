import { useEffect, type RefObject } from 'react';

export const useHandPan = (
  enabled: boolean,
  containerRef: RefObject<HTMLElement | null>,
) => {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let scrollLeft = 0;
    let scrollTop = 0;

    const onMouseDown = (event: MouseEvent) => {
      if (event.button !== 0) {
        return;
      }
      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
      scrollLeft = container.scrollLeft;
      scrollTop = container.scrollTop;
      container.style.cursor = 'grabbing';
      event.preventDefault();
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!dragging) {
        return;
      }
      container.scrollLeft = scrollLeft - (event.clientX - startX);
      container.scrollTop = scrollTop - (event.clientY - startY);
    };

    const stopDragging = () => {
      dragging = false;
      container.style.cursor = 'grab';
    };

    container.style.cursor = 'grab';
    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stopDragging);

    return () => {
      container.style.cursor = '';
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stopDragging);
    };
  }, [enabled, containerRef]);
};
