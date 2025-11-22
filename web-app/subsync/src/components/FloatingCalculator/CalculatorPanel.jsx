import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { X } from 'lucide-react';
import StandardCalculator from './StandardCalculator';
import CurrencyConverter from './CurrencyConverter';

const PANEL_STORAGE_KEY = 'floating-calculator-panel-position';
const PANEL_DIMENSIONS = { width: 360, height: 540 };
const VIEWPORT_PADDING = 16;

const panelVariants = {
  hidden: {
    opacity: 0,
    scaleY: 0.2,
    scaleX: 0.9,
    y: 60,
    rotate: 0,
    filter: 'blur(12px)',
    transformOrigin: 'bottom right',
  },
  visible: {
    opacity: 1,
    scaleY: 1,
    scaleX: 1,
    y: 0,
    rotate: [0, -1.3, 1.3, -1.3, 1.3, 0],
    filter: 'blur(0px)',
    transition: {
      duration: 0.55,
      ease: [0.16, 1, 0.3, 1],
      rotate: { duration: 0.45, ease: 'easeInOut', delay: 0.1 },
    },
  },
  exit: {
    opacity: 0,
    scaleY: 0.15,
    scaleX: 0.85,
    y: 80,
    rotate: [0, 1.5, -1.5, 1.5, -1.5, 0],
    filter: 'blur(14px)',
    transition: {
      duration: 0.4,
      ease: 'easeInOut',
    },
  },
};

const clampPosition = (position) => {
  if (typeof window === 'undefined') {
    return position;
  }
  const maxX = window.innerWidth - PANEL_DIMENSIONS.width - VIEWPORT_PADDING;
  const maxY = window.innerHeight - PANEL_DIMENSIONS.height - VIEWPORT_PADDING;
  return {
    x: Math.min(Math.max(position.x, VIEWPORT_PADDING), Math.max(maxX, VIEWPORT_PADDING)),
    y: Math.min(Math.max(position.y, VIEWPORT_PADDING), Math.max(maxY, VIEWPORT_PADDING)),
  };
};

const readStoredPosition = () => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(PANEL_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export default function CalculatorPanel({ isOpen, onClose, anchorRect }) {
  const panelRef = useRef(null);
  const dragControls = useDragControls();
  const [storedPosition, setStoredPosition] = useState(() => readStoredPosition());
  const [motionKey, setMotionKey] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    if (!storedPosition) return;
    localStorage.setItem(PANEL_STORAGE_KEY, JSON.stringify(storedPosition));
  }, [storedPosition]);

  useEffect(() => {
    if (!isOpen) return;
    setMotionKey((prev) => prev + 1);
  }, [isOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setStoredPosition((prev) => (prev ? clampPosition(prev) : prev));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const defaultPosition = useMemo(() => {
    if (typeof window === 'undefined') {
      return { x: VIEWPORT_PADDING, y: VIEWPORT_PADDING };
    }
    if (anchorRect) {
      const derived = {
        x: anchorRect.right - PANEL_DIMENSIONS.width + 12,
        y: anchorRect.top - PANEL_DIMENSIONS.height - 24,
      };
      return clampPosition(derived);
    }
    return clampPosition({
      x: window.innerWidth - PANEL_DIMENSIONS.width - VIEWPORT_PADDING,
      y: window.innerHeight - PANEL_DIMENSIONS.height - VIEWPORT_PADDING,
    });
  }, [anchorRect]);

  const resolvedPosition = storedPosition ? clampPosition(storedPosition) : defaultPosition;

  useEffect(() => {
    if (isOpen && !storedPosition) {
      setStoredPosition(resolvedPosition);
    }
  }, [isOpen, resolvedPosition, storedPosition]);

  const handleHeaderPointerDown = (event) => {
    event.preventDefault();
    dragControls.start(event);
  };

  const handleDragEnd = (_, info) => {
    setIsDragging(false);
    setStoredPosition((prev) => {
      const reference = prev ?? resolvedPosition;
      return clampPosition({
        x: reference.x + info.offset.x,
        y: reference.y + info.offset.y,
      });
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key={`floating-calculator-${motionKey}`}
          ref={panelRef}
          className={`calculator-panel ${isDragging ? 'dragging' : ''}`}
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          drag
          dragControls={dragControls}
          dragListener={false}
          dragElastic={0.12}
          dragMomentum={false}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
          style={{
            top: resolvedPosition.y,
            left: resolvedPosition.x,
            transformOrigin: 'bottom right',
          }}
        >
          <div
            className="calculator-panel-header"
            onPointerDown={handleHeaderPointerDown}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            <h2 className="calculator-panel-title">Calculator</h2>
            <button
              className="calculator-panel-close"
              onClick={onClose}
              aria-label="Close calculator"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="calculator-panel-content">
            <StandardCalculator />
            <CurrencyConverter />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
