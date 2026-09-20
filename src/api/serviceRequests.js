import api from './client.js';

export const serviceRequestsApi = {
  create:  (data)       => api.post('/service-requests', data),
  list:    ()           => api.get('/service-requests'),
  get:     (id)         => api.get(`/service-requests/${id}`),
  update:  (id, data)   => api.patch(`/service-requests/${id}`, data),
  match:   (id)         => api.post(`/service-requests/${id}/match`),
};
