import client from './client';

// 5. Health Controller — /api

/** GET /api/health-stats/{district} — Retrieve health statistics for a district */
export const getHealthStatsByDistrict = (district) =>
  client.get(`/api/health-stats/${encodeURIComponent(district)}`).then((r) => r.data);

/** GET /api/dashboard-data?userEmail=&district= — Retrieve consolidated dashboard data */
export const getConsolidatedDashboardData = (userEmail, district) =>
  client
    .get('/api/dashboard-data', { params: { userEmail, district } })
    .then((r) => r.data);
