import client from './client';

// 4. Disease Controller — /api/diseases

/** GET /api/diseases — Retrieve all diseases */
export const getAllDiseases = () => client.get('/api/diseases').then((r) => r.data);

/** GET /api/diseases/category/{category} — Filter diseases by category */
export const getDiseasesByCategory = (category) =>
  client.get(`/api/diseases/category/${encodeURIComponent(category)}`).then((r) => r.data);

/** GET /api/diseases/transmission/{transmission} — Filter diseases by transmission type */
export const getDiseasesByTransmission = (transmission) =>
  client.get(`/api/diseases/transmission/${encodeURIComponent(transmission)}`).then((r) => r.data);

/** GET /api/diseases/remedies/{diseaseName} — Retrieve remedies for a specific disease */
export const getDiseaseRemedies = (diseaseName) =>
  client.get(`/api/diseases/remedies/${encodeURIComponent(diseaseName)}`).then((r) => r.data);

/** GET /api/diseases/{idOrName} — Retrieve a disease using its ID or name */
export const getDiseaseByIdOrName = (idOrName) =>
  client.get(`/api/diseases/${encodeURIComponent(idOrName)}`).then((r) => r.data);
