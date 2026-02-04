import api from '@/lib/axiosInstance';
import { setStorageItem, setRememberMe } from '@/utils/storage';

/**
 * Handles user login by sending credentials to the backend.
 * Stores the received authentication token in appropriate storage upon successful login.
 *
 * @param {string} username - The user's username.
 * @param {string} password - The user's password.
 * @param {boolean} rememberMe - Whether to keep user logged in (use localStorage)
 * @returns {Promise<Object>} A promise that resolves with user data (including token) on success.
 * @throws {Error} Throws an error if the login request fails, with a user-friendly message.
 */
const apiLoginUser = async (username, password, rememberMe = false) => {
  try {
    // Set remember me preference before login
    setRememberMe(rememberMe);
    
    const response = await api.post('/login/user', {
      username,
      password,
    
    });

    const data = response.data;

    // If a token is present in the response, store it using smart storage
    if (data.token) {
      setStorageItem('subsync_token', data.token);
    }

    return data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to log in. Please try again.');
  }
};

export { apiLoginUser };
