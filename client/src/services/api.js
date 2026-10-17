import axios from 'axios';

// Production: Vercel proxy (same-origin /api), Local: Laravel on :8000
const API_URL = import.meta.env.PROD
  ? ''
  : (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '');

const TOKEN_KEY = 'auth_token';

export const tokenStorage = {
  get: () => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set: (token) => {
    try { localStorage.setItem(TOKEN_KEY, token); } catch { /* ignore */ }
  },
  clear: () => {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
  },
};

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// প্রতি রিকোয়েস্টে Bearer token পাঠাবে
api.interceptors.request.use(
  (config) => {
    const token = tokenStorage.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      tokenStorage.clear();
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




// import axios from 'axios';

// // VITE_API_URL must NOT include /api — only the base domain
// // Example: https://client-accounting-system.onrender.com
// const API_URL = (
//   import.meta.env.VITE_API_URL  || 'https://myaccount-production-a114.up.railway.app/'
// ).replace(/\/api\/?$/, '');

// /**
//  * Get XSRF token from cookies (for cross-domain Sanctum auth)
//  */
// function getXsrfToken() {
//   if (typeof document === 'undefined') return null;
//   const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
//   return match ? decodeURIComponent(match[1]) : null;
// }

// /**
//  * Main API instance — cross-domain Sanctum SPA auth
//  */
// const api = axios.create({
//   baseURL: `${API_URL}/api`,   // ✅ /api যোগ করা হচ্ছে এখানে
//   withCredentials: true,
//   withXSRFToken: true,
//   xsrfCookieName: 'XSRF-TOKEN',
//   xsrfHeaderName: 'X-XSRF-TOKEN',
//   headers: {
//     Accept: 'application/json',
//     'X-Requested-With': 'XMLHttpRequest',
//     'Content-Type': 'application/json',
//   },
//   timeout: 30000,
// });

// /**
//  * Request interceptor — force X-XSRF-TOKEN header on every request
//  */
// api.interceptors.request.use(
//   (config) => {
//     const token = getXsrfToken();
//     if (token) {
//       config.headers['X-XSRF-TOKEN'] = token;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// /**
//  * Get CSRF cookie from Laravel before login
//  */
// export async function ensureCsrfCookie() {
//   return axios.get(`${API_URL}/sanctum/csrf-cookie`, {
//     withCredentials: true,
//     headers: { Accept: 'application/json' },
//   });
// }

// /**
//  * Response interceptor — handle 401 redirects
//  */
// let isRedirecting = false;

// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       const path = window.location.pathname;
//       if (!path.startsWith('/login') && !isRedirecting) {
//         isRedirecting = true;
//         setTimeout(() => {
//           window.location.href = '/login';
//           isRedirecting = false;
//         }, 100);
//       }
//     }

//     error.userMessage =
//       error.response?.data?.message ||
//       error.message ||
//       'Something went wrong';

//     return Promise.reject(error);
//   }
// );

// export default api;






// import axios from 'axios';

// // For localhost development
// // Laravel backend typically runs on http://localhost:8000
// const API_URL = (
//   import.meta.env.VITE_API_URL || 'http://localhost:8000'
// ).replace(/\/api\/?$/, '');

// /**
//  * Get XSRF token from cookies (for Sanctum auth)
//  */
// function getXsrfToken() {
//   if (typeof document === 'undefined') return null;
//   const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
//   return match ? decodeURIComponent(match[1]) : null;
// }

// /**
//  * Main API instance — Sanctum SPA auth (localhost)
//  */
// const api = axios.create({
//   baseURL: `${API_URL}/api`,
//   withCredentials: true,
//   withXSRFToken: true,
//   xsrfCookieName: 'XSRF-TOKEN',
//   xsrfHeaderName: 'X-XSRF-TOKEN',
//   headers: {
//     Accept: 'application/json',
//     'X-Requested-With': 'XMLHttpRequest',
//     'Content-Type': 'application/json',
//   },
//   timeout: 30000,
// });

// /**
//  * Request interceptor — force X-XSRF-TOKEN header on every request
//  */
// api.interceptors.request.use(
//   (config) => {
//     const token = getXsrfToken();
//     if (token) {
//       config.headers['X-XSRF-TOKEN'] = token;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// /**
//  * Get CSRF cookie from Laravel before login
//  */
// export async function ensureCsrfCookie() {
//   return axios.get(`${API_URL}/sanctum/csrf-cookie`, {
//     withCredentials: true,
//     headers: { Accept: 'application/json' },
//   });
// }

// /**
//  * Response interceptor — handle 401 redirects
//  */
// let isRedirecting = false;

// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       const path = window.location.pathname;
//       if (!path.startsWith('/login') && !isRedirecting) {
//         isRedirecting = true;
//         setTimeout(() => {
//           window.location.href = '/login';
//           isRedirecting = false;
//         }, 100);
//       }
//     }

//     error.userMessage =
//       error.response?.data?.message ||
//       error.message ||
//       'Something went wrong';

//     return Promise.reject(error);
//   }
// );

// export default api;


