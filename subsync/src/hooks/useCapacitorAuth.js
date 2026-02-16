import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

/**
 * Hook to detect if running on Capacitor and manage authentication storage
 */
export const useCapacitorAuth = () => {
  const [isCapacitor, setIsCapacitor] = useState(false);
  const [migrated, setMigrated] = useState(false);

  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    setIsCapacitor(isNative);

    if (isNative && !migrated) {
      migrateToCapacitorPreferences();
      setMigrated(true);
    }
  }, [migrated]);

  const migrateToCapacitorPreferences = async () => {
    console.log('[useCapacitorAuth] Migrating localStorage to Capacitor Preferences');

    try {
      // Get existing token from localStorage
      const token = localStorage.getItem('subsync_token');
      const user = localStorage.getItem('subsync_user');
      const tokenExpiry = localStorage.getItem('subsync_token_expiry');

      if (token) {
        // Save to Capacitor Preferences
        await Preferences.set({ key: 'subsync_token', value: token });
        console.log('[useCapacitorAuth] Token migrated');
      }

      if (user) {
        await Preferences.set({ key: 'subsync_user', value: user });
        console.log('[useCapacitorAuth] User migrated');
      }

      if (tokenExpiry) {
        await Preferences.set({ key: 'subsync_token_expiry', value: tokenExpiry });
        console.log('[useCapacitorAuth] Token expiry migrated');
      }

      // Clear localStorage (optional - keeps web version working)
      // Uncomment if you want to force exclusive use of Capacitor Preferences
      // localStorage.removeItem('subsync_token');
      // localStorage.removeItem('subsync_user');
      // localStorage.removeItem('subsync_token_expiry');
    } catch (error) {
      console.error('[useCapacitorAuth] Migration failed:', error);
    }
  };

  return {
    isCapacitor,
  };
};
