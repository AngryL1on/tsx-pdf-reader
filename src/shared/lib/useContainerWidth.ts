import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';

export const useContainerWidth = <T extends HTMLElement>() => {
  const elementRef = useRef<T | null>(null);
  const [element, setElement] = useState<T | null>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const ref = useCallback((node: T | null) => {
    elementRef.current = node;
    setElement(node);
    if (node) {
      setWidth(node.clientWidth);
      setHeight(node.clientHeight);
    } else {
      setWidth(0);
      setHeight(0);
    }
  }, []);

  useLayoutEffect(() => {
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(() => {
      setWidth(element.clientWidth);
      setHeight(element.clientHeight);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return {
    ref,
    elementRef: elementRef as RefObject<T | null>,
    width,
    height,
  };
};
