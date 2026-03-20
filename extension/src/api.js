// Default to localhost, could be configurable via extension options or .env
const API_URL = 'http://localhost:3000/api';

const fetchWithToken = async (endpoint, options = {}) => {
  return new Promise((resolve, reject) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['authToken'], async (result) => {
        const token = result.authToken;
        if (!token) return reject(new Error('No auth token found'));
        
        try {
          const res = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              ...(options.headers || {})
            }
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || errData.error || 'API call failed');
          }
          const data = await res.json();
          resolve(data);
        } catch (error) {
          reject(error);
        }
      });
    } else {
      reject(new Error('Chrome storage unavailable'));
    }
  });
};

export const loginAPI = async (identifier, password) => {
  try {
    const response = await fetch(`${API_URL}/login/user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      // Backend expects 'username' and 'password'
      body: JSON.stringify({ username: identifier, password })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Login failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(error.message || 'Network error');
  }
};

// Extension Phase 2 API Endpoints
export const fetchActiveTimer = () => fetchWithToken('/time-tracking/timer/active');
export const fetchProjects = () => fetchWithToken('/time-tracking/projects');
export const startTimer = (payload = {}) => fetchWithToken('/time-tracking/timer/start', { method: 'POST', body: JSON.stringify(payload) });
export const stopTimer = (id) => fetchWithToken(`/time-tracking/timer/stop/${id}`, { method: 'POST' });
export const logCall = (payload) => fetchWithToken('/log-call', { method: 'POST', body: JSON.stringify(payload) });
export const fetchRecentEntries = () => fetchWithToken('/time-tracking/entries?limit=5');
export const fetchCallLogs = () => fetchWithToken('/call-logs?limit=5');
