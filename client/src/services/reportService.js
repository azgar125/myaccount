import api from './api';

export const reportService = {
  // Reports
  daily:   (params) => api.get('/reports/daily', { params }).then((r) => r.data),
  weekly:  (params) => api.get('/reports/weekly', { params }).then((r) => r.data),
  monthly: (params) => api.get('/reports/monthly', { params }).then((r) => r.data),
  client:  (clientId) => api.get(`/reports/client/${clientId}`).then((r) => r.data),

  // Profit
  profitDaily:   (params) => api.get('/profit/daily', { params }).then((r) => r.data),
  profitWeekly:  (params) => api.get('/profit/weekly', { params }).then((r) => r.data),
  profitMonthly: (params) => api.get('/profit/monthly', { params }).then((r) => r.data),

  // Charts
  chartDaily:   (params) => api.get('/profit/chart/daily', { params }).then((r) => r.data),
  chartMonthly: (params) => api.get('/profit/chart/monthly', { params }).then((r) => r.data),

  // Statements
  statement: (params) => api.get('/statements', { params }).then((r) => r.data),
  downloadStatement: (params) =>
    api.get('/statements/download', { params, responseType: 'blob' }),

  // Exports
  exportPdf: (params) =>
    api.get('/export/pdf', { params, responseType: 'blob' }),
  exportExcel: (params) =>
    api.get('/export/excel', { params, responseType: 'blob' }),
  printUrl: (params) => {
    const qs = new URLSearchParams(params).toString();
    return `${import.meta.env.VITE_API_URL}/export/print?${qs}`;
  },
};

export function downloadBlob(response, filename) {
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export default reportService;