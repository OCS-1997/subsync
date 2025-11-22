import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, ArrowLeftRight } from 'lucide-react';
import currencyRates from './currency-rates.json';

const CURRENCIES = [
    { code: 'USD', name: 'US Dollar' },
    { code: 'INR', name: 'Indian Rupee' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'AED', name: 'UAE Dirham' },
    { code: 'AUD', name: 'Australian Dollar' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'JPY', name: 'Japanese Yen' },
    { code: 'SGD', name: 'Singapore Dollar' },
];

export default function CurrencyConverter() {
    const [isOpen, setIsOpen] = useState(false);
    const [fromCurrency, setFromCurrency] = useState('USD');
    const [toCurrency, setToCurrency] = useState('INR');
    const [amount, setAmount] = useState('');
    const [convertedAmount, setConvertedAmount] = useState('');
    const [rates, setRates] = useState(currencyRates.rates);
    const [loading, setLoading] = useState(false);

    // Try to fetch live rates, fallback to JSON
    useEffect(() => {
        const fetchRates = async () => {
            try {
                setLoading(true);
                // Using a free API endpoint (you can replace with your preferred API)
                const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
                if (response.ok) {
                    const data = await response.json();
                    // Map the API response to our currency codes
                    const newRates = {
                        USD: 1.0,
                        INR: data.rates.INR || rates.INR,
                        EUR: data.rates.EUR || rates.EUR,
                        GBP: data.rates.GBP || rates.GBP,
                        AED: data.rates.AED || rates.AED,
                        AUD: data.rates.AUD || rates.AUD,
                        CAD: data.rates.CAD || rates.CAD,
                        JPY: data.rates.JPY || rates.JPY,
                        SGD: data.rates.SGD || rates.SGD,
                    };
                    setRates(newRates);
                }
            } catch (error) {
                console.log('Using fallback rates from JSON');
                // Keep using JSON rates on error
            } finally {
                setLoading(false);
            }
        };

        fetchRates();
    }, []);

    // Calculate conversion whenever inputs change
    useEffect(() => {
        if (!amount || amount === '' || isNaN(parseFloat(amount))) {
            setConvertedAmount('');
            return;
        }

        const fromRate = rates[fromCurrency] || 1;
        const toRate = rates[toCurrency] || 1;

        // Convert to USD first (base currency), then to target
        const amountInUSD = parseFloat(amount) / fromRate;
        const converted = amountInUSD * toRate;

        setConvertedAmount(converted.toFixed(2));
    }, [amount, fromCurrency, toCurrency, rates]);

    const handleSwap = () => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
        const temp = amount;
        setAmount(convertedAmount);
        setConvertedAmount(temp);
    };

    const handleAmountChange = (e) => {
        const value = e.target.value;
        // Allow numbers, decimals, and empty string
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setAmount(value);
        }
    };

    return (
        <div className="currency-converter">
            <div
                className="currency-converter-header"
                onClick={() => setIsOpen(!isOpen)}
            >
                <h3 className="currency-converter-title">
                    <ArrowLeftRight className="w-4 h-4" />
                    Currency Converter
                </h3>
                {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
            </div>

            {isOpen && (
                <div className="currency-converter-content">
                    {loading ? (
                        <div className="currency-loading">Loading exchange rates...</div>
                    ) : (
                        <>
                            <div className="currency-converter-row">
                                <select
                                    className="currency-select"
                                    value={fromCurrency}
                                    onChange={(e) => setFromCurrency(e.target.value)}
                                >
                                    {CURRENCIES.map((curr) => (
                                        <option key={curr.code} value={curr.code}>
                                            {curr.code} - {curr.name}
                                        </option>
                                    ))}
                                </select>

                                <button
                                    className="currency-swap-button"
                                    onClick={handleSwap}
                                    type="button"
                                    title="Swap currencies"
                                >
                                    <ArrowLeftRight className="w-4 h-4" />
                                </button>

                                <select
                                    className="currency-select"
                                    value={toCurrency}
                                    onChange={(e) => setToCurrency(e.target.value)}
                                >
                                    {CURRENCIES.map((curr) => (
                                        <option key={curr.code} value={curr.code}>
                                            {curr.code} - {curr.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    className="currency-amount-input"
                                    placeholder="Enter amount"
                                    value={amount}
                                    onChange={handleAmountChange}
                                    autoComplete="off"
                                    autoFocus={false}
                                />
                            </div>

                            {convertedAmount && (
                                <div className="currency-result">
                                    {convertedAmount} {toCurrency}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

