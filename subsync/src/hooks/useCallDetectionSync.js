import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { registerPlugin, Capacitor } from '@capacitor/core';
import api from '../lib/axiosInstance';

const CallDetector = registerPlugin('CallDetector');

/**
 * Hook to automatically sync application contacts from the centralized backend directory
 * to the native Android call detector. This allows the background service to identify 
 * callers even when the app is closed or in the background.
 */
export const useCallDetectionSync = () => {
  const isAuthenticated = useSelector((state) => !!state.auth?.user);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!isAuthenticated || !isNative) return;

    const sync = async () => {
      try {
        // Fetch the unified directory from the backend
        // We use the same 'sync' endpoint which returns the flat list
        // Actually, let's use the search endpoint with a large limit to get everything
        const dirResponse = await api.get('/directory', { params: { limit: 5000 } });
        const allEntries = dirResponse.data.entries || [];

        const uniqueContacts = allEntries.map(e => ({
            name: e.name,
            phoneNumber: e.phone_number
        }));

        // Add a "meta" contact with the sync timestamp for native debugging
        const syncMeta = {
          name: `_SYNC_META_${new Date().toISOString()}`,
          phoneNumber: '0000000000'
        };

        if (uniqueContacts.length > 0) {
          await CallDetector.syncContacts({ contacts: [...uniqueContacts, syncMeta] });
        }
      } catch (err) {
        console.error('[CallDetection] Centralized sync failed:', err);
      }
    };

    // Debounce or delay slightly to avoid multiple syncs during initial load
    const timer = setTimeout(sync, 5000);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);
};
