import client from './client';

// 1. AQI Controller — /api/aqi

/** GET /api/aqi/city/{cityName} — Retrieve AQI data for a specific city */
export const getAqiByCity = (cityName) =>
  client.get(`/api/aqi/city/${encodeURIComponent(cityName)}`).then((r) => r.data);

/** GET /api/aqi/coords?lat=&lon= — Retrieve AQI data using latitude and longitude */
export const getAqiByCoords = (lat, lon) =>
  client.get('/api/aqi/coords', { params: { lat, lon } }).then((r) => r.data);

/** GET /api/aqi/all — Retrieve all available AQI records */
export const getAllAqi = () => client.get('/api/aqi/all').then((r) => r.data);
