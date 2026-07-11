import axios from 'axios';
import { API_URL } from './apiConfig';

// Axios Instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Inject JWT token strictly for local API requests
apiClient.interceptors.request.use(
  (config) => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // Only attach token if the request is destined for our own backend API
        // Checks if path is relative or starts with baseURL to prevent token leak
        const isLocalApi = !config.url.startsWith('http') || config.url.startsWith(API_URL);
        if (user && user.token && isLocalApi) {
          config.headers['Authorization'] = `Bearer ${user.token}`;
        }
      } catch (e) {
        console.error('Failed to parse user for auth header', e);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401 Unauthorized globally
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear user from local storage
      localStorage.removeItem('user');
      // Dispatch event so socket and UI updates
      window.dispatchEvent(new Event('auth-change'));
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
