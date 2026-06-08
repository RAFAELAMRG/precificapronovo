import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add authorization JWT token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('precificapro_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration/unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if session expires
      localStorage.removeItem('precificapro_token');
      localStorage.removeItem('precificapro_user');
      if (window.location.hash !== '#/login' && window.location.hash !== '#/cadastro') {
        window.location.href = '#/login';
      }
    } else if (
      error.response &&
      error.response.status === 403 &&
      error.response.data &&
      error.response.data.code === 'SUBSCRIPTION_REQUIRED'
    ) {
      // Redirect to subscription wall
      if (window.location.hash !== '#/assinatura') {
        window.location.hash = '#/assinatura';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
