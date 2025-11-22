import { useCallback, useEffect, useMemo, useState } from 'react';
import { evaluate } from 'mathjs';

const DISPLAY_OPERATOR_MAP = {
  '*': '×',
  '/': '÷',
};

const sanitizeExpression = (value) => {
  if (!value) return '';
  let cleaned = value.replace(/\s+/g, '');
  while (/[+\-*/.]$/.test(cleaned)) {
    cleaned = cleaned.slice(0, -1);
  }
  const open = (cleaned.match(/\(/g) || []).length;
  const close = (cleaned.match(/\)/g) || []).length;
  if (open > close) {
    cleaned += ')'.repeat(open - close);
  }
  return cleaned;
};

const formatResult = (value) => {
  if (!isFinite(value)) return 'Error';
  if (Math.abs(value) > 1e12 || (Math.abs(value) > 0 && Math.abs(value) < 1e-6)) {
    return value.toExponential(8).replace(/\.?0+e/, 'e');
  }
  const rounded = parseFloat(Number(value).toFixed(10));
  return rounded.toString();
};

const formatForDisplay = (value) =>
  value
    .replace(/\*/g, DISPLAY_OPERATOR_MAP['*'])
    .replace(/\//g, DISPLAY_OPERATOR_MAP['/'])
    .replace(/-/g, '−');

export default function StandardCalculator() {
  const [expression, setExpression] = useState('0');
  const [history, setHistory] = useState('');
  const [memory, setMemory] = useState(0);
  const [shouldReset, setShouldReset] = useState(false);

  const buttonClass = (type = '') => {
    const base = 'calculator-button';
    if (type === 'operator') return `${base} operator`;
    if (type === 'equals') return `${base} equals`;
    if (type === 'clear') return `${base} clear`;
    if (type === 'memory') return `${base} memory`;
    if (type === 'zero') return `${base} zero`;
    return base;
  };

  const handleNumber = useCallback(
    (digit) => {
      const resetState = shouldReset;
      setExpression((prev) => {
        const base = resetState || prev === 'Error' ? '' : prev;
        const normalized = base === '0' ? '' : base;
        const next = `${normalized}${digit}`;
        return next || '0';
      });
      setShouldReset(false);
    },
    [shouldReset],
  );

  const handleDecimal = useCallback(() => {
    const resetState = shouldReset;
    setExpression((prev) => {
      let base = resetState || prev === 'Error' ? '' : prev;
      if (base === '') {
        return '0.';
      }
      const lastNumber = base.split(/[+\-*/()]/).pop();
      if (lastNumber?.includes('.')) {
        return base;
      }
      if (/[+\-*/(]$/.test(base)) {
        return `${base}0.`;
      }
      return `${base}.`;
    });
    setShouldReset(false);
  }, [shouldReset]);

  const handleOperator = useCallback((operator) => {
    setExpression((prev) => {
      let base = prev === 'Error' ? '0' : prev;
      if (!base || base === '') {
        return operator === '-' ? '-' : `0${operator}`;
      }
      if (/[\+\-*/]$/.test(base)) {
        return `${base.slice(0, -1)}${operator}`;
      }
      return `${base}${operator}`;
    });
    setShouldReset(false);
  }, []);

  const handleParenthesis = useCallback(
    (symbol) => {
      const resetState = shouldReset;
      setExpression((prev) => {
        let base = resetState || prev === 'Error' ? '' : prev;
        if (symbol === '(') {
          if (base === '0') base = '';
          if (/[0-9)]$/.test(base)) {
            return `${base}*(`;
          }
          return `${base}(`;
        }
        if (symbol === ')') {
          const open = (base.match(/\(/g) || []).length;
          const close = (base.match(/\)/g) || []).length;
          if (open > close && !/[\+\-*/(]$/.test(base)) {
            return `${base})`;
          }
        }
        return base || '0';
      });
      setShouldReset(false);
    },
    [shouldReset],
  );

  const handleBackspace = useCallback(() => {
    const resetState = shouldReset;
    setExpression((prev) => {
      let base = resetState || prev === 'Error' ? '' : prev;
      if (base.length <= 1) {
        return '0';
      }
      return base.slice(0, -1);
    });
    setShouldReset(false);
  }, [shouldReset]);

  const handleClear = useCallback(() => {
    setExpression('0');
    setHistory('');
    setShouldReset(false);
  }, []);

  const handleEquals = useCallback(() => {
    try {
      const sanitized = sanitizeExpression(expression);
      if (!sanitized) return;
      const result = evaluate(sanitized);
      const formatted = formatResult(result);
      setHistory(formatForDisplay(expression));
      setExpression(formatted);
      setShouldReset(true);
    } catch {
      setHistory(formatForDisplay(expression));
      setExpression('Error');
      setShouldReset(true);
    }
  }, [expression]);

  const handlePercentage = useCallback(() => {
    try {
      const sanitized = sanitizeExpression(expression);
      if (!sanitized) return;
      const result = evaluate(`${sanitized}/100`);
      const formatted = formatResult(result);
      setHistory(`${formatForDisplay(expression)} %`);
      setExpression(formatted);
      setShouldReset(true);
    } catch {
      setHistory(formatForDisplay(expression));
      setExpression('Error');
      setShouldReset(true);
    }
  }, [expression]);

  const handleMemoryAdd = useCallback(() => {
    try {
      const sanitized = sanitizeExpression(expression);
      if (!sanitized) return;
      const value = evaluate(sanitized);
      setMemory((prev) => prev + value);
    } catch {
      // ignore invalid memory operations
    }
  }, [expression]);

  const handleMemorySubtract = useCallback(() => {
    try {
      const sanitized = sanitizeExpression(expression);
      if (!sanitized) return;
      const value = evaluate(sanitized);
      setMemory((prev) => prev - value);
    } catch {
      // ignore invalid memory operations
    }
  }, [expression]);

  const handleMemoryRecall = useCallback(() => {
    setExpression(formatResult(memory));
    setShouldReset(true);
  }, [memory]);

  const handleMemoryClear = useCallback(() => {
    setMemory(0);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey) return;
      if (/^[0-9]$/.test(event.key)) {
        event.preventDefault();
        handleNumber(event.key);
      } else if (event.key === '.') {
        event.preventDefault();
        handleDecimal();
      } else if (['+', '-', '*', '/'].includes(event.key)) {
        event.preventDefault();
        handleOperator(event.key);
      } else if (event.key === '(' || event.key === ')') {
        event.preventDefault();
        handleParenthesis(event.key);
      } else if (event.key === '%') {
        event.preventDefault();
        handlePercentage();
      } else if (event.key === 'Backspace') {
        event.preventDefault();
        handleBackspace();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        handleClear();
      } else if (event.key === 'Enter' || event.key === '=') {
        event.preventDefault();
        handleEquals();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleBackspace,
    handleClear,
    handleDecimal,
    handleEquals,
    handleNumber,
    handleOperator,
    handleParenthesis,
    handlePercentage,
  ]);

  const formattedExpression = useMemo(() => formatForDisplay(expression), [expression]);

  return (
    <div className="standard-calculator">
      <div className="calculator-display">
        {history && <div className="calculator-expression">{history}</div>}
        <div className="calculator-result">{formattedExpression}</div>
      </div>

      <div className="calculator-buttons">
        <button className={buttonClass('memory')} onClick={handleMemoryClear} title="Memory Clear">
          MC
        </button>
        <button className={buttonClass('memory')} onClick={handleMemoryRecall} title="Memory Recall">
          MR
        </button>
        <button
          className={buttonClass('memory')}
          onClick={handleMemorySubtract}
          title="Memory Subtract"
        >
          M-
        </button>
        <button className={buttonClass('memory')} onClick={handleMemoryAdd} title="Memory Add">
          M+
        </button>

        <button className={buttonClass('clear')} onClick={handleClear}>
          C
        </button>
        <button className={buttonClass('operator')} onClick={() => handleParenthesis('(')}>
          (
        </button>
        <button className={buttonClass('operator')} onClick={() => handleParenthesis(')')}>
          )
        </button>
        <button className={buttonClass('operator')} onClick={handlePercentage}>
          %
        </button>

        <button className={buttonClass('operator')} onClick={() => handleOperator('/')}>
          ÷
        </button>
        <button onClick={() => handleNumber('7')}>7</button>
        <button onClick={() => handleNumber('8')}>8</button>
        <button onClick={() => handleNumber('9')}>9</button>
        <button className={buttonClass('operator')} onClick={() => handleOperator('*')}>
          ×
        </button>

        <button onClick={() => handleNumber('4')}>4</button>
        <button onClick={() => handleNumber('5')}>5</button>
        <button onClick={() => handleNumber('6')}>6</button>
        <button className={buttonClass('operator')} onClick={() => handleOperator('-')}>
          −
        </button>

        <button onClick={() => handleNumber('1')}>1</button>
        <button onClick={() => handleNumber('2')}>2</button>
        <button onClick={() => handleNumber('3')}>3</button>
        <button className={buttonClass('operator')} onClick={() => handleOperator('+')}>
          +
        </button>

        <button className={buttonClass('zero')} onClick={() => handleNumber('0')}>
          0
        </button>
        <button onClick={handleDecimal}>.</button>
        <button className={buttonClass('equals')} onClick={handleEquals}>
          =
        </button>
      </div>
    </div>
  );
}

