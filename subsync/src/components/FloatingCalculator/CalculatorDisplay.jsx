import React from 'react';

const CalculatorDisplay = ({ display, expression }) => {
    return (
        <div className="calculator-display bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 mb-3">
            {expression && (
                <div className="text-xs text-gray-500 font-mono mb-1 h-4 overflow-hidden text-ellipsis whitespace-nowrap">
                    {expression}
                </div>
            )}
            <div className="text-3xl font-bold text-gray-900 font-mono text-right overflow-hidden text-ellipsis whitespace-nowrap">
                {display}
            </div>
        </div>
    );
};

export default CalculatorDisplay;
