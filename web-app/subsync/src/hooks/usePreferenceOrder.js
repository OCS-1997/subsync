import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '@/lib/axiosInstance.js';

export const usePreferenceOrder = (preferenceKey, defaultItems, itemKey = 'path', filterFn = null) => {
    const { username } = useParams();
    const [orderedItems, setOrderedItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const CACHE_KEY = `pref_order_${username}_${preferenceKey}`;

    const saveToCache = useCallback((keys) => {
        localStorage.setItem(CACHE_KEY, JSON.stringify(keys));
    }, [CACHE_KEY]);

    const getFromCache = useCallback(() => {
        const cached = localStorage.getItem(CACHE_KEY);
        return cached ? JSON.parse(cached) : null;
    }, [CACHE_KEY]);

    const sortItems = useCallback((items, orderKeys) => {
        const itemsMap = new Map(items.map(item => [item[itemKey], item]));
        const sorted = [];

        // Add items in the saved order
        orderKeys.forEach(key => {
            if (itemsMap.has(key)) {
                sorted.push(itemsMap.get(key));
                itemsMap.delete(key);
            }
        });

        // Add any remaining items (newly added defaults)
        sorted.push(...itemsMap.values());
        return sorted;
    }, [itemKey]);

    useEffect(() => {
        if (!username) return;

        const loadPreferences = async () => {
            setIsLoading(true);

            // 1. Try Cache first for immediate UI
            const cachedKeys = getFromCache();
            let initialOrder = defaultItems;

            if (cachedKeys) {
                initialOrder = sortItems(defaultItems, cachedKeys);
            }

            // Apply filtering if provided (e.g. permissions)
            const filteredInitial = filterFn ? initialOrder.filter(filterFn) : initialOrder;
            setOrderedItems(filteredInitial);

            // 2. Fetch from Backend for sync using the authorized api instance
            try {
                const response = await api.get(`/preferences/${username}/${preferenceKey}`);
                if (response.data.success && response.data.value) {
                    const dbKeys = response.data.value;
                    const syncedOrder = sortItems(defaultItems, dbKeys);
                    const filteredSynced = filterFn ? syncedOrder.filter(filterFn) : syncedOrder;

                    setOrderedItems(filteredSynced);
                    saveToCache(dbKeys);
                }
            } catch (err) {
                console.error(`Error loading preference ${preferenceKey}:`, err);
            } finally {
                setIsLoading(false);
            }
        };

        loadPreferences();
    }, [username, preferenceKey, defaultItems, sortItems, getFromCache, saveToCache]);

    const reorderItems = useCallback((newOrder) => {
        setOrderedItems(newOrder);
        const keys = newOrder.map(item => item[itemKey]);
        saveToCache(keys);

        // Background sync to backend using the authorized api instance
        api.put(`/preferences/${username}/${preferenceKey}`, { value: keys })
            .catch(err => console.error(`Error saving preference ${preferenceKey}:`, err));
    }, [username, preferenceKey, itemKey, saveToCache]);

    return { orderedItems, reorderItems, isLoading };
};
