import { useState, useEffect } from 'react';
import api from '@/lib/axiosInstance.js';

export function useDashboardData() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await api.get('/dashboard');
                setData(response.data);
                setError(null);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError(err.normalizedMessage || 'Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const refresh = async () => {
        try {
            setLoading(true);
            const response = await api.get('/dashboard');
            setData(response.data);
            setError(null);
        } catch (err) {
            console.error('Error refreshing dashboard data:', err);
            setError(err.normalizedMessage || 'Failed to refresh dashboard data');
        } finally {
            setLoading(false);
        }
    };

    return { data, loading, error, refresh };
}

