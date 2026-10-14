import api from './api';

export const transactionService = {
  list: (params = {}) =>
    api.get('/transactions', { params }).then((r) => r.data),

  get: (id) =>
    api.get(`/transactions/${id}`).then((r) => r.data),

  create: (payload) =>
    api.post('/transactions', payload).then((r) => r.data),

  remove: (id) =>
    api.delete(`/transactions/${id}`).then((r) => r.data),

  addPartialSale: (parentId, payload) =>
    api.post(`/transactions/${parentId}/partial-sales`, payload).then((r) => r.data),

  addPayment: (transactionId, payload) =>
    api.post(`/transactions/${transactionId}/payments`, payload).then((r) => r.data),
};

export default transactionService;