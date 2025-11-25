import { useState, useCallback } from 'react';

const OPERATORS = ['+', '-', '×', '÷'];

export const useCalculator = () => {
    const [display, setDisplay] = useState('0');
    const [expression, setExpression] = useState('');
    const [memory, setMemory] = useState(0);
    const [lastInputType, setLastInputType] = useState('number'); // number | operator | equals | clear

    const handleNumber = useCallback((num) => {
        setDisplay((prev) => {
            if (prev === 'Error' || lastInputType === 'operator' || lastInputType === 'equals' || prev === '0') {
                return num;
            }
            return prev + num;
        });
        setLastInputType('number');
    }, [lastInputType]);

    const handleOperator = useCallback((op) => {
        setExpression((prev) => {
            const currentValue = display === 'Error' ? '0' : display;

            if (!prev) {
                return `${currentValue}${op}`;
            }

            const lastChar = prev.slice(-1);

            if (OPERATORS.includes(lastChar)) {
                if (lastInputType === 'operator') {
                    return prev.slice(0, -1) + op;
                }
                return prev + currentValue + op;
            }

            return prev + currentValue + op;
        });
        setDisplay('0');
        setLastInputType('operator');
    }, [display, lastInputType]);

    const handleDecimal = useCallback(() => {
        setDisplay((prev) => {
            if (prev === 'Error' || lastInputType === 'operator' || lastInputType === 'equals') {
                return '0.';
            }
            if (prev.includes('.')) return prev;
            return prev + '.';
        });
        setLastInputType('number');
    }, [lastInputType]);

    const handleClear = useCallback(() => {
        setDisplay('0');
        setExpression('');
        setLastInputType('clear');
    }, []);

    const handleClearEntry = useCallback(() => {
        setDisplay('0');
        setLastInputType('clear');
    }, []);

    const handleBackspace = useCallback(() => {
        setDisplay((prev) => {
            if (prev.length === 1 || prev === 'Error') return '0';
            return prev.slice(0, -1);
        });
        setLastInputType('number');
    }, []);

    const handlePercentage = useCallback(() => {
        setDisplay((prev) => {
            const num = parseFloat(prev);
            if (isNaN(num)) return 'Error';
            return (num / 100).toString();
        });
        setLastInputType('number');
    }, []);

    const handleBrackets = useCallback(() => {
        setExpression((prev) => {
            const openCount = (prev.match(/\(/g) || []).length;
            const closeCount = (prev.match(/\)/g) || []).length;

            if (openCount > closeCount && display === '0') {
                return prev + ')';
            }
            return prev + display + '(';
        });
        setDisplay('0');
        setLastInputType('operator');
    }, [display]);

    const safeEvaluate = (expr) => {
        try {
            // Replace × and ÷ with * and /
            const sanitized = expr
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/[^0-9+\-*/.()]/g, '');

            // Check for division by zero
            if (/\/\s*0(?!\.)/.test(sanitized)) {
                return 'Error';
            }

            // Use Function constructor instead of eval for better safety
            const result = new Function(`return ${sanitized}`)();

            if (!isFinite(result)) return 'Error';

            // Format result
            const formatted = parseFloat(result.toFixed(10));
            return formatted.toString();
        } catch (error) {
            return 'Error';
        }
    };

    const handleEquals = useCallback(() => {
        const fullExpression = expression + display;
        if (!fullExpression) return;

        const result = safeEvaluate(fullExpression);
        setDisplay(result);
        setExpression('');
        setLastInputType('equals');
    }, [expression, display]);

    const handleMemoryAdd = useCallback(() => {
        const num = parseFloat(display);
        if (!isNaN(num)) {
            setMemory((prev) => prev + num);
        }
        setLastInputType('number');
    }, [display]);

    const handleMemorySubtract = useCallback(() => {
        const num = parseFloat(display);
        if (!isNaN(num)) {
            setMemory((prev) => prev - num);
        }
        setLastInputType('number');
    }, [display]);

    const handleMemoryRecall = useCallback(() => {
        setDisplay(memory.toString());
        setLastInputType('number');
    }, [memory]);

    const handleMemoryClear = useCallback(() => {
        setMemory(0);
        setLastInputType('clear');
    }, []);

    return {
        display,
        expression,
        memory,
        handleNumber,
        handleOperator,
        handleDecimal,
        handleClear,
        handleClearEntry,
        handleBackspace,
        handlePercentage,
        handleBrackets,
        handleEquals,
        handleMemoryAdd,
        handleMemorySubtract,
        handleMemoryRecall,
        handleMemoryClear,
    };
};
