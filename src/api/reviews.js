import api from './client.js';

export const reviewsApi = {
  create:      (data)         => api.post('/reviews', data),
  list:        (params = {})  => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/reviews${qs ? '?' + qs : ''}`);
  },
  get:         (id)           => api.get(`/reviews/${id}`),
};
