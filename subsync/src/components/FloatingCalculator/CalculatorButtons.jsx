import React from 'react';

const Button = ({ children, onClick, variant = 'default', className = '' }) => {
    const baseClasses = 'calculator-button h-12 rounded-lg font-semibold text-lg transition-all duration-150 active:scale-95 hover:shadow-md';

    const variants = {
        default: 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-200',
        operator: 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white',
        equals: 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white',
        function: 'bg-gradient-to-br from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-800',
        clear: 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white',
    };

    return (
        <button
            onClick={onClick}
            className={`${baseClasses} ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
};

const CalculatorButtons = ({ calculator }) => {
    const {
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
    } = calculator;

    return (
        <div className="calculator-buttons grid grid-cols-4 gap-2">
            {/* Memory Row */}
            <Button variant="function" onClick={handleMemoryClear} className="text-sm">MC</Button>
            <Button variant="function" onClick={handleMemoryRecall} className="text-sm">MR</Button>
            <Button variant="function" onClick={handleMemoryAdd} className="text-sm">M+</Button>
            <Button variant="function" onClick={handleMemorySubtract} className="text-sm">M-</Button>

            {/* Function Row */}
            <Button variant="clear" onClick={handleClear}>C</Button>
            <Button variant="function" onClick={handleClearEntry}>CE</Button>
            <Button variant="function" onClick={handleBackspace}>⌫</Button>
            <Button variant="operator" onClick={() => handleOperator('÷')}>÷</Button>

            {/* Number Rows */}
            <Button onClick={() => handleNumber('7')}>7</Button>
            <Button onClick={() => handleNumber('8')}>8</Button>
            <Button onClick={() => handleNumber('9')}>9</Button>
            <Button variant="operator" onClick={() => handleOperator('×')}>×</Button>

            <Button onClick={() => handleNumber('4')}>4</Button>
            <Button onClick={() => handleNumber('5')}>5</Button>
            <Button onClick={() => handleNumber('6')}>6</Button>
            <Button variant="operator" onClick={() => handleOperator('-')}>−</Button>

            <Button onClick={() => handleNumber('1')}>1</Button>
            <Button onClick={() => handleNumber('2')}>2</Button>
            <Button onClick={() => handleNumber('3')}>3</Button>
            <Button variant="operator" onClick={() => handleOperator('+')}>+</Button>

            <Button onClick={() => handleNumber('0')}>0</Button>
            <Button onClick={handleDecimal}>.</Button>
            <Button variant="function" onClick={handleBrackets}>()</Button>
            <Button variant="equals" onClick={handleEquals}>=</Button>
        </div>
    );
};

export default CalculatorButtons;
