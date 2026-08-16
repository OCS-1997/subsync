/**
 * User Utility Helper
 * Reliably retrieves the currently logged in user context from localStorage/sessionStorage.
 */
import { getStorageItem } from './storage';

export function getLoggedUser() {
  try {
    const keys = ['user', 'user_details', 'subsync_user'];
    for (const key of keys) {
      const item = getStorageItem(key) || localStorage.getItem(key) || sessionStorage.getItem(key);
      if (item) {
        const parsed = typeof item === 'string' ? JSON.parse(item) : item;
        if (parsed && typeof parsed === 'object') {
          const u = parsed.user || parsed;
          const username = u.username || u.user_id || u.email || '';
          const name = u.name || u.full_name || u.first_name || username || 'Myself';
          if (username || name) {
            return {
              ...u,
              username: username || 'user',
              name: name || 'Myself',
            };
          }
        }
      }
    }
  } catch (e) {
    console.error('Error parsing logged-in user:', e);
  }

  const username = getStorageItem('username') || localStorage.getItem('username') || sessionStorage.getItem('username') || '';
  const name = getStorageItem('name') || localStorage.getItem('name') || sessionStorage.getItem('name') || username || 'Myself';

  return {
    username,
    name: name || 'Myself',
  };
}
