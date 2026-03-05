import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Capacitor } from '@capacitor/core';
import { getStorageItem, clearAuth } from '../utils/storage';
import { logout } from '../features/Auth/authSlice';
import api from '../lib/axiosInstance';

/**
 * useCapacitorAuth — Maintains auth session persistence on native Capacitor Android.
 *
 * When the Capacitor WebView resumes from background, validates the session.
 * On web: no-op (Capacitor.isNativePlatform() = false).
 */
export function useCapacitorAuth() {
  const dispatch        = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return; // web — do nothing

    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;

      // App came to foreground — check session
      const token = getStorageItem('subsync_token');
      if (!token) {
        if (isAuthenticated) dispatch(logout());
        return;
      }

      try {
        await api.get('/health');
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          clearAuth();
          dispatch(logout());
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [dispatch, isAuthenticated]);
}
