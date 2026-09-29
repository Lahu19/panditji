/**
 * Geo location API client.
 */
import api from './client.js';

export const geoApi = {
  /** Resolve lat/lng → normalized location object */
  resolve: (latitude, longitude) =>
    api.post('/geo/resolve', { latitude, longitude }),

  /** Search cities + areas by text */
  search: (q, limit = 10) =>
    api.get(`/geo/search?q=${encodeURIComponent(q)}&limit=${limit}`),

  /** Hierarchy lookups */
  countries: ()               => api.get('/geo/countries'),
  states:    (countryId)      => api.get(`/geo/states?countryId=${countryId}`),
  cities:    (stateId)        => api.get(`/geo/cities?stateId=${stateId}`),
  areas:     (cityId)         => api.get(`/geo/areas?cityId=${cityId}`),
  location:  (id)             => api.get(`/geo/location/${id}`),

  /** Admin CRUD */
  createCountry: (data)       => api.post('/geo/countries', data),
  updateCountry: (id, data)   => api.patch(`/geo/countries/${id}`, data),
  createState:   (data)       => api.post('/geo/states', data),
  updateState:   (id, data)   => api.patch(`/geo/states/${id}`, data),
  createCity:    (data)       => api.post('/geo/cities', data),
  updateCity:    (id, data)   => api.patch(`/geo/cities/${id}`, data),
  createArea:    (data)       => api.post('/geo/areas', data),
  updateArea:    (id, data)   => api.patch(`/geo/areas/${id}`, data),

  /** Provider service areas */
  providerAreas:       (providerId) => api.get(`/geo/provider-service-areas?providerId=${providerId}`),
  createProviderArea:  (data)       => api.post('/geo/provider-service-areas', data),
  updateProviderArea:  (id, data)   => api.patch(`/geo/provider-service-areas/${id}`, data),
  deleteProviderArea:  (id)         => api.delete(`/geo/provider-service-areas/${id}`),
};

export default geoApi;
