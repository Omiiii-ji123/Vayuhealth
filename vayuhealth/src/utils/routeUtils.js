/**
 * Route Utilities - Safest Path & Clean Air Corridor Navigation
 * Provides helper functions for route calculation, waypoint generation,
 * distance calculation, and risk assessment
 */

import indiaLocations, { getAQIColor, getAQIStatus } from '../data/indiaLocations';

/**
 * Haversine distance calculation between two coordinates
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
export const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Calculate distance in kilometers
 */
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  return calculateDistanceMeters(lat1, lon1, lat2, lon2) / 1000;
};

/**
 * Format distance for display
 */
export const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
};

/**
 * Find coordinates for a location name (fuzzy match)
 */
export const findCoordinates = (locationStr) => {
  if (!locationStr) {
    return { lat: 19.2183, lng: 73.0869, name: "Dombivli" };
  }

  const strLower = locationStr.toLowerCase().trim();
  
  // First try exact match
  const exactMatch = indiaLocations.find(loc => 
    loc.name.toLowerCase() === strLower
  );
  if (exactMatch) {
    return { lat: exactMatch.lat, lng: exactMatch.lng, name: exactMatch.name };
  }

  // Try partial match
  const partialMatch = indiaLocations.find(loc => 
    loc.name.toLowerCase().includes(strLower) || 
    strLower.includes(loc.name.toLowerCase())
  );
  if (partialMatch) {
    return { lat: partialMatch.lat, lng: partialMatch.lng, name: partialMatch.name };
  }

  // Try state match
  const stateMatch = indiaLocations.find(loc => 
    loc.state.toLowerCase().includes(strLower)
  );
  if (stateMatch) {
    return { lat: stateMatch.lat, lng: stateMatch.lng, name: stateMatch.state };
  }

  // Fallback: deterministic hash-based coordinates
  let hash = 0;
  for (let i = 0; i < locationStr.length; i++) {
    hash = locationStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return {
    lat: 20.5937 + ((Math.abs(hash) % 100) / 1000),
    lng: 78.9629 + ((Math.abs(hash >> 2) % 100) / 1000),
    name: locationStr
  };
};

/**
 * Get AQI for a location
 */
export const getAQIForLocation = (locationStr) => {
  const loc = indiaLocations.find(l => 
    l.name.toLowerCase().includes(locationStr.toLowerCase()) ||
    locationStr.toLowerCase().includes(l.name.toLowerCase())
  );
  return loc ? loc.aqi : Math.floor(Math.random() * 100) + 20;
};

/**
 * Calculate risk level based on AQI
 */
export const getRiskLevel = (aqi) => {
  if (aqi > 200) return { level: 'high', label: 'HIGH RISK', color: '#ff3d00', badge: '🔴 HAZARDOUS' };
  if (aqi > 150) return { level: 'high', label: 'HIGH RISK', color: '#ff3d00', badge: '🔴 UNHEALTHY' };
  if (aqi > 100) return { level: 'moderate', label: 'MODERATE RISK', color: '#ffea00', badge: '🟡 SENSITIVE' };
  if (aqi > 50) return { level: 'moderate', label: 'MODERATE RISK', color: '#ffea00', badge: '🟡 MODERATE' };
  return { level: 'safe', label: 'LOW RISK', color: '#00e676', badge: '🟢 SAFE' };
};

/**
 * Generate waypoints for a route between origin and destination
 */
export const generateRouteWaypoints = (originStr, destinationStr) => {
  const originCoords = findCoordinates(originStr);
  const destCoords = findCoordinates(destinationStr);

  const baseLat = originCoords.lat;
  const baseLng = originCoords.lng;
  const destLat = destCoords.lat;
  const destLng = destCoords.lng;

  const totalDistance = calculateDistanceKm(baseLat, baseLng, destLat, destLng);
  const waypointCount = Math.max(3, Math.min(6, Math.ceil(totalDistance / 5)));

  // Generate waypoints along the route
  const waypoints = [];
  
  // Add origin
  const originAQI = getAQIForLocation(originStr);
  waypoints.push({
    step: 1,
    title: `Start: ${originCoords.name}`,
    subtitle: `Departure Checkpoint • Baseline Air Quality`,
    lat: baseLat,
    lng: baseLng,
    aqi: originAQI,
    riskLevel: getRiskLevel(originAQI).level,
    badgeText: getRiskLevel(originAQI).badge,
    directive: getDirectiveForAQI(originAQI, 'start', originCoords.name),
  });

  // Intermediate waypoints
  for (let i = 1; i <= waypointCount - 2; i++) {
    const fraction = i / (waypointCount - 1);
    const lat = baseLat + (destLat - baseLat) * fraction + (Math.random() - 0.5) * 0.05;
    const lng = baseLng + (destLng - baseLng) * fraction + (Math.random() - 0.5) * 0.05;
    
    // Generate varying AQI along the route
    const baseAQI = (originAQI + getAQIForLocation(destinationStr)) / 2;
    const variation = Math.sin(i * 1.5) * 30 + Math.cos(i * 0.7) * 20;
    const aqi = Math.max(10, Math.round(baseAQI + variation));
    const risk = getRiskLevel(aqi);

    const waypointNames = [
      'Industrial Corridor & Highway Bypass',
      'Transit Segment • High Density Traffic Zone',
      'Eco-Parkway & Lake-Side Corridor',
      'Green Buffer Zone Bypass',
      'Suburban Residential Corridor',
      'Business District Transit',
      'Coastal Road & Ventilated Route',
    ];
    
    waypoints.push({
      step: i + 1,
      title: waypointNames[i % waypointNames.length],
      subtitle: `Transit Segment ${i + 1} of ${waypointCount}`,
      lat: lat,
      lng: lng,
      aqi: aqi,
      riskLevel: risk.level,
      badgeText: risk.badge,
      directive: getDirectiveForAQI(aqi, 'waypoint', waypointNames[i % waypointNames.length]),
    });
  }

  // Add destination
  const destAQI = getAQIForLocation(destinationStr);
  waypoints.push({
    step: waypointCount,
    title: `Destination: ${destCoords.name}`,
    subtitle: `Final Arrival Point • Destination Hub`,
    lat: destLat,
    lng: destLng,
    aqi: destAQI,
    riskLevel: getRiskLevel(destAQI).level,
    badgeText: getRiskLevel(destAQI).badge,
    directive: getDirectiveForAQI(destAQI, 'end', destCoords.name),
  });

  return waypoints;
};

/**
 * Get directive based on AQI and waypoint type
 */
const getDirectiveForAQI = (aqi, type, location) => {
  if (aqi > 200) {
    return `🚨 HIGH POLLUTION ALERT (AQI ${aqi}): Heavy PM2.5 & NO2. Roll up windows, switch AC to internal recirculate, and wear N95/FFP2 mask. Avoid prolonged outdoor exposure.`;
  }
  if (aqi > 150) {
    return `⚠️ UNHEALTHY CONDITIONS (AQI ${aqi}): Reduce outdoor activities. Sensitive groups should stay indoors. Wear mask if going outside.`;
  }
  if (aqi > 100) {
    return `🟡 MODERATE POLLUTION (AQI ${aqi}): Sensitive groups should limit prolonged outdoor exertion. Consider wearing a mask if you have respiratory conditions.`;
  }
  if (aqi > 50) {
    return `🟢 ACCEPTABLE CONDITIONS (AQI ${aqi}): Normal outdoor activities are safe. Keep windows open for ventilation.`;
  }
  return `✅ EXCELLENT AIR QUALITY (AQI ${aqi}): Perfect for outdoor activities. Enjoy the clean air!`;
};

/**
 * Calculate route metrics
 */
export const calculateRouteMetrics = (waypoints) => {
  if (!waypoints || waypoints.length < 2) {
    return {
      totalDistance: 0,
      totalDistanceFormatted: '0 km',
      peakRisk: 'No risk',
      safetyScore: 0,
      avgAQI: 0,
      maxAQI: 0,
      minAQI: 0,
      safeSegments: 0,
      riskySegments: 0,
    };
  }

  let totalDistance = 0;
  let totalAQI = 0;
  let maxAQI = 0;
  let minAQI = Infinity;
  let safeSegments = 0;
  let riskySegments = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const dist = calculateDistanceKm(
      waypoints[i].lat, waypoints[i].lng,
      waypoints[i + 1].lat, waypoints[i + 1].lng
    );
    totalDistance += dist;

    const aqi = waypoints[i].aqi;
    totalAQI += aqi;
    if (aqi > maxAQI) maxAQI = aqi;
    if (aqi < minAQI) minAQI = aqi;

    if (aqi <= 100) safeSegments++;
    else riskySegments++;
  }

  // Add last waypoint's AQI
  const lastAQI = waypoints[waypoints.length - 1].aqi;
  totalAQI += lastAQI;
  if (lastAQI > maxAQI) maxAQI = lastAQI;
  if (lastAQI < minAQI) minAQI = lastAQI;

  const avgAQI = Math.round(totalAQI / (waypoints.length));
  const safetyScore = Math.max(0, Math.min(100, 100 - (maxAQI / 5)));

  return {
    totalDistance: Math.round(totalDistance * 10) / 10,
    totalDistanceFormatted: `${Math.round(totalDistance * 10) / 10} km`,
    peakRisk: `AQI ${maxAQI} (${getRiskLevel(maxAQI).label})`,
    safetyScore: Math.round(safetyScore),
    avgAQI,
    maxAQI,
    minAQI: Math.round(minAQI),
    safeSegments,
    riskySegments,
    totalSegments: waypoints.length - 1,
  };
};

