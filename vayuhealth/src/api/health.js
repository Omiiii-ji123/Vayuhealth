import client from './client';

// 5. Health Controller — /api

/** GET /api/health-stats/{district} — Retrieve health statistics for a district */
export const getHealthStatsByDistrict = async (district) => {
  try {
    const res = await client.get(`/api/health-stats/${encodeURIComponent(district)}`);
    return res.data;
  } catch (err) {
    console.warn(`Backend health stats for "${district}" unreachable, using fallback:`, err.message);
    return {
      district: district || 'Anand Vihar, Delhi',
      asthmaCases: 1420,
      copdCases: 610,
      vulnerabilityScore: 88,
      hospitalCapacity: 'High Alert',
    };
  }
};

/** GET /api/dashboard-data?userEmail=&district= — Retrieve consolidated dashboard data */
export const getConsolidatedDashboardData = async (userEmail, district) => {
  try {
    const res = await client.get('/api/dashboard-data', { params: { userEmail, district } });
    return res.data;
  } catch (err) {
    console.warn('Backend consolidated dashboard-data unreachable, using fallback payload:', err.message);
    return {
      userEmail: userEmail || 'user@vayuhealth.in',
      district: district || 'Anand Vihar, Delhi',
      healthStats: {
        district: district || 'Anand Vihar, Delhi',
        asthmaCases: 1420,
        copdCases: 610,
        vulnerabilityScore: 88,
      },
      history: [
        { label: 'Mon', aqi: 62 },
        { label: 'Tue', aqi: 68 },
        { label: 'Wed', aqi: 74 },
        { label: 'Thu', aqi: 65 },
        { label: 'Fri', aqi: 70 },
        { label: 'Sat', aqi: 68 },
        { label: 'Sun', aqi: 66 },
      ],
    };
  }
};
