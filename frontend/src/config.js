// Central API configuration
// In development: uses localhost
// In production: reads from VITE_API_URL environment variable (set on Vercel)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default API_BASE_URL;
