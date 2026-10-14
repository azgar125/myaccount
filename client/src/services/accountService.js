import api from './api';

export const accountService = {
  list: (params = {}) =>
    api.get('/accounts', { params }).then((r) => r.data),

  get: (id) =>
    api.get(`/accounts/${id}`).then((r) => r.data),

  create: (payload) =>
    api.post('/accounts', payload).then((r) => r.data),

  update: (id, payload) =>
    api.put(`/accounts/${id}`, payload).then((r) => r.data),

  remove: (id) =>
    api.delete(`/accounts/${id}`).then((r) => r.data),
};

export default accountService;