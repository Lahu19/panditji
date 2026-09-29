/**
 * Pandit Portal API client.
 * All calls require PROVIDER token (userType === 'PROVIDER').
 */
import api from './client.js';

export const panditPortalApi = {
  /** Profile */
  me:             ()           => api.get('/pandit-portal/me'),
  updateProfile:  (data)       => api.patch('/pandit-portal/profile', data),
  updateLocation: (data)       => api.patch('/pandit-portal/location', data),
  submit:         ()           => api.patch('/pandit-portal/submit', {}),

  /** Onboarding step save */
  saveStep: (step, data)       => api.post('/pandit-portal/onboarding/step', { step, data }),

  /** Services catalog (from DB) */
  servicesCatalog: ()          => api.get('/pandit-portal/services-catalog'),

  /** My services */
  myServices:         ()       => api.get('/pandit-portal/my-services'),
  addService:         (data)   => api.post('/pandit-portal/my-services', data),
  updateService:      (id, d)  => api.patch(`/pandit-portal/my-services/${id}`, d),
  removeService:      (id)     => api.delete(`/pandit-portal/my-services/${id}`),

  /** Service areas */
  serviceAreas:       ()       => api.get('/pandit-portal/service-areas'),
  addServiceArea:     (data)   => api.post('/pandit-portal/service-areas', data),
  updateServiceArea:  (id, d)  => api.patch(`/pandit-portal/service-areas/${id}`, d),
  deleteServiceArea:  (id)     => api.delete(`/pandit-portal/service-areas/${id}`),

  /** Availability */
  getAvailability:    ()       => api.get('/pandit-portal/availability'),
  updateAvailability: (data)   => api.put('/pandit-portal/availability', data),
  blockDates:         (data)   => api.post('/pandit-portal/availability/block', data),

  /** Media */
  addMedia:    (data)          => api.post('/pandit-portal/media', data),
  deleteMedia: (mediaId)       => api.delete(`/pandit-portal/media/${mediaId}`),

  /** Bookings */
  bookings:         (params = {}) => api.get(`/pandit-portal/bookings?${new URLSearchParams(params)}`),
  booking:          (id)          => api.get(`/pandit-portal/bookings/${id}`),
  respondBooking:   (id, action, reason) =>
    api.patch(`/pandit-portal/bookings/${id}/respond`, { action, reason }),

  /** Earnings */
  earnings:         ()             => api.get('/pandit-portal/earnings'),

  /** Reviews */
  reviews:          (params = {})  => api.get(`/pandit-portal/reviews?${new URLSearchParams(params)}`),

  /** Notifications */
  notifications:    (params = {})  => api.get(`/pandit-portal/notifications?${new URLSearchParams(params)}`),
  markNotifRead:    (id)           => api.patch(`/pandit-portal/notifications/${id}/read`, {}),
};

export default panditPortalApi;
