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

// Add this function to your existing aqi.js file

/**
 * Fetch historical AQI data for a city
 * @param {string} city - City name
 * @param {string} range - Time range (24h, 7d, 30d, 3m)
 * @returns {Promise} Historical AQI data
 */
export const getHistoricalAqi = async (city, range = '7d') => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/aqi/history/${encodeURIComponent(city)}?range=${range}`,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(getAuthToken() && { Authorization: `Bearer ${getAuthToken()}` }),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch historical AQI data: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching historical AQI:', error);
    throw error;
  }
};

/**
 * Fetch AQI history with fallback to mock data if API fails
 */
export const getHistoricalAqiWithFallback = async (city, range = '7d') => {
  try {
    const data = await getHistoricalAqi(city, range);
    return data;
  } catch (error) {
    console.warn('Using fallback historical data');
    return generateMockHistoricalData(city, range);
  }
};

/**
 * Generate mock historical data as fallback
 */
function generateMockHistoricalData(city, range) {
  const points = range === '24h' ? 8 : range === '7d' ? 7 : range === '30d' ? 10 : 12;
  const baseAQI = Math.floor(Math.random() * 80) + 20;
  const data = [];

  for (let i = 0; i < points; i++) {
    const wobble = Math.sin(i * 1.7) * 18 + Math.cos(i * 0.8) * 10;
    const val = Math.max(5, Math.round(baseAQI + wobble - (points - i) * 0.4));
    
    data.push({
      label: getMockLabel(range, i, points),
      aqi: val,
      timestamp: new Date(Date.now() - (points - i) * getTimeInterval(range)).toISOString(),
    });
  }

  if (data.length > 0) {
    data[data.length - 1].aqi = Math.round(baseAQI);
  }

  return data;
}

function getMockLabel(range, i, total) {
  const now = new Date();
  
  if (range === '24h') {
    const d = new Date(now.getTime() - (total - 1 - i) * 3 * 3600 * 1000);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  
  if (range === '7d') {
    const d = new Date(now.getTime() - (total - 1 - i) * 24 * 3600 * 1000);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  
  if (range === '30d') {
    const d = new Date(now.getTime() - (total - 1 - i) * 3 * 24 * 3600 * 1000);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  
  const d = new Date(now.getFullYear(), now.getMonth() - (total - 1 - i), 1);
  return d.toLocaleDateString([], { month: 'short', year: 'numeric' });
}

function getTimeInterval(range) {
  if (range === '24h') return 3 * 3600 * 1000;
  if (range === '7d') return 24 * 3600 * 1000;
  if (range === '30d') return 3 * 24 * 3600 * 1000;
  return 30 * 24 * 3600 * 1000;
}