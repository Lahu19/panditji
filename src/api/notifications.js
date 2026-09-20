import api from './client.js';

export const notificationsApi = {
  list:      (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/notifications${qs ? '?' + qs : ''}`);
  },
  markRead:  (id)          => api.patch(`/notifications/${id}/read`),
  markAllRead: ()          => api.patch('/notifications/read-all'),
  remove:    (id)          => api.delete(`/notifications/${id}`),
};
