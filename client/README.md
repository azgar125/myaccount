# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.



import axios from 'axios';

// VITE_API_URL must NOT include /api — only the base domain
// Example: https://client-accounting-system.onrender.com
const API_URL = (
  import.meta.env.VITE_API_URL  || 'https://client-accounting-system.onrender.com'
).replace(/\/api\/?$/, '');

/**
 * Get XSRF token from cookies (for cross-domain Sanctum auth)
 */
function getXsrfToken() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Main API instance — cross-domain Sanctum SPA auth
 */
const api = axios.create({
  baseURL: `${API_URL}/api`,   // ✅ /api যোগ করা হচ্ছে এখানে
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

/**
 * Request interceptor — force X-XSRF-TOKEN header on every request
 */
api.interceptors.request.use(
  (config) => {
    const token = getXsrfToken();
    if (token) {
      config.headers['X-XSRF-TOKEN'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Get CSRF cookie from Laravel before login
 */
export async function ensureCsrfCookie() {
  return axios.get(`${API_URL}/sanctum/csrf-cookie`, {
    withCredentials: true,
    headers: { Accept: 'application/json' },
  });
}

/**
 * Response interceptor — handle 401 redirects
 */
let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      if (!path.startsWith('/login') && !isRedirecting) {
        isRedirecting = true;
        setTimeout(() => {
          window.location.href = '/login';
          isRedirecting = false;
        }, 100);
      }
    }

    error.userMessage =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong';

    return Promise.reject(error);
  }
);

export default api;