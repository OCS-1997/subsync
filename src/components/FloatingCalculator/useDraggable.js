import { useCallback, useEffect, useRef, useState } from 'react';

const SNAP_MARGIN = 20;

const isBrowser = () => typeof window !== 'undefined';

const useDraggable = ({
  storageKey = 'calculator-position',
  defaultPosition = { x: SNAP_MARGIN, y: SNAP_MARGIN },
} = {}) => {
  const panelRef = useRef(null);
  const [position, setPosition] = useState(defaultPosition);
  const positionRef = useRef(defaultPosition);
  const dragStateRef = useRef(null);
  const frameRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const persistPosition = useCallback(
    (coords) => {
      if (!isBrowser()) return;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        localStorage.setItem(storageKey, JSON.stringify(coords));
      }, 200);
    },
    [storageKey],
  );

  const applyBounds = useCallback(
    (coords) => {
      if (!isBrowser()) return coords;
      const element = panelRef.current;
      if (!element) return coords;

      const { innerWidth, innerHeight } = window;
      const rect = element.getBoundingClientRect();
      const width = rect.width || 320;
      const height = rect.height || 480;

      const maxX = Math.max(SNAP_MARGIN, innerWidth - width - SNAP_MARGIN);
      const maxY = Math.max(SNAP_MARGIN, innerHeight - height - SNAP_MARGIN);

      return {
        x: Math.min(Math.max(SNAP_MARGIN, coords.x), maxX),
        y: Math.min(Math.max(SNAP_MARGIN, coords.y), maxY),
      };
    },
    [],
  );

  const snapToEdges = useCallback(
    (coords) => {
      if (!isBrowser()) return coords;
      const element = panelRef.current;
      if (!element) return coords;

      const { innerWidth } = window;
      const rect = element.getBoundingClientRect();
      const width = rect.width || 320;
      const snapThreshold = SNAP_MARGIN * 2;
      const maxX = Math.max(SNAP_MARGIN, innerWidth - width - SNAP_MARGIN);

      if (coords.x <= snapThreshold) {
        return { ...coords, x: SNAP_MARGIN };
      }
      if (coords.x >= maxX - snapThreshold) {
        return { ...coords, x: maxX };
      }
      return coords;
    },
    [],
  );

  const computeDefaultPosition = useCallback(() => {
    if (!isBrowser()) return defaultPosition;
    const element = panelRef.current;
    const { innerWidth, innerHeight } = window;
    const width = element?.offsetWidth || 340;
    const height = element?.offsetHeight || 480;

    return {
      x: Math.max(SNAP_MARGIN, innerWidth - width - SNAP_MARGIN),
      y: Math.max(SNAP_MARGIN, innerHeight - height - SNAP_MARGIN),
    };
  }, [defaultPosition]);

  const setClampedPosition = useCallback(
    (coords, { persist = false } = {}) => {
      const bounded = applyBounds(coords);
      positionRef.current = bounded;
      setPosition(bounded);
      if (persist) {
        persistPosition(bounded);
      }
    },
    [applyBounds, persistPosition],
  );

  useEffect(() => {
    if (!isBrowser()) return;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setClampedPosition(parsed);
        return;
      } catch (error) {
        console.warn('Unable to parse saved calculator position', error);
      }
    }

    requestAnimationFrame(() => {
      const fallback = computeDefaultPosition();
      setClampedPosition(fallback, { persist: true });
    });
  }, [computeDefaultPosition, setClampedPosition, storageKey]);

  useEffect(
    () => () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    },
    [],
  );

  const handlePointerMove = useCallback(
    (event) => {
      if (!dragStateRef.current) return;
      const { startX, startY, initialX, initialY } = dragStateRef.current;
      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      const nextPosition = applyBounds({
        x: initialX + deltaX,
        y: initialY + deltaY,
      });

      if (!frameRef.current) {
        frameRef.current = requestAnimationFrame(() => {
          positionRef.current = nextPosition;
          setPosition(nextPosition);
          frameRef.current = null;
        });
      }
    },
    [applyBounds],
  );

  const endDrag = useCallback(() => {
    if (!dragStateRef.current) return;
    dragStateRef.current = null;
    setIsDragging(false);
    const snapped = snapToEdges(positionRef.current);
    setClampedPosition(snapped, { persist: true });
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', endDrag);
  }, [handlePointerMove, setClampedPosition, snapToEdges]);

  const handlePointerDown = useCallback(
    (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      const currentPos = positionRef.current;
      dragStateRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        initialX: currentPos.x,
        initialY: currentPos.y,
      };
      setIsDragging(true);
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', endDrag);
    },
    [endDrag, handlePointerMove],
  );

  useEffect(() => {
    if (!isBrowser()) return;
    const handleResize = () => {
      setClampedPosition(positionRef.current, { persist: true });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setClampedPosition]);

  return {
    panelRef,
    position,
    handlePointerDown,
    isDragging,
    setPosition: setClampedPosition,
  };
};

export default useDraggable;

