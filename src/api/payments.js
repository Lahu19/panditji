import api from './client.js';

export const paymentsApi = {
  create:  (data)       => api.post('/payments', data),
  confirm: (id, data)   => api.post(`/payments/${id}/confirm`, data),
  list:    ()           => api.get('/payments'),
  get:     (id)         => api.get(`/payments/${id}`),
  refund:  (id, data)   => api.post(`/payments/${id}/refund`, data),
};
