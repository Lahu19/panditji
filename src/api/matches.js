import api from './client.js';

export const matchesApi = {
  list:   (requestId) => api.get(`/matches?requestId=${requestId}`),
  select: (matchId)   => api.patch(`/matches/${matchId}/select`),
};
