import api from './client.js';

export const providersApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/providers${qs ? '?' + qs : ''}`);
  },
  search:          (q)          => api.get(`/providers/search?q=${encodeURIComponent(q)}`),
  get:             (id)         => api.get(`/providers/${id}`),
  create:          (data)       => api.post('/providers', data),
  update:          (id, data)   => api.patch(`/providers/${id}`, data),
  addMedia:        (id, data)   => api.post(`/providers/${id}/media`, data),
  getAvailability: (id)         => api.get(`/providers/${id}/availability`),
  updateAvailability: (id, data) => api.patch(`/providers/${id}/availability`, data),
};
