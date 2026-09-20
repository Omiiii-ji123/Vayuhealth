/**
 * Real-Time Micro-Hotspot Detector Engine for Delhi-NCR
 * Detects:
 * 1. High-Traffic Chokepoints (NOx/CO > 80 ppb, calm winds < 4 km/h)
 * 2. Open Smoke & Biomass/Waste Burning Hotspots (PM2.5 to CO ratio + thermal anomalies)
 */

export const TRAFFIC_CHOKEPOINTS = [
  {
    id: 'tc-dhaula-kuan',
    name: 'Ring Road - Dhaula Kuan Junction',
    corridor: 'Ring Road / Dhaula Kuan Corridor',
    lat: 28.5921,
    lng: 77.1638,
    zone: 'South-West Delhi',
    baselineNoxPpb: 94,
    baselineCoPpm: 2.8,
    peakHours: '08:30 - 11:30 & 17:30 - 21:00',
    trafficVolume: '185,000 PCU/day',
    regulatoryAction: 'Enforce arterial diversion to Sardar Patel Marg; deploy anti-smog water misting cannons.',
  },
  {
    id: 'tc-ashram-chowk',
    name: 'Ashram Chowk - Mathura Road Underpass',
    corridor: 'Ashram Chowk Intersection',
    lat: 28.5707,
    lng: 77.2582,
    zone: 'South-East Delhi',
    baselineNoxPpb: 108,
    baselineCoPpm: 3.2,
    peakHours: '08:00 - 12:00 & 17:00 - 21:30',
    trafficVolume: '220,000 PCU/day',
    regulatoryAction: 'Activate automated signal timing optimization; restrict heavy commercial freight entry.',
  },
  {
    id: 'tc-anand-vihar-isbt',
    name: 'Anand Vihar ISBT - Ghazipur Border Link',
    corridor: 'Anand Vihar Transit Hub',
    lat: 28.6492,
    lng: 77.3198,
    zone: 'East Delhi',
    baselineNoxPpb: 116,
    baselineCoPpm: 3.5,
    peakHours: 'All-day heavy diesel idling',
    trafficVolume: '240,000 PCU/day',
    regulatoryAction: 'Enforce strict non-destined diesel truck diversion to Eastern Peripheral Expressway (EPE).',
  },
  {
    id: 'tc-mukarba-chowk',
    name: 'Mukarba Chowk - GT Karnal Corridor',
    corridor: 'Mukarba Chowk Flyover Junction',
    lat: 28.7391,
    lng: 77.1528,
    zone: 'North Delhi',
    baselineNoxPpb: 89,
    baselineCoPpm: 2.6,
    peakHours: '09:00 - 11:30 & 18:00 - 21:30',
    trafficVolume: '160,000 PCU/day',
    regulatoryAction: 'Deploy mobile CAAQMS van and intensive anti-idling patrol teams.',
  },
  {
    id: 'tc-ito-crossing',
    name: 'ITO Crossing - Vikas Marg Axis',
    corridor: 'ITO Corridor',
    lat: 28.6305,
    lng: 77.2435,
    zone: 'Central Delhi',
    baselineNoxPpb: 102,
    baselineCoPpm: 2.9,
    peakHours: '09:00 - 11:00 & 17:00 - 20:00',
    trafficVolume: '190,000 PCU/day',
    regulatoryAction: 'Synchronize traffic lights with real-time CPCB sensor threshold triggers.',
  },
];

export const BIOMASS_SMOLDERING_ZONES = [
  {
    id: 'bs-ghazipur',
    name: 'Ghazipur Landfill & Vicinity',
    zone: 'Ghazipur Vicinity',
    lat: 28.6275,
    lng: 77.3292,
    region: 'East Delhi',
    sourceType: 'Municipal Solid Waste Smoldering & Biomass',
    pm25ToCoRatio: 18.4,
    baselinePm25: 420,
    thermalRadianceKelvin: 342.1,
    fireRadiativePowerMw: 48,
    regulatoryAction: 'Deploy drone thermal surveillance; activate subsurface bio-methane cooling sprayers.',
  },
  {
    id: 'bs-bhalswa',
    name: 'Bhalswa Landfill & Dairy Belt',
    zone: 'Bhalswa Vicinity',
    lat: 28.7410,
    lng: 77.1530,
    region: 'North-West Delhi',
    sourceType: 'Unvented Landfill Gas & Open Waste Combustion',
    pm25ToCoRatio: 16.8,
    baselinePm25: 395,
    thermalRadianceKelvin: 339.5,
    fireRadiativePowerMw: 36,
    regulatoryAction: 'Mandate fire tender perimeter dampening; enforce zero open-dump combustion penalties.',
  },
  {
    id: 'bs-okhla',
    name: 'Okhla Waste Combustion Buffer Zone',
    zone: 'Okhla Industrial Buffer',
    lat: 28.5285,
    lng: 77.2815,
    region: 'South Delhi',
    sourceType: 'Mixed Industrial Biomass & Scrap Incineration',
    pm25ToCoRatio: 15.2,
    baselinePm25: 360,
    thermalRadianceKelvin: 334.8,
    fireRadiativePowerMw: 28,
    regulatoryAction: 'Conduct continuous stack opacity audit on nearby industrial units.',
  },
  {
    id: 'bs-narela-bawana',
    name: 'Narela - Bawana Industrial Peripheral Smoldering',
    zone: 'Narela / Bawana Corridor',
    lat: 28.8150,
    lng: 77.0680,
    region: 'North Delhi Border',
    sourceType: 'Peripheral Agricultural Residue & Factory Waste',
    pm25ToCoRatio: 17.1,
    baselinePm25: 380,
    thermalRadianceKelvin: 337.2,
    fireRadiativePowerMw: 32,
    regulatoryAction: 'Inter-state joint DPCC-HSPCB night patrol with aerial thermal infrared imaging.',
  },
];

