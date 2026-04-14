import axios from 'axios';

let prodApiHintShown = false;

function resolvedApiBase() {
  const raw = import.meta.env.VITE_API_URL;
  const trimmed = raw != null ? String(raw).trim() : '';
  if (trimmed !== '') {
    let base = trimmed.replace(/\/+$/, '');
    if (!base.endsWith('/api')) base = `${base}/api`;
    return base;
  }

  const devBackend = String(import.meta.env.VITE_BACKEND_ORIGIN ?? '').trim();
  if (import.meta.env.DEV && devBackend !== '') {
    // Origin only (e.g. http://127.0.0.1:5000). If .env mistakenly ends with /api, avoid /api/api/courses.
    let origin = devBackend.replace(/\/+$/, '').replace(/\/api$/i, '');
    return `${origin}/api`;
  }

  if (import.meta.env.PROD && typeof window !== 'undefined' && !prodApiHintShown) {
    prodApiHintShown = true;
    // eslint-disable-next-line no-console
    console.info(
      '[InternHub] API base is same-origin /api. For production on a separate API host, set VITE_API_URL before build.'
    );
  }

  return '/api';
}

export function apiBaseURL() {
  return resolvedApiBase();
}

const client = axios.create({
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  config.baseURL = apiBaseURL();
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default client;
