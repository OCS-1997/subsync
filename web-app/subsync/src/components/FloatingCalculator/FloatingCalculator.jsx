import { useState, useEffect, useRef } from 'react';
import { Calculator, Minimize2 } from 'lucide-react';
import CalculatorPanel from './CalculatorPanel';
import './styles.css';

export default function FloatingCalculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRect, setButtonRect] = useState(null);
  const buttonRef = useRef(null);

  const captureButtonRect = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setButtonRect({
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
    });
  };

  useEffect(() => {
    captureButtonRect();
    window.addEventListener('resize', captureButtonRect);
    return () => window.removeEventListener('resize', captureButtonRect);
  }, []);

  useEffect(() => {
    if (isOpen) {
      captureButtonRect();
    }
  }, [isOpen]);

  const togglePanel = () => {
    captureButtonRect();
    setIsOpen((prev) => !prev);
  };

  return (
    <>
      <button
        ref={buttonRef}
        className={`floating-calculator-button ${isOpen ? 'open' : ''}`}
        onClick={togglePanel}
        aria-label="Open calculator"
        title="Calculator"
      >
        {isOpen ? (
          <Minimize2 className="w-5 h-5" />
        ) : (
          <Calculator className="w-5 h-5" />
        )}
      </button>
      <CalculatorPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        anchorRect={buttonRect}
      />
    </>
  );
}
