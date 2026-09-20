import api from './client.js';

export const conversationsApi = {
  start:       (data)         => api.post('/conversations', data),
  list:        ()             => api.get('/conversations'),
  get:         (id)           => api.get(`/conversations/${id}`),
  sendMessage: (id, data)     => api.post(`/conversations/${id}/messages`, data),
  archive:     (id)           => api.patch(`/conversations/${id}/archive`),
};
