// API configuration for production deployment
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://your-render-backend-url.onrender.com'  // Replace with your Render URL
  : 'http://localhost:5000';

export default API_BASE_URL;
