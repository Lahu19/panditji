import api from './client.js';

export const providerAvailabilityApi = {
  get:      (providerId)        => api.get(`/provider-availability/${providerId}`),
  update:   (providerId, data)  => api.put(`/provider-availability/${providerId}`, data),
  block:    (providerId, data)  => api.post(`/provider-availability/${providerId}/block`, data),
  getSlots: (providerId, date)  => api.get(`/provider-availability/${providerId}/slots?date=${date}`),
};
