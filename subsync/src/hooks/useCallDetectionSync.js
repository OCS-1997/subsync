import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { registerPlugin, Capacitor } from '@capacitor/core';
import api from '../lib/axiosInstance';
import { getStorageItem } from '../utils/storage';

const CallDetector = registerPlugin('CallDetector');

/**
 * Perform the actual sync of directory entries to the native Android layer.
 */
export const syncContactsToNative = async () => {
  if (!Capacitor.isNativePlatform()) return;
  
  try {
    // Sync API URL and authentication token to the native side first
    const token = getStorageItem('subsync_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'https://ocs365.in/api';
    
    await CallDetector.setApiConfig({ apiUrl, token });
    console.log('[CallDetection] Synced API config to native.');

    // Fetch the unified directory from the backend
    // Use a large limit to ensure we get all entries for the native cache
    const dirResponse = await api.get('/directory', { params: { limit: 5000 } });
    const allEntries = dirResponse.data.entries || [];

    const uniqueContacts = allEntries.map(e => ({
        name: e.name,
        phoneNumber: e.phone_number,
        company: e.company_name || '',
        type: e.entity_type || ''
    }));

    // Add a "meta" contact with the sync timestamp for native debugging
    const syncMeta = {
      name: `_SYNC_META_${new Date().toISOString()}`,
      phoneNumber: '0000000000'
    };

    if (uniqueContacts.length > 0) {
      await CallDetector.syncContacts({ contacts: [...uniqueContacts, syncMeta] });
      console.log(`[CallDetection] Synced ${uniqueContacts.length} contacts to native.`);
    }
  } catch (err) {
    console.error('[CallDetection] Centralized sync failed:', err);
  }
};

/**
 * Hook to automatically sync application contacts on authentication.
 */
export const useCallDetectionSync = () => {
  const isAuthenticated = useSelector((state) => !!state.auth?.user);

  useEffect(() => {
    if (!isAuthenticated) {
      if (Capacitor.isNativePlatform()) {
        CallDetector.setApiConfig({ apiUrl: null, token: null }).catch(err => {
          console.error('[CallDetection] Failed to clear API config:', err);
        });
      }
      return;
    }

    // Debounce or delay slightly to avoid multiple syncs during initial load
    const timer = setTimeout(syncContactsToNative, 5000);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);
};
