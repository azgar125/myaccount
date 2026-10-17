import api, { tokenStorage } from './api';

export const authService = {
  async login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    const token = data?.data?.token;
    if (token) tokenStorage.set(token);
    return data;
  },

  async logout() {
    try {
      const { data } = await api.post('/auth/logout');
      return data;
    } finally {
      tokenStorage.clear();
    }
  },

  async me() {
    const { data } = await api.get('/auth/me');
    return data;
  },
};

export default authService;


// import api, { ensureCsrfCookie } from './api';

// export const authService = {
//   async login(email, password) {
//     // 1. Get CSRF cookie first
//     await ensureCsrfCookie();

//     // 2. POST credentials
//     const { data } = await api.post('/auth/login', { email, password });

//     return data;
//   },

//   async logout() {
//     const { data } = await api.post('/auth/logout');
//     return data;
//   },

//   async me() {
//     const { data } = await api.get('/auth/me');
//     return data;
//   },
// };

// export default authService;



// import api, { ensureCsrfCookie } from './api';

// export const authService = {
//   async login(email, password) {
//     await ensureCsrfCookie();
//     const { data } = await api.post('/auth/login', { email, password });
//     return data;
//   },

//   async logout() {
//     const { data } = await api.post('/auth/logout');
//     return data;
//   },

//   async me() {
//     const { data } = await api.get('/auth/me');
//     return data;
//   },
// };

// export default authService;

