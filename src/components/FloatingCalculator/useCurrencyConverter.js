import { useCallback, useEffect, useMemo, useState } from 'react';

const SUPPORTED_CURRENCIES = [
  { code: 'USD', label: 'US Dollar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'GBP', label: 'British Pound' },
  { code: 'INR', label: 'Indian Rupee' },
  { code: 'ERN', label: 'Eritrean Nakfa' },
  { code: 'JPY', label: 'Japanese Yen' },
  { code: 'AUD', label: 'Australian Dollar' },
  { code: 'CAD', label: 'Canadian Dollar' },
  { code: 'CHF', label: 'Swiss Franc' },
  { code: 'CNY', label: 'Chinese Yuan' },
];

const RATE_CACHE_PREFIX = 'calculator-rates';

const isBrowser = () => typeof window !== 'undefined';

const useCurrencyConverter = () => {
  const [baseCurrency, setBaseCurrency] = useState(() => {
    if (!isBrowser()) return 'USD';
    return localStorage.getItem('calculator-base') || 'USD';
  });
  const [targetCurrency, setTargetCurrency] = useState(() => {
    if (!isBrowser()) return 'INR';
    return localStorage.getItem('calculator-target') || 'INR';
  });
  const [amount, setAmount] = useState('1');
  const [convertedValue, setConvertedValue] = useState('0');
  const [rates, setRates] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOffline, setIsOffline] = useState(() => (isBrowser() ? !navigator.onLine : false));

  const cacheKey = useMemo(() => `${RATE_CACHE_PREFIX}-${baseCurrency}`, [baseCurrency]);

  const persistCurrencies = useCallback(() => {
    if (!isBrowser()) return;
    localStorage.setItem('calculator-base', baseCurrency);
    localStorage.setItem('calculator-target', targetCurrency);
  }, [baseCurrency, targetCurrency]);

  const hydrateFromCache = useCallback(() => {
    if (!isBrowser()) return null;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < 60 * 60 * 1000) {
        setRates(parsed.rates);
        setLastUpdated(parsed.timestamp);
        return parsed.rates;
      }
    } catch (hydrationError) {
      console.warn('Unable to restore cached rates', hydrationError);
    }
    return null;
  }, [cacheKey]);

  const fetchRates = useCallback(
    async ({ forceRefresh = false } = {}) => {
      if (!isBrowser()) return;

      const cachedRates = !forceRefresh ? hydrateFromCache() : null;
      if (cachedRates && !forceRefresh) {
        setError('');
        return cachedRates;
      }

      setLoading(true);
      try {
        const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
        if (!response.ok) {
          throw new Error('Unable to fetch rates');
        }
        const data = await response.json();
        if (data.result !== 'success') {
          throw new Error(data['error-type'] || 'Unexpected response');
        }
        setRates(data.rates);
        const timestamp = Date.now();
        setLastUpdated(timestamp);
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            timestamp,
            rates: data.rates,
          }),
        );
        setError('');
        return data.rates;
      } catch (fetchError) {
        console.error(fetchError);
        if (!cachedRates) {
          setError(fetchError.message || 'Unable to refresh rates');
        } else {
          setError('Offline: showing cached rates');
        }
        return cachedRates;
      } finally {
        setLoading(false);
      }
    },
    [baseCurrency, cacheKey, hydrateFromCache],
  );

  const convertAmount = useCallback(
    (value, target, currentRates) => {
      if (!value || Number.isNaN(Number(value))) {
        setConvertedValue('0');
        return;
      }
      const rate = currentRates?.[target];
      if (!rate) {
        setConvertedValue('—');
        return;
      }
      const result = Number(value) * rate;
      setConvertedValue(result.toFixed(4));
    },
    [],
  );

  const refreshRates = useCallback(() => fetchRates({ forceRefresh: true }), [fetchRates]);

  const swapCurrencies = useCallback(() => {
    setBaseCurrency((prev) => {
      setTargetCurrency(prev);
      return targetCurrency;
    });
  }, [targetCurrency]);

  useEffect(() => {
    persistCurrencies();
  }, [persistCurrencies]);

  useEffect(() => {
    const currentRates = hydrateFromCache();
    if (currentRates) {
      convertAmount(amount, targetCurrency, currentRates);
    }
    fetchRates();
  }, [amount, convertAmount, fetchRates, hydrateFromCache, targetCurrency]);

  useEffect(() => {
    convertAmount(amount, targetCurrency, rates);
  }, [amount, convertAmount, rates, targetCurrency]);

  useEffect(() => {
    if (!isBrowser()) return undefined;
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    amount,
    setAmount,
    baseCurrency,
    setBaseCurrency,
    targetCurrency,
    setTargetCurrency,
    convertedValue,
    lastUpdated,
    loading,
    error,
    refreshRates,
    swapCurrencies,
    supportedCurrencies: SUPPORTED_CURRENCIES,
    isOffline,
  };
};

export default useCurrencyConverter;

