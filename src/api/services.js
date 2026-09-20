import api from './client.js';

export const servicesApi = {
  list:   (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/services${qs ? '?' + qs : ''}`);
  },
  search: (q)           => api.get(`/services/search?q=${encodeURIComponent(q)}`),
  get:    (id)          => api.get(`/services/${id}`),
  create: (data)        => api.post('/services', data),
  update: (id, data)    => api.patch(`/services/${id}`, data),
  remove: (id)          => api.delete(`/services/${id}`),
};
