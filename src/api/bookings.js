import api from './client.js';

export const bookingsApi = {
  create:       (data)          => api.post('/bookings', data),
  list:         (params = {})   => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/bookings${qs ? '?' + qs : ''}`);
  },
  get:          (id)            => api.get(`/bookings/${id}`),
  updateStatus: (id, data)      => api.patch(`/bookings/${id}/status`, data),
};
