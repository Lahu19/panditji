import api from './client.js';

export const categoriesApi = {
  list:   (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/categories${qs ? '?' + qs : ''}`);
  },
  get:    (id)          => api.get(`/categories/${id}`),
  create: (data)        => api.post('/categories', data),
  update: (id, data)    => api.patch(`/categories/${id}`, data),
  remove: (id)          => api.delete(`/categories/${id}`),
};
