import axios from 'axios';
import { handleError, ApiError } from './errorHandler';

// When running in Docker, use relative URLs to leverage Vite proxy
// When running locally, use the full URL
const isDocker = import.meta.env.VITE_DOCKER === 'true';
const API_BASE_URL = isDocker ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:4001');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling and logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Use the centralized error handling
    const processedError = handleError(error, 'API Request');

    // Log additional details for debugging
    console.error('API Error Details:', {
      url: error.config?.url,
      method: error.config?.method,
      status: processedError.status,
      code: processedError.code,
      timestamp: new Date().toISOString()
    });

    return Promise.reject(processedError);
  }
);

export default api;
