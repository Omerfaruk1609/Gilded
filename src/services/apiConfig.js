const isProd = typeof window !== 'undefined' && (import.meta.env.PROD || window.location.hostname !== 'localhost');
const API_URL = import.meta.env.VITE_API_URL || (isProd ? '/api' : 'http://localhost:5000/api');
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (isProd ? (typeof window !== 'undefined' ? window.location.origin : '') : 'http://localhost:5000');

export { API_URL, API_BASE_URL };
