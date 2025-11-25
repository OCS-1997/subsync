import { useState, useEffect, useCallback } from 'react';

const API_KEY = 'fca_live_your_api_key_here'; // Free API from freecurrencyapi.com
const CACHE_KEY = 'currency-rates-cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

const CURRENCIES = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'ERN', name: 'Eritrean Nakfa', symbol: 'Nfk' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
];

export const useCurrencyConverter = () => {
    const [fromCurrency, setFromCurrency] = useState('USD');
    const [toCurrency, setToCurrency] = useState('INR');
    const [amount, setAmount] = useState('1');
    const [convertedAmount, setConvertedAmount] = useState('0');
    const [rates, setRates] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isOffline, setIsOffline] = useState(false);

    const fetchRates = useCallback(async (forceRefresh = false) => {
        // Check cache first
        if (!forceRefresh) {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_DURATION) {
                    setRates(data);
                    setLastUpdated(new Date(timestamp));
                    return;
                }
            }
        }

        setLoading(true);
        setError(null);

        try {
            // Using exchangerate-api.com (free tier, no API key needed)
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');

            if (!response.ok) throw new Error('Failed to fetch rates');

            const data = await response.json();
            const ratesData = data.rates;

            setRates(ratesData);
            setLastUpdated(new Date());
            setIsOffline(false);

            // Cache the rates
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                data: ratesData,
                timestamp: Date.now(),
            }));
        } catch (err) {
            setError(err.message);
            setIsOffline(true);

            // Try to use cached data even if expired
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                setRates(data);
                setLastUpdated(new Date(timestamp));
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRates();
    }, [fetchRates]);

    useEffect(() => {
        if (!rates[fromCurrency] || !rates[toCurrency]) return;

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum)) {
            setConvertedAmount('0');
            return;
        }

        // Convert from -> USD -> to
        const inUSD = amountNum / rates[fromCurrency];
        const result = inUSD * rates[toCurrency];

        setConvertedAmount(result.toFixed(2));
    }, [amount, fromCurrency, toCurrency, rates]);

    const swapCurrencies = useCallback(() => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
    }, [fromCurrency, toCurrency]);

    const handleRefresh = useCallback(() => {
        fetchRates(true);
    }, [fetchRates]);

    return {
        currencies: CURRENCIES,
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
    };
};
