/**
 * Prediction Engine API
 * Connects the prediction engine with backend data
 */

import { predictOutbreaks, generateHealthAdvice, DISEASE_DATABASE } from '../utils/predictionEngine';
import { getAqiByCity, getAqiByLocation } from './aqi';
import { getSurveillanceStats } from './dashboard';

/**
 * Get disease predictions for a city
 */
export async function getDiseasePredictions(city) {
  try {
    // Get current AQI data for the city
    const aqiData = await getAqiByCity(city);
    
    // Extract environment data
    const environment = {
      aqi: aqiData?.aqi || 0,
      pm25: aqiData?.pm25 || 0,
      pm10: aqiData?.pm10 || 0,
      o3: aqiData?.o3 || 0,
      co: aqiData?.co || 0,
      no2: aqiData?.no2 || 0,
      so2: aqiData?.so2 || 0,
      temperature: aqiData?.temperature || 25,
      humidity: aqiData?.humidity || 50,
      windSpeed: aqiData?.windSpeed || 5,
      pollen: aqiData?.pollen || 20,
    };

    // Get predictions
    const predictions = predictOutbreaks(environment);
    
    // Get health advice
    const advice = generateHealthAdvice(environment);

    return {
      city,
      environment,
      predictions: predictions.predictions,
      advice,
      statistics: predictions.predictions.length > 0 
        ? getDiseaseStatistics(predictions.predictions)
        : { total: 0, highRisk: 0, moderateRisk: 0, lowRisk: 0, categories: {}, types: {} },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting disease predictions:', error);
    throw error;
  }
}

/**
 * Get disease predictions for user's location
 */
export async function getLocationDiseasePredictions(lat, lng) {
  try {
    const aqiData = await getAqiByLocation(lat, lng);
    const environment = {
      aqi: aqiData?.aqi || 0,
      pm25: aqiData?.pm25 || 0,
      pm10: aqiData?.pm10 || 0,
      o3: aqiData?.o3 || 0,
      co: aqiData?.co || 0,
      no2: aqiData?.no2 || 0,
      so2: aqiData?.so2 || 0,
      temperature: aqiData?.temperature || 25,
      humidity: aqiData?.humidity || 50,
      windSpeed: aqiData?.windSpeed || 5,
      pollen: aqiData?.pollen || 20,
    };

    const predictions = predictOutbreaks(environment);
    const advice = generateHealthAdvice(environment);

    return {
      location: aqiData?.city || aqiData?.locationName || 'Unknown location',
      environment,
      predictions: predictions.predictions,
      advice,
      statistics: predictions.predictions.length > 0 
        ? getDiseaseStatistics(predictions.predictions)
        : { total: 0, highRisk: 0, moderateRisk: 0, lowRisk: 0, categories: {}, types: {} },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting location disease predictions:', error);
    throw error;
  }
}

function getDiseaseStatistics(predictions) {
  const stats = {
    total: predictions.length,
    highRisk: predictions.filter(p => p.riskScore > 50).length,
    moderateRisk: predictions.filter(p => p.riskScore > 25 && p.riskScore <= 50).length,
    lowRisk: predictions.filter(p => p.riskScore <= 25).length,
    categories: {},
    types: {}
  };

  for (const prediction of predictions) {
    if (!stats.categories[prediction.category]) {
      stats.categories[prediction.category] = { count: 0, totalRisk: 0 };
    }
    stats.categories[prediction.category].count++;
    stats.categories[prediction.category].totalRisk += prediction.riskScore;

    if (!stats.types[prediction.type]) {
      stats.types[prediction.type] = { count: 0, totalRisk: 0 };
    }
    stats.types[prediction.type].count++;
    stats.types[prediction.type].totalRisk += prediction.riskScore;
  }

  return stats;
}

/**
 * Get all available diseases
 */
export function getAllDiseases() {
  return Object.values(DISEASE_DATABASE);
}

/**
 * Get disease by ID
 */
export function getDiseaseById(id) {
  return DISEASE_DATABASE[id] || null;
}