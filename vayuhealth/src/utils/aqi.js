// Indian CPCB National Air Quality Index Bands
export const AQI_BANDS = [
  { max: 50, label: 'Good', color: '#10b981', tint: '#E6F5EC' },
  { max: 100, label: 'Satisfactory', color: '#22c55e', tint: '#E8F8ED' },
  { max: 200, label: 'Moderate', color: '#f59e0b', tint: '#FBF3DA' },
  { max: 300, label: 'Poor', color: '#f97316', tint: '#FCEADA' },
  { max: 400, label: 'Very Poor', color: '#ef4444', tint: '#F9E1DF' },
  { max: Infinity, label: 'Severe', color: '#7f1d1d', tint: '#F1E0E8' },
];

export function getAqiBand(value) {
  const v = Number(value);
  if (Number.isNaN(v)) return { max: 0, label: 'Unknown', color: 'var(--color-text-faint)', tint: 'var(--color-border)' };
  return AQI_BANDS.find((b) => v <= b.max) || AQI_BANDS[AQI_BANDS.length - 1];
}

export function firstDefined(obj, keys, fallback = undefined) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
  }
  return fallback;
}

export function calculatePollutantAqi(conc, cBreakpoints, iBreakpoints) {
  if (!conc || conc <= 0) return 0;
  for (let i = 0; i < cBreakpoints.length - 1; i++) {
    const cLow = cBreakpoints[i];
    const cHigh = cBreakpoints[i + 1];
    const iLow = iBreakpoints[i];
    const iHigh = iBreakpoints[i + 1];
    if (conc >= cLow && conc <= cHigh) {
      return Math.round(((iHigh - iLow) / (cHigh - cLow)) * (conc - cLow) + iLow);
    }
  }
  if (conc > cBreakpoints[cBreakpoints.length - 1]) return 500;
  return 0;
}

export function calculateStandardAqi(pm25, pm10, no2 = 0, so2 = 0, o3 = 0) {
  // Indian CPCB Breakpoints:
  // PM2.5: (0-30 Good, 31-60 Satisfactory, 61-90 Moderate, 91-120 Poor, 121-250 Very Poor, >250 Severe)
  const aqiPm25 = calculatePollutantAqi(pm25, [0, 30, 60, 90, 120, 250, 500], [0, 50, 100, 200, 300, 400, 500]);
  // PM10: (0-50 Good, 51-100 Satisfactory, 101-250 Moderate, 251-350 Poor, 351-430 Very Poor, >430 Severe)
  const aqiPm10 = calculatePollutantAqi(pm10, [0, 50, 100, 250, 350, 430, 600], [0, 50, 100, 200, 300, 400, 500]);
  const aqiNo2 = calculatePollutantAqi(no2, [0, 40, 80, 180, 280, 400, 800], [0, 50, 100, 200, 300, 400, 500]);
  const aqiSo2 = calculatePollutantAqi(so2, [0, 40, 80, 380, 800, 1600, 2000], [0, 50, 100, 200, 300, 400, 500]);
  const aqiO3 = calculatePollutantAqi(o3, [0, 50, 100, 168, 208, 748, 1000], [0, 50, 100, 200, 300, 400, 500]);
  return Math.max(aqiPm25, aqiPm10, aqiNo2, aqiSo2, aqiO3);
}

// Backend field names aren't guaranteed, so normalize defensively across
// common casings/aliases the Spring Boot service might return.
export function normalizeAqiRecord(raw) {
  if (!raw) return null;
  const record = Array.isArray(raw) ? raw[0] : raw;
  let rawAqi = Number(firstDefined(record, ['aqi', 'AQI', 'value', 'aqiValue', 'index'], 0));
  const pm25 = Number(firstDefined(record, ['pm25', 'pm2_5', 'PM2_5', 'pm2five'], 0));
  const pm10 = Number(firstDefined(record, ['pm10', 'PM10'], 0));
  const o3 = Number(firstDefined(record, ['o3', 'ozone', 'O3'], 0));
  const no2 = Number(firstDefined(record, ['no2', 'NO2'], 0));
  const so2 = Number(firstDefined(record, ['so2', 'SO2'], 0));
  const co = Number(firstDefined(record, ['co', 'CO'], 0));

  // Fix 1-6 categorical index scale if received instead of 0-500 scale
  if (rawAqi > 0 && rawAqi <= 6) {
    if (pm25 > 0 || pm10 > 0) {
      const calculated = calculateStandardAqi(pm25, pm10, no2, so2, o3);
      if (calculated > 0) {
        rawAqi = calculated;
      }
    } else {
      const indexMap = { 1: 35, 2: 65, 3: 125, 4: 175, 5: 250, 6: 350 };
      rawAqi = indexMap[rawAqi] || rawAqi;
    }
  }

  return {
    city: firstDefined(record, ['city', 'cityName', 'city_name', 'location', 'name', 'locationName'], 'Unknown'),
    state: firstDefined(record, ['state', 'stateName', 'region'], ''),
    aqi: rawAqi,
    pm25,
    pm10,
    o3,
    no2,
    so2,
    co,
    temperature: firstDefined(record, ['temperature', 'temperature_2m', 'temp'], null),
    humidity: firstDefined(record, ['humidity', 'relative_humidity_2m'], null),
    surfacePressure: firstDefined(record, ['surfacePressure', 'surface_pressure'], null),
    windSpeed: firstDefined(record, ['windSpeed', 'wind_speed_10m'], null),
    windDirection: firstDefined(record, ['windDirection', 'wind_direction_10m'], null),
    stationCode: firstDefined(record, ['stationCode', 'code'], 'DL001'),
    updatedAt: firstDefined(record, ['updatedAt', 'timestamp', 'lastUpdated', 'recordedAt', 'date'], null),
    lat: firstDefined(record, ['lat', 'latitude'], null),
    lon: firstDefined(record, ['lon', 'lng', 'longitude'], null),
    history: firstDefined(record, ['history', 'hourly'], null),
    raw: record,
  };
}

export function normalizeAqiList(raw) {
  const list = Array.isArray(raw) ? raw : raw?.content || raw?.data || raw?.records || [];
  if (!Array.isArray(list)) return [];
  return list.map(normalizeAqiRecord).filter(Boolean);
}

export function formatRelativeTime(dateLike) {
  if (!dateLike) return 'just now';
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return 'just now';
  const diffMs = Date.now() - d.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