/**
 * Generate a safe route between two locations
 */
export const generateSafeRoute = (origin, destination) => {
  const waypoints = generateRouteWaypoints(origin, destination);
  const metrics = calculateRouteMetrics(waypoints);
  
  // Find cleanest alternative route (simulated)
  const alternatives = generateAlternativeRoutes(origin, destination);

  return {
    origin,
    destination,
    waypoints,
    metrics,
    alternatives,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Generate alternative routes (simulated)
 */
const generateAlternativeRoutes = (origin, destination) => {
  const alternatives = [];
  const baseAQI = getAQIForLocation(origin);
  
  for (let i = 0; i < 2; i++) {
    const variation = (i + 1) * 5;
    const altAQI = Math.max(10, baseAQI - variation + Math.floor(Math.random() * 10));
    const altDistance = 5 + i * 2 + Math.floor(Math.random() * 3);
    
    alternatives.push({
      id: `alt_${i + 1}`,
      name: i === 0 ? 'Cleaner Corridor' : 'Scenic Route',
      aqi: altAQI,
      distance: altDistance,
      safetyScore: Math.round(100 - (altAQI / 5)),
      description: i === 0 
        ? 'Less traffic, more green cover' 
        : 'Longer but cleaner air quality',
    });
  }
  
  return alternatives;
};

/**
 * Get route recommendations based on current AQI
 */
export const getRouteRecommendations = (aqi) => {
  const recommendations = [];

  if (aqi > 200) {
    recommendations.push('🚨 Avoid outdoor travel if possible. Stay indoors.');
    recommendations.push('Use N95 masks if travel is essential.');
    recommendations.push('Keep vehicle windows closed with AC on recirculate.');
  } else if (aqi > 150) {
    recommendations.push('⚠️ Limit outdoor travel. Use masks.');
    recommendations.push('Plan travel during early morning or late evening.');
  } else if (aqi > 100) {
    recommendations.push('🟡 Sensitive groups should reduce outdoor travel.');
    recommendations.push('Keep windows closed in high-traffic areas.');
  } else {
    recommendations.push('✅ Safe for travel. Enjoy the clean air!');
    recommendations.push('Consider using public transport to keep it clean.');
  }

  return recommendations;
};

export default {
  calculateDistanceMeters,
  calculateDistanceKm,
  formatDistance,
  findCoordinates,
  getAQIForLocation,
  getRiskLevel,
  generateRouteWaypoints,
  calculateRouteMetrics,
  generateSafeRoute,
  getRouteRecommendations,
};