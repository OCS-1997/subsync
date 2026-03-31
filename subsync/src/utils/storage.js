/**
 * Smart Storage Utility
 * Automatically uses localStorage for PWA, sessionStorage for web, Capacitor Preferences for native
 * Includes token expiration and security features
 */

import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const TOKEN_EXPIRY_KEY = 'subsync_token_expiry';
const REMEMBER_ME_KEY = 'subsync_remember_me';
const TOKEN_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 Days (for mobile CRM with call detection)

/**
 * Detect if app is running as PWA
 */
export const isPWA = () => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
};

/**
 * Detect if app is running on Capacitor (native)
 */
export const isCapacitor = () => {
  return Capacitor.isNativePlatform();
};

/**
 * Check if user has "Remember me" enabled
 */
const isRememberMeEnabled = () => {
  return localStorage.getItem(REMEMBER_ME_KEY) === 'true';
};

/**
 * Get the appropriate storage based on context
 * - Capacitor (native): Use Capacitor Preferences
 * - PWA: Always use localStorage
 * - Web + Remember Me: Use localStorage
 * - Web: Use sessionStorage
 */
export const getStorage = () => {
  // Note: Capacitor uses a separate API (Preferences), so this returns web storage
  if (isPWA() || isRememberMeEnabled()) {
    return localStorage;
  }
  return sessionStorage;
};

/**
 * Set item in appropriate storage with expiration
 * Synchronous for web, handles Capacitor async internally
 */
export const setStorageItem = (key, value, options = {}) => {
  try {
    // Use Capacitor Preferences on native platforms (async but fire-and-forget for compatibility)
    if (isCapacitor()) {
      Preferences.set({ key, value }).catch(err => console.error('Capacitor storage error:', err));
      
      // Set expiration for token
      if (key === 'subsync_token' && !options.skipExpiry) {
        const expiryTime = Date.now() + TOKEN_DURATION;
        Preferences.set({ key: TOKEN_EXPIRY_KEY, value: expiryTime.toString() })
          .catch(err => console.error('Capacitor storage error:', err));
      }
      // Continue to set in localStorage/sessionStorage as a sync cache
    }

    // Fall back to web storage (synchronous)
    const storage = getStorage();
    storage.setItem(key, value);
    
    // Set expiration for token
    if (key === 'subsync_token' && !options.skipExpiry) {
      const expiryTime = Date.now() + TOKEN_DURATION;
      storage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    }
  } catch (error) {
    console.error('Storage error:', error);
  }
};

/**
 * Get item from storage with expiration check
 * Synchronous for web, returns null for Capacitor (use getStorageItemAsync)
 */
export const getStorageItem = (key) => {
  try {
    // For Capacitor, we return the value from localStorage as a sync cache
    // Note: getStorageItemAsync should be used for critical persistent reads
    
    // Fall back to web storage
    // Try both storages (for migration scenarios)
    let value = localStorage.getItem(key);
    if (!value) {
      value = sessionStorage.getItem(key);
    }
    
    // Check token expiration
    if (key === 'subsync_token' && value) {
      const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY) || 
                         sessionStorage.getItem(TOKEN_EXPIRY_KEY);
      
      if (expiryTime && Date.now() > parseInt(expiryTime)) {
        // Token expired
        clearAuth();
        return null;
      }
    }
    
    return value;
  } catch (error) {
    console.error('Storage error:', error);
    return null;
  }
};

/**
 * Async version of getStorageItem for Capacitor compatibility
 */
export const getStorageItemAsync = async (key) => {
  try {
    // Use Capacitor Preferences on native platforms
    if (isCapacitor()) {
      const { value } = await Preferences.get({ key });
      
      // Check token expiration
      if (key === 'subsync_token' && value) {
        const { value: expiryTime } = await Preferences.get({ key: TOKEN_EXPIRY_KEY });
        
        if (expiryTime && Date.now() > parseInt(expiryTime)) {
          // Token expired
          await clearAuthAsync();
          return null;
        }
      }
      
      return value;
    }

    // Fall back to sync version for web
    return getStorageItem(key);
  } catch (error) {
    console.error('Storage error:', error);
    return null;
  }
};

