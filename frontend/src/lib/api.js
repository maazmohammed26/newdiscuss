import axios from 'axios';

// Fallback to window.location.origin if REACT_APP_BACKEND_URL is not set
const API_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Add token from localStorage as fallback
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('discuss_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function formatApiError(detail) {
  if (detail == null) return 'Something went wrong. Please try again.';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === 'string' ? e.msg : JSON.stringify(e))).filter(Boolean).join(' ');
  if (detail && typeof detail.msg === 'string') return detail.msg;
  return String(detail);
}

export default api;
