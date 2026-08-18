import { firstDefined } from './aqi';

export function normalizeDisease(raw) {
  if (!raw) return null;
  const d = Array.isArray(raw) ? raw[0] : raw;
  return {
    id: firstDefined(d, ['id', '_id', 'diseaseId'], d.name),
    name: firstDefined(d, ['name', 'diseaseName', 'title'], 'Unknown condition'),
    category: firstDefined(d, ['category', 'type'], 'General'),
    transmission: firstDefined(d, ['transmission', 'transmissionType'], 'Unknown'),
    description: firstDefined(d, ['description', 'summary', 'details'], ''),
    symptoms: firstDefined(d, ['symptoms'], []),
    remedies: firstDefined(d, ['remedies', 'remedy', 'treatments'], []),
    severity: firstDefined(d, ['severity', 'riskLevel'], ''),
    raw: d,
  };
}

export function normalizeDiseaseList(raw) {
  const list = Array.isArray(raw) ? raw : raw?.content || raw?.data || raw?.records || [];
  if (!Array.isArray(list)) return [];
  return list.map(normalizeDisease).filter(Boolean);
}

export function toArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') return val.split(/\n|,/).map((s) => s.trim()).filter(Boolean);
  return [String(val)];
}
