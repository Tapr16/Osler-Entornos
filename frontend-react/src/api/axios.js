// src/api/axios.js — Instancia de Axios configurada
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Interceptor: agrega el JWT a todas las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('osler_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor: redirige al login si el token expiró
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('osler_token');
      localStorage.removeItem('osler_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
