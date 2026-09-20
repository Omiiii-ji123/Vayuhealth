import axios from 'axios';

// Base URL of the Spring Boot backend. Configurable via VITE_API_URL in production.
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Attach auth token (if present) to every request.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('vayu_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize errors so every screen can render a consistent message.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      (error.code === 'ERR_NETWORK'
        ? 'Cannot reach the API server at ' + API_BASE_URL + '. Confirm the backend is running on port 8081.'
        : error.message) ||
      'Something went wrong.';
    return Promise.reject({ ...error, message });
  }
);

export default client;
