import api from './api';

export const dashboardService = {
  admin: () => api.get('/admin/dashboard').then((r) => r.data),
  client: () => api.get('/client/dashboard').then((r) => r.data),
};

export default dashboardService;