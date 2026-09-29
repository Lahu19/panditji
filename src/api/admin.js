/**
 * Admin API client.
 * All calls require the logged-in user to have userType === 'ADMIN'.
 */
import api from './client.js';

export const adminApi = {
  /** Dashboard */
  dashboard: () => api.get('/admin/dashboard'),

  /** Users */
  users:      (params = {}) => api.get(`/admin/users?${new URLSearchParams(params)}`),
  user:       (id)          => api.get(`/admin/users/${id}`),
  updateUser: (id, data)    => api.patch(`/admin/users/${id}`, data),

  /** Providers */
  providers:      (params = {}) => api.get(`/admin/providers?${new URLSearchParams(params)}`),
  provider:       (id)          => api.get(`/admin/providers/${id}`),
  verifyProvider: (id, data)    => api.patch(`/admin/providers/${id}/verify`, data),
  setProviderStatus: (id, status) => api.patch(`/admin/providers/${id}/status`, { status }),

  /** Service requests */
  serviceRequests: (params = {}) => api.get(`/admin/service-requests?${new URLSearchParams(params)}`),

  /** Matches */
  matches: (params = {}) => api.get(`/admin/matches?${new URLSearchParams(params)}`),

  /** Bookings */
  bookings: (params = {}) => api.get(`/admin/bookings?${new URLSearchParams(params)}`),
  booking:  (id)          => api.get(`/admin/bookings/${id}`),

  /** Payments */
  payments: (params = {}) => api.get(`/admin/payments?${new URLSearchParams(params)}`),

  /** Reviews */
  reviews:       (params = {})      => api.get(`/admin/reviews?${new URLSearchParams(params)}`),
  moderateReview:(id, action, note) => api.patch(`/admin/reviews/${id}/moderate`, { action, note }),

  /** Audit logs */
  auditLogs: (params = {}) => api.get(`/admin/audit-logs?${new URLSearchParams(params)}`),

  /** Location stats */
  locationStats: (params = {}) => api.get(`/admin/location-stats?${new URLSearchParams(params)}`),

  /** Services */
  services: (params = {}) => api.get(`/admin/services?${new URLSearchParams(params)}`),
  service:  (id)          => api.get(`/admin/services/${id}`),
};

export default adminApi;