/**
 * Remove item from all storages (including Capacitor Preferences)
 * Synchronous for web, fire-and-forget for Capacitor
 */
export const removeStorageItem = (key) => {
  if (isCapacitor()) {
    Preferences.remove({ key }).catch(err => console.error('Capacitor storage error:', err));
  }
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
};

/**
 * Async version of removeStorageItem
 */
export const removeStorageItemAsync = async (key) => {
  if (isCapacitor()) {
    await Preferences.remove({ key });
  }
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
};

/**
 * Clear all auth data (synchronous)
 */
export const clearAuth = () => {
  removeStorageItem('subsync_token');
  removeStorageItem('subsync_user');
  removeStorageItem(TOKEN_EXPIRY_KEY);
  // Keep remember_me preference
};

/**
 * Async version of clearAuth for explicit async contexts
 */
export const clearAuthAsync = async () => {
  await removeStorageItemAsync('subsync_token');
  await removeStorageItemAsync('subsync_user');
  await removeStorageItemAsync(TOKEN_EXPIRY_KEY);
  // Keep remember_me preference
};

/**
 * Set "Remember me" preference
 */
export const setRememberMe = (enabled) => {
  if (enabled) {
    localStorage.setItem(REMEMBER_ME_KEY) === 'true';
  } else {
    localStorage.removeItem(REMEMBER_ME_KEY);
  }
};

/**
 * Get "Remember me" preference
 */
export const getRememberMe = () => {
  return isRememberMeEnabled();
};

/**
 * Check if token is about to expire (within 1 hour)
 */
export const isTokenExpiringSoon = () => {
  const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY) || 
                     sessionStorage.getItem(TOKEN_EXPIRY_KEY);
  
  if (!expiryTime) return false;
  
  const timeUntilExpiry = parseInt(expiryTime) - Date.now();
  const oneHour = 60 * 60 * 1000;
  
  return timeUntilExpiry > 0 && timeUntilExpiry < oneHour;
};

/**
 * Extend token expiration (for auto-refresh)
 * Synchronous for web, fire-and-forget for Capacitor
 */
export const extendTokenExpiry = () => {
  const newExpiryTime = Date.now() + TOKEN_DURATION;
  
  if (isCapacitor()) {
    Preferences.set({ key: TOKEN_EXPIRY_KEY, value: newExpiryTime.toString() })
      .catch(err => console.error('Capacitor storage error:', err));
  } else {
    const storage = getStorage();
    storage.setItem(TOKEN_EXPIRY_KEY, newExpiryTime.toString());
  }
};

/**
 * Migrate from sessionStorage to localStorage (for PWA users)
 */
export const migrateToLocalStorage = () => {
  const token = sessionStorage.getItem('subsync_token');
  const user = sessionStorage.getItem('subsync_user');
  
  if (token) {
    localStorage.setItem('subsync_token', token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, (Date.now() + TOKEN_DURATION).toString());
  }
  
  if (user) {
    localStorage.setItem('subsync_user', user);
  }
  
  // Clear sessionStorage
  sessionStorage.removeItem('subsync_token');
  sessionStorage.removeItem('subsync_user');
};

/**
 * Get storage info (for debugging)
 */
export const getStorageInfo = () => {
  return {
    isPWA: isPWA(),
    rememberMe: isRememberMeEnabled(),
    storageType: getStorage() === localStorage ? 'localStorage' : 'sessionStorage',
    hasToken: !!getStorageItem('subsync_token'),
    tokenExpiringSoon: isTokenExpiringSoon(),
    expiryTime: getStorageItem(TOKEN_EXPIRY_KEY)
  };
};
