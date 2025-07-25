import axios from 'axios';

// Configure axios with the correct base URL for the environment
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'test'
    ? 'http://localhost:4000/api'
    : import.meta.env.PROD
    ? 'https://cursor-gemini-api.fly.dev/api'
    : '/api'
});

// Add request interceptor to include auth token
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
    // Log error details for debugging
    if (error.response) {
      console.error('API Error:', {
        url: error.config?.url,
        status: error.response.status,
        data: error.response.data
      });
      // Return a user-friendly error object
      return Promise.reject({
        message: error.response.data?.message || 'An error occurred while communicating with the server.',
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('API No Response:', error.request);
      return Promise.reject({
        message: 'No response received from the server.',
        status: null,
        data: null
      });
    } else {
      console.error('API Unknown Error:', error.message);
      return Promise.reject({
        message: error.message || 'Unknown error occurred.',
        status: null,
        data: null
      });
    }
  }
);

export default api;
