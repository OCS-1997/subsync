import axios from 'axios';
import { getStorageItem } from '../utils/storage';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://ocs365.in/api', // Use prod URL as safe default
  timeout: 30000, // 30 second timeout to prevent perpetual "Processing" state
});

api.interceptors.request.use((config) => {
  const token = getStorageItem('subsync_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize error responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'Request failed';
    let status = 500;

    if (error.response) {
      // Server responded with non-2xx
      status = error.response.status;
      message = error.response.data?.error || error.response.data?.message || error.message;
    } else if (error.request) {
      // Request sent but no response
      message = "Network error: Server did not respond. Please check your connection.";
      if (error.code === 'ECONNABORTED') message = "Request timed out. Please try again.";
    } else {
      // Setup error
      message = error.message;
    }

    // Attach a normalized message for consumers
    error.normalizedMessage = message;
    error.normalizedStatus = status;
    
    return Promise.reject(error);
  }
);

export default api;
