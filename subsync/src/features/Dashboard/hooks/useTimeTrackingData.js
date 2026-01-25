import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axiosInstance';

/**
 * Custom hook for fetching time tracking dashboard data
 * @param {string} period - 'today' | 'week' | 'month'
 * @param {boolean} autoRefresh - Whether to auto-refresh data
 */
export const useTimeTrackingStats = (period = 'today', autoRefresh = false) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/dashboard/time-tracking/stats`, {
                params: { period }
            });
            setData(response.data);
        } catch (err) {
            console.error('Error fetching time tracking stats:', err);
            setError(err.response?.data?.error || 'Failed to fetch time tracking statistics');
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Auto-refresh every 30 seconds if enabled
    useEffect(() => {
        if (autoRefresh) {
            const interval = setInterval(fetchStats, 30000);
            return () => clearInterval(interval);
        }
    }, [autoRefresh, fetchStats]);

    return { data, loading, error, refetch: fetchStats };
};

/**
 * Custom hook for fetching productivity trend data
 * @param {number} days - Number of days to fetch (7 or 30)
 */
export const useProductivityTrend = (days = 7) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTrend = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/dashboard/time-tracking/productivity-trend`, {
                params: { days }
            });
            setData(response.data);
        } catch (err) {
            console.error('Error fetching productivity trend:', err);
            setError(err.response?.data?.error || 'Failed to fetch productivity trend');
        } finally {
            setLoading(false);
        }
    }, [days]);

    useEffect(() => {
        fetchTrend();
    }, [fetchTrend]);

    return { data, loading, error, refetch: fetchTrend };
};

/**
 * Custom hook for fetching specific user's time stats (admin only)
 * @param {string} userId - Username to fetch stats for
 * @param {string} period - 'today' | 'week' | 'month'
 */
export const useUserTimeStats = (userId, period = 'today') => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUserStats = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return;
        }
        
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/dashboard/time-tracking/user-stats/${userId}`, {
                params: { period }
            });
            setData(response.data);
        } catch (err) {
            console.error('Error fetching user time stats:', err);
            setError(err.response?.data?.error || 'Failed to fetch user time statistics');
        } finally {
            setLoading(false);
        }
    }, [userId, period]);

    useEffect(() => {
        fetchUserStats();
    }, [fetchUserStats]);

    return { data, loading, error, refetch: fetchUserStats };
};
