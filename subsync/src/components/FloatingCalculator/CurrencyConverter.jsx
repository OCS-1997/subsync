import React from 'react';
import { ArrowLeftRight, RefreshCw, Wifi, WifiOff } from 'lucide-react';

const CurrencyConverter = ({ converter }) => {
    const {
        currencies,
        fromCurrency,
        toCurrency,
        amount,
        convertedAmount,
        loading,
        error,
        lastUpdated,
        isOffline,
        setFromCurrency,
        setToCurrency,
        setAmount,
        swapCurrencies,
        handleRefresh,
    } = converter;

    return (
        <div className="currency-converter p-4">
            {/* Status Bar */}
            <div className="flex items-center justify-between mb-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                    {isOffline ? (
                        <>
                            <WifiOff className="h-3 w-3 text-orange-500" />
                            <span className="text-orange-500">Offline Mode</span>
                        </>
                    ) : (
                        <>
                            <Wifi className="h-3 w-3 text-green-500" />
                            <span className="text-green-500">Live Rates</span>
                        </>
                    )}
                </div>
                {lastUpdated && (
                    <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
                )}
            </div>

            {/* From Currency */}
            <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-600 mb-1">From</label>
                <div className="flex gap-2">
                    <select
                        value={fromCurrency}
                        onChange={(e) => setFromCurrency(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                        {currencies.map((curr) => (
                            <option key={curr.code} value={curr.code}>
                                {curr.code} - {curr.name}
                            </option>
                        ))}
                    </select>
                </div>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full mt-2 px-3 py-3 text-2xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="0.00"
                />
            </div>

            {/* Swap Button */}
            <div className="flex justify-center mb-3">
                <button
                    onClick={swapCurrencies}
                    className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition-all duration-200 active:scale-95"
                >
                    <ArrowLeftRight className="h-5 w-5" />
                </button>
            </div>

            {/* To Currency */}
            <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 mb-1">To</label>
                <div className="flex gap-2">
                    <select
                        value={toCurrency}
                        onChange={(e) => setToCurrency(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                        {currencies.map((curr) => (
                            <option key={curr.code} value={curr.code}>
                                {curr.code} - {curr.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="w-full mt-2 px-3 py-3 text-2xl font-bold bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg text-green-800">
                    {loading ? '...' : convertedAmount}
                </div>
            </div>

            {/* Refresh Button */}
            <button
                onClick={handleRefresh}
                disabled={loading}
                className="w-full py-2 px-4 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Updating...' : 'Refresh Rates'}
            </button>

            {error && !isOffline && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                    {error}
                </div>
            )}
        </div>
    );
};

export default CurrencyConverter;
