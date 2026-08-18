import client from './client';

// 1. AQI Controller — /api/aqi

/** GET /api/aqi/city/{cityName} */
export const getAqiByCity = (cityName) =>
  client
    .get(`/api/aqi/city/${encodeURIComponent(cityName)}`)
    .then((r) => r.data);


/** GET /api/aqi/location?lat=&lng=
 * Retrieve AQI for the user's current location.
 */
export const getAqiByLocation = (lat, lng) =>
  client
    .get('/api/aqi/location', {
      params: { lat, lng },
    })
    .then((r) => r.data);


/** GET /api/aqi/coords?lat=&lng=
 * Backwards-compatible endpoint.
 *
 * Kept because AirQualityMap.jsx and potentially
 * other existing components still use getAqiByCoords.
 */
export const getAqiByCoords = (lat, lng) =>
  client
    .get('/api/aqi/coords', {
      params: { lat, lng },
    })
    .then((r) => r.data);


/** GET /api/aqi/all */
export const getAllAqi = () =>
  client
    .get('/api/aqi/all')
    .then((r) => r.data);