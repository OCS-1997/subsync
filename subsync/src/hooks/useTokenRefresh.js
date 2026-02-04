import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { isTokenExpiringSoon, extendTokenExpiry, getStorageItem, clearAuth } from '../utils/storage';
import { logout } from '../features/Auth/authSlice';
import api from '../lib/axiosInstance';

/**
 * Auto-refresh token hook
 * Monitors token expiration and refreshes it automatically
 * Runs every 5 minutes to check token status
 */
export const useTokenRefresh = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const refreshToken = useCallback(async () => {
    try {
      const token = getStorageItem('subsync_token');
      if (!token) {
        return;
      }

      // Call refresh endpoint (if you have one)
      // If you don't have a refresh endpoint, we'll just extend the expiry
      // based on user activity
      
      // Option 1: If you have a refresh endpoint
      // const response = await api.post('/auth/refresh');
      // if (response.data.token) {
      //   setStorageItem('subsync_token', response.data.token);
      // }

      // Option 2: Extend expiry based on activity (simpler approach)
      extendTokenExpiry();
      console.log('✅ Token expiry extended');
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, logout user
      clearAuth();
      dispatch(logout());
    }
  }, [dispatch]);

  const checkTokenStatus = useCallback(() => {
    if (!isAuthenticated) {
      return;
    }

    const token = getStorageItem('subsync_token');
    if (!token) {
      // Token missing, logout
      dispatch(logout());
      return;
    }

    // If token is expiring soon (within 1 hour), refresh it
    if (isTokenExpiringSoon()) {
      console.log('⚠️ Token expiring soon, refreshing...');
      refreshToken();
    }
  }, [isAuthenticated, dispatch, refreshToken]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Check immediately on mount
    checkTokenStatus();

    // Check every 5 minutes
    const interval = setInterval(checkTokenStatus, 5 * 60 * 1000);

    // Also check on user activity (mouse move, click, keyboard)
    const handleActivity = () => {
      if (isTokenExpiringSoon()) {
        refreshToken();
      }
    };

    // Throttle activity checks to once per minute
    let lastActivityCheck = 0;
    const throttledActivityCheck = () => {
      const now = Date.now();
      if (now - lastActivityCheck > 60 * 1000) {
        lastActivityCheck = now;
        handleActivity();
      }
    };

    window.addEventListener('mousemove', throttledActivityCheck);
    window.addEventListener('click', throttledActivityCheck);
    window.addEventListener('keydown', throttledActivityCheck);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', throttledActivityCheck);
      window.removeEventListener('click', throttledActivityCheck);
      window.removeEventListener('keydown', throttledActivityCheck);
    };
  }, [isAuthenticated, checkTokenStatus, refreshToken]);
};
