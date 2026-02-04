/**
 * Smart Storage Utility
 * Automatically uses localStorage for PWA, sessionStorage for web
 * Includes token expiration and security features
 */

const TOKEN_EXPIRY_KEY = 'subsync_token_expiry';
const REMEMBER_ME_KEY = 'subsync_remember_me';
const TOKEN_DURATION = 24 * 60 * 60 * 1000; // 24 hours

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
 * Check if user has "Remember me" enabled
 */
const isRememberMeEnabled = () => {
  return localStorage.getItem(REMEMBER_ME_KEY) === 'true';
};

/**
 * Get the appropriate storage based on context
 * - PWA: Always use localStorage
 * - Web + Remember Me: Use localStorage
 * - Web: Use sessionStorage
 */
export const getStorage = () => {
  if (isPWA() || isRememberMeEnabled()) {
    return localStorage;
  }
  return sessionStorage;
};

/**
 * Set item in appropriate storage with expiration
 */
export const setStorageItem = (key, value, options = {}) => {
  const storage = getStorage();
  
  try {
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
 */
export const getStorageItem = (key) => {
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
};

/**
 * Remove item from both storages
 */
export const removeStorageItem = (key) => {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
};

/**
 * Clear all auth data
 */
export const clearAuth = () => {
  removeStorageItem('subsync_token');
  removeStorageItem('subsync_user');
  removeStorageItem(TOKEN_EXPIRY_KEY);
  // Keep remember_me preference
};

/**
 * Set "Remember me" preference
 */
export const setRememberMe = (enabled) => {
  if (enabled) {
    localStorage.setItem(REMEMBER_ME_KEY, 'true');
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
 */
export const extendTokenExpiry = () => {
  const storage = getStorage();
  const newExpiryTime = Date.now() + TOKEN_DURATION;
  storage.setItem(TOKEN_EXPIRY_KEY, newExpiryTime.toString());
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
