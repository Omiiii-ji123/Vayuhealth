import client from './client';

// 3. Dashboard Controller — /api/dashboard

/** GET /api/dashboard/surveillance — Retrieve overall health-surveillance statistics */
export const getSurveillanceStats = () =>
  client.get('/api/dashboard/surveillance').then((r) => r.data);

/** GET /api/dashboard/city/{city} — Retrieve surveillance statistics for a specific city */
export const getSurveillanceByCity = (city) =>
  client.get(`/api/dashboard/city/${encodeURIComponent(city)}`).then((r) => r.data);

/** GET /api/dashboard/state/{state} — Retrieve surveillance statistics for a specific state */
export const getSurveillanceByState = (state) =>
  client.get(`/api/dashboard/state/${encodeURIComponent(state)}`).then((r) => r.data);
