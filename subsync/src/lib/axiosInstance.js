import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/',
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('subsync_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize error responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Request failed';
    // Attach a normalized message for consumers
    error.normalizedMessage = message;
    error.normalizedStatus = status;
    return Promise.reject(error);
  }
);

export default api;
