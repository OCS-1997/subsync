import React, { useState, useEffect } from 'react';
import { Calculator, X, DollarSign } from 'lucide-react';
import { CSSTransition } from 'react-transition-group';
import { useDraggable } from './useDraggable';
import { useCalculator } from './useCalculator';
import { useCurrencyConverter } from './useCurrencyConverter';
import CalculatorDisplay from './CalculatorDisplay';
import CalculatorButtons from './CalculatorButtons';
import CurrencyConverter from './CurrencyConverter';
import './FloatingCalculator.css';

const MODE_KEY = 'calculator-last-mode';

const FloatingCalculator = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem(MODE_KEY) || 'calculator';
    });

    const { position, isDragging, dragRef, handleMouseDown } = useDraggable({ x: 20, y: 100 });
    const calculator = useCalculator();
    const converter = useCurrencyConverter();

    // Save active tab to localStorage
    useEffect(() => {
        localStorage.setItem(MODE_KEY, activeTab);
    }, [activeTab]);

    // Listen for toggle event from NavBar
    useEffect(() => {
        const handleToggleEvent = () => {
            setIsOpen((prev) => !prev);
        };

        window.addEventListener('toggleCalculator', handleToggleEvent);
        return () => window.removeEventListener('toggleCalculator', handleToggleEvent);
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl + Shift + C to toggle calculator
            if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                setIsOpen((prev) => !prev);
            }

            // Escape to close
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }

            // Calculator keyboard input (only when calculator is open and on calculator tab)
            if (isOpen && activeTab === 'calculator') {
                if (/^[0-9]$/.test(e.key)) {
                    e.preventDefault();
                    calculator.handleNumber(e.key);
                } else if (e.key === '.') {
                    e.preventDefault();
                    calculator.handleDecimal();
                } else if (e.key === '+') {
                    e.preventDefault();
                    calculator.handleOperator('+');
                } else if (e.key === '-') {
                    e.preventDefault();
                    calculator.handleOperator('-');
                } else if (e.key === '*') {
                    e.preventDefault();
                    calculator.handleOperator('×');
                } else if (e.key === '/') {
                    e.preventDefault();
                    calculator.handleOperator('÷');
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    calculator.handleEquals();
                } else if (e.key === 'Backspace') {
                    e.preventDefault();
                    calculator.handleBackspace();
                } else if (e.key === 'Delete') {
                    e.preventDefault();
                    calculator.handleClear();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, activeTab, calculator]);

    const handleClose = () => {
        setIsOpen(false);
    };

    return (
        <>
            {/* Calculator Panel - No floating toggle button, only opens from NavBar */}
            <CSSTransition
                in={isOpen}
                timeout={300}
                classNames="calculator-panel"
                unmountOnExit
            >
                <div
                    ref={dragRef}
                    className={`calculator-panel ${isDragging ? 'dragging' : ''}`}
                    style={{
                        left: `${position.x}px`,
                        top: `${position.y}px`,
                    }}
                >
                    {/* Header */}
                    <div className="calculator-header" onMouseDown={handleMouseDown}>
                        <h3>
                            <Calculator className="h-5 w-5" />
                            Calculator
                        </h3>
                        <div className="calculator-header-actions">
                            <button
                                className="calculator-header-button"
                                onClick={handleClose}
                                title="Close (Esc)"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="calculator-tabs">
                        <button
                            className={`calculator-tab ${activeTab === 'calculator' ? 'active' : ''}`}
                            onClick={() => setActiveTab('calculator')}
                        >
                            <Calculator className="h-4 w-4 inline mr-1" />
                            Calculator
                        </button>
                        <button
                            className={`calculator-tab ${activeTab === 'currency' ? 'active' : ''}`}
                            onClick={() => setActiveTab('currency')}
                        >
                            <DollarSign className="h-4 w-4 inline mr-1" />
                            Currency
                        </button>
                    </div>

                    {/* Content */}
                    <div className="calculator-content">
                        {activeTab === 'calculator' ? (
                            <>
                                <CalculatorDisplay
                                    display={calculator.display}
                                    expression={calculator.expression}
                                />
                                <CalculatorButtons calculator={calculator} />
                            </>
                        ) : (
                            <CurrencyConverter converter={converter} />
                        )}
                    </div>
                </div>
            </CSSTransition>
        </>
    );
};

export default FloatingCalculator;
