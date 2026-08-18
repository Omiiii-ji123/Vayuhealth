// AQI category bands (US EPA-style, matching the reference product design).
export const AQI_BANDS = [
  { max: 50, label: 'Good', color: 'var(--color-good)', tint: '#E6F5EC' },
  { max: 100, label: 'Moderate', color: 'var(--color-moderate)', tint: '#FBF3DA' },
  { max: 150, label: 'Poor', color: 'var(--color-poor)', tint: '#FCEADA' },
  { max: 200, label: 'Poor', color: 'var(--color-poor)', tint: '#FCEADA' },
  { max: 300, label: 'Very Poor', color: 'var(--color-vpoor)', tint: '#F9E1DF' },
  { max: Infinity, label: 'Hazardous', color: 'var(--color-hazardous)', tint: '#F1E0E8' },
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

// Backend field names aren't guaranteed, so normalize defensively across
// common casings/aliases the Spring Boot service might return.
export function normalizeAqiRecord(raw) {
  if (!raw) return null;
  const record = Array.isArray(raw) ? raw[0] : raw;
  return {
    city: firstDefined(record, ['city', 'cityName', 'city_name', 'location', 'name'], 'Unknown'),
    state: firstDefined(record, ['state', 'stateName', 'region'], ''),
    aqi: Number(firstDefined(record, ['aqi', 'AQI', 'value', 'aqiValue', 'index'], 0)),
    pm25: Number(firstDefined(record, ['pm25', 'pm2_5', 'PM2_5', 'pm2five'], 0)),
    pm10: Number(firstDefined(record, ['pm10', 'PM10'], 0)),
    o3: Number(firstDefined(record, ['o3', 'ozone', 'O3'], 0)),
    no2: Number(firstDefined(record, ['no2', 'NO2'], 0)),
    so2: Number(firstDefined(record, ['so2', 'SO2'], 0)),
    co: Number(firstDefined(record, ['co', 'CO'], 0)),
    updatedAt: firstDefined(record, ['updatedAt', 'timestamp', 'lastUpdated', 'recordedAt', 'date'], null),
    lat: firstDefined(record, ['lat', 'latitude'], null),
    lon: firstDefined(record, ['lon', 'lng', 'longitude'], null),
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
