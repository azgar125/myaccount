import api from './api';

export const clientPortalService = {
  dashboard:    () => api.get('/client/dashboard').then((r) => r.data),
  profile:      () => api.get('/client/profile').then((r) => r.data),
  accounts:     (params = {}) => api.get('/client/accounts', { params }).then((r) => r.data),
  transactions: (params = {}) => api.get('/client/transactions', { params }).then((r) => r.data),
  reports:      (params = {}) => api.get('/client/reports', { params }).then((r) => r.data),
  statements:   (params = {}) => api.get('/client/statements', { params }).then((r) => r.data),
};

export default clientPortalService;