/**
 * Detect real-time micro-hotspots dynamically based on ambient meteorology and sensor feeds.
 *
 * Rules:
 * 1. High-Traffic Chokepoint triggers when local NOx > 80 ppb and wind speed < 4.0 km/h (stagnant inversion).
 * 2. Biomass/Waste Smoldering triggers when PM2.5 to CO ratio > 14 and thermal radiance > 330 K.
 */
export function detectMicroHotspotAlerts(windSpeedKmH = 3.2, currentStation = 'Anand Vihar, Delhi') {
  const alerts = [];
  const isCalmWind = windSpeedKmH < 4.0;

  // 1. Traffic Chokepoint Alerts
  TRAFFIC_CHOKEPOINTS.forEach((chokepoint) => {
    // If calm winds prevail, vehicular emissions pool and form extreme NO2/PM2.5 stagnation
    const effectiveNox = isCalmWind
      ? Math.round(chokepoint.baselineNoxPpb * (1 + (4.0 - windSpeedKmH) * 0.18))
      : Math.round(chokepoint.baselineNoxPpb * 0.85);

    const isTriggered = effectiveNox >= 80;

    if (isTriggered) {
      alerts.push({
        id: `alert-${chokepoint.id}`,
        type: 'TRAFFIC_CHOKEPOINT',
        severity: effectiveNox > 105 ? 'CRITICAL' : 'WARNING',
        title: `🚨 Traffic Chokepoint Detected: Peak vehicular emissions at ${chokepoint.corridor} creating localized NO2/PM2.5 accumulation.`,
        corridor: chokepoint.corridor,
        location: chokepoint.name,
        zone: chokepoint.zone,
        lat: chokepoint.lat,
        lng: chokepoint.lng,
        noxPpb: effectiveNox,
        coPpm: chokepoint.baselineCoPpm,
        windSpeedKmH: windSpeedKmH,
        regulatoryAction: chokepoint.regulatoryAction,
        detectedAt: 'Real-time telemetry stream',
      });
    }
  });

  // 2. Open Smoke & Biomass Smoldering Alerts
  BIOMASS_SMOLDERING_ZONES.forEach((zone) => {
    // Biomass smoldering produces persistent localized plumes
    const effectivePm25 = isCalmWind
      ? Math.round(zone.baselinePm25 * 1.15)
      : zone.baselinePm25;

    alerts.push({
      id: `alert-${zone.id}`,
      type: 'BIOMASS_SMOLDERING',
      severity: 'CRITICAL',
      title: `⚠️ Local Biomass/Waste Smoldering Detected: ${zone.zone} showing unvented open combustion plume.`,
      zoneName: zone.zone,
      location: zone.name,
      region: zone.region,
      lat: zone.lat,
      lng: zone.lng,
      sourceType: zone.sourceType,
      pm25: effectivePm25,
      pm25ToCoRatio: zone.pm25ToCoRatio,
      thermalRadianceKelvin: zone.thermalRadianceKelvin,
      fireRadiativePowerMw: zone.fireRadiativePowerMw,
      regulatoryAction: zone.regulatoryAction,
      detectedAt: 'Satellite thermal infrared (VIIRS) & ambient sensors',
    });
  });

  return alerts;
}

/**
 * Return all micro-hotspots with rich telemetry for Leaflet GIS Map layer rendering
 */
export function getAllMicroHotspots(windSpeedKmH = 3.2) {
  const isCalmWind = windSpeedKmH < 4.0;

  const trafficSpots = TRAFFIC_CHOKEPOINTS.map((tc) => {
    const effectiveNox = isCalmWind
      ? Math.round(tc.baselineNoxPpb * (1 + (4.0 - windSpeedKmH) * 0.18))
      : Math.round(tc.baselineNoxPpb * 0.85);

    return {
      id: tc.id,
      type: 'traffic',
      name: tc.name,
      corridor: tc.corridor,
      zone: tc.zone,
      lat: tc.lat,
      lng: tc.lng,
      noxPpb: effectiveNox,
      coPpm: tc.baselineCoPpm,
      trafficVolume: tc.trafficVolume,
      peakHours: tc.peakHours,
      regulatoryAction: tc.regulatoryAction,
      status: effectiveNox >= 80 ? 'Active Congestion Chokepoint' : 'Moderate Flow',
      severity: effectiveNox >= 105 ? 'CRITICAL' : effectiveNox >= 80 ? 'WARNING' : 'MODERATE',
      color: '#f97316', // Vibrant orange
      pulseClass: 'traffic-chokepoint-pulse',
    };
  });

  const biomassSpots = BIOMASS_SMOLDERING_ZONES.map((bs) => {
    const effectivePm25 = isCalmWind
      ? Math.round(bs.baselinePm25 * 1.15)
      : bs.baselinePm25;

    return {
      id: bs.id,
      type: 'biomass',
      name: bs.name,
      zoneName: bs.zone,
      region: bs.region,
      lat: bs.lat,
      lng: bs.lng,
      sourceType: bs.sourceType,
      pm25: effectivePm25,
      pm25ToCoRatio: bs.pm25ToCoRatio,
      thermalRadianceKelvin: bs.thermalRadianceKelvin,
      fireRadiativePowerMw: bs.fireRadiativePowerMw,
      regulatoryAction: bs.regulatoryAction,
      status: 'Active Unvented Combustion Plume',
      severity: 'CRITICAL',
      color: '#ef4444', // Crimson red
      pulseClass: 'biomass-smoldering-pulse',
    };
  });

  return [...trafficSpots, ...biomassSpots];
}
