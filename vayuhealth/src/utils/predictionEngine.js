/**
 * Disease Prediction Engine
 * Uses real-time AQI data, weather patterns, and historical trends
 * to predict disease risks and provide recommendations
 */

import { getAqiBand } from './aqi';

// Disease definitions with their triggers and risk factors
export const DISEASE_DATABASE = {
  'asthma': {
    id: 'asthma',
    name: 'Asthma Exacerbation',
    category: 'Respiratory',
    type: 'Non-communicable',
    description: 'Airway inflammation triggered by particulate matter and ozone spikes.',
    triggers: {
      aqi: { threshold: 100, weight: 0.4 },
      pm25: { threshold: 35, weight: 0.3 },
      o3: { threshold: 70, weight: 0.2 },
      humidity: { threshold: 60, weight: 0.1 },
    },
    recommendations: [
      'Use prescribed inhaler regularly',
      'Avoid outdoor activity when AQI > 150',
      'Keep windows closed during high pollution hours',
      'Use HEPA air purifier indoors',
      'Monitor peak flow readings daily'
    ],
    prevention: [
      'Annual flu vaccination',
      'Regular check-ups with pulmonologist',
      'Maintain healthy indoor air quality',
      'Exercise in clean air environments'
    ],
    severity: ['mild', 'moderate', 'severe', 'critical']
  },
  'influenza': {
    id: 'influenza',
    name: 'Influenza',
    category: 'Viral',
    type: 'Airborne',
    description: 'Seasonal respiratory infection that spreads faster in poor air quality conditions.',
    triggers: {
      aqi: { threshold: 80, weight: 0.3 },
      pm25: { threshold: 25, weight: 0.2 },
      temperature: { threshold: 20, weight: 0.2 },
      humidity: { threshold: 40, weight: 0.15 },
      o3: { threshold: 50, weight: 0.15 },
    },
    recommendations: [
      'Annual vaccination is essential',
      'Rest and stay hydrated',
      'Stay home when symptomatic',
      'Wear mask in crowded places',
      'Practice good hand hygiene'
    ],
    prevention: [
      'Get flu shot annually',
      'Maintain social distancing during outbreaks',
      'Boost immune system with vitamin C and zinc',
      'Regular exercise and proper nutrition'
    ],
    severity: ['mild', 'moderate', 'severe', 'critical']
  },
  'bronchitis': {
    id: 'bronchitis',
    name: 'Bronchitis',
    category: 'Respiratory',
    type: 'Airborne',
    description: 'Inflammation of bronchial tubes aggravated by PM2.5 exposure.',
    triggers: {
      pm25: { threshold: 40, weight: 0.4 },
      aqi: { threshold: 120, weight: 0.3 },
      pm10: { threshold: 60, weight: 0.2 },
      humidity: { threshold: 50, weight: 0.1 },
    },
    recommendations: [
      'Steam inhalation for symptom relief',
      'Wear an N95 mask outdoors',
      'Avoid smoking and secondhand smoke',
      'Use a humidifier in dry conditions',
      'Stay warm and avoid cold air exposure'
    ],
    prevention: [
      'Avoid air pollution exposure',
      'Quit smoking and avoid smoke exposure',
      'Get pneumococcal vaccine',
      'Maintain good indoor air quality'
    ],
    severity: ['mild', 'moderate', 'severe', 'critical']
  },
  'allergic_rhinitis': {
    id: 'allergic_rhinitis',
    name: 'Allergic Rhinitis',
    category: 'Allergy',
    type: 'Non-communicable',
    description: 'Pollen and dust driven nasal inflammation.',
    triggers: {
      aqi: { threshold: 70, weight: 0.3 },
      pm25: { threshold: 20, weight: 0.25 },
      pollen: { threshold: 50, weight: 0.25 },
      humidity: { threshold: 50, weight: 0.2 },
    },
    recommendations: [
      'Use antihistamines as prescribed',
      'Keep windows closed during high pollen hours',
      'Use saline nasal spray',
      'Wash face and hands after outdoor exposure',
      'Use air purifier with HEPA filter'
    ],
    prevention: [
      'Monitor pollen count daily',
      'Keep indoor environment clean',
      'Use allergen-proof bedding',
      'Avoid outdoor activities during high pollen season'
    ],
    severity: ['mild', 'moderate', 'severe']
  },
  'copd': {
    id: 'copd',
    name: 'COPD Exacerbation',
    category: 'Respiratory',
    type: 'Non-communicable',
    description: 'Chronic obstructive pulmonary disease worsened by air pollution exposure.',
    triggers: {
      pm25: { threshold: 45, weight: 0.35 },
      aqi: { threshold: 130, weight: 0.3 },
      o3: { threshold: 75, weight: 0.2 },
      humidity: { threshold: 40, weight: 0.15 },
    },
    recommendations: [
      'Use bronchodilators as prescribed',
      'Avoid outdoor exercise in polluted areas',
      'Practice pursed-lip breathing techniques',
      'Use oxygen therapy if prescribed',
      'Attend pulmonary rehabilitation'
    ],
    prevention: [
      'Stop smoking and avoid smoke exposure',
      'Annual flu and pneumococcal vaccines',
      'Regular pulmonary function tests',
      'Maintain healthy lifestyle'
    ],
    severity: ['mild', 'moderate', 'severe', 'critical']
  },
  'pneumonia': {
    id: 'pneumonia',
    name: 'Pneumonia',
    category: 'Respiratory',
    type: 'Infectious',
    description: 'Lung infection that becomes more severe with high air pollution exposure.',
    triggers: {
      aqi: { threshold: 150, weight: 0.3 },
      pm25: { threshold: 50, weight: 0.25 },
      temperature: { threshold: 15, weight: 0.2 },
      humidity: { threshold: 35, weight: 0.15 },
      o3: { threshold: 60, weight: 0.1 },
    },
    recommendations: [
      'Seek immediate medical attention',
      'Complete full course of antibiotics',
      'Get plenty of rest and fluids',
      'Use oxygen therapy if needed',
      'Monitor oxygen saturation levels'
    ],
    prevention: [
      'Get pneumococcal and flu vaccines',
      'Avoid air pollution exposure',
      'Practice good hygiene',
      'Maintain strong immune system'
    ],
    severity: ['mild', 'moderate', 'severe', 'critical']
  },
  'conjunctivitis': {
    id: 'conjunctivitis',
    name: 'Conjunctivitis',
    category: 'Eye',
    type: 'Non-communicable',
    description: 'Eye inflammation from airborne irritants and pollutants.',
    triggers: {
      pm25: { threshold: 30, weight: 0.3 },
      o3: { threshold: 50, weight: 0.25 },
      aqi: { threshold: 80, weight: 0.25 },
      pollen: { threshold: 40, weight: 0.2 },
    },
    recommendations: [
      'Use lubricating eye drops',
      'Wear protective eyewear outdoors',
      'Avoid rubbing eyes',
      'Use cold compresses for relief',
      'Remove contact lenses when irritated'
    ],
    prevention: [
      'Wear sunglasses outdoors',
      'Keep indoor air clean',
      'Wash hands frequently',
      'Avoid touching eyes with unwashed hands'
    ],
    severity: ['mild', 'moderate', 'severe']
  },
  'cardiovascular_stress': {
    id: 'cardiovascular_stress',
    name: 'Cardiovascular Stress',
    category: 'Cardiovascular',
    type: 'Non-communicable',
    description: 'Heart and blood vessel strain from air pollution exposure.',
    triggers: {
      pm25: { threshold: 40, weight: 0.35 },
      aqi: { threshold: 120, weight: 0.3 },
      temperature: { threshold: 30, weight: 0.2 },
      o3: { threshold: 60, weight: 0.15 },
    },
    recommendations: [
      'Monitor blood pressure regularly',
      'Avoid strenuous outdoor activity',
      'Stay hydrated and maintain electrolyte balance',
      'Follow heart-healthy diet',
      'Take prescribed medications consistently'
    ],
    prevention: [
      'Regular cardiovascular check-ups',
      'Maintain healthy diet and exercise',
      'Avoid smoking and alcohol',
      'Manage stress levels'
    ],
    severity: ['mild', 'moderate', 'severe', 'critical']
  },
  'skin_irritation': {
    id: 'skin_irritation',
    name: 'Skin Irritation',
    category: 'Skin',
    type: 'Non-communicable',
    description: 'Skin inflammation triggered by air pollution and environmental toxins.',
    triggers: {
      pm25: { threshold: 25, weight: 0.3 },
      o3: { threshold: 40, weight: 0.25 },
      aqi: { threshold: 60, weight: 0.25 },
      humidity: { threshold: 30, weight: 0.2 },
    },
    recommendations: [
      'Use moisturizing skincare products',
      'Wash face after outdoor exposure',
      'Use sunscreen with antioxidants',
      'Stay hydrated',
      'Use gentle, fragrance-free products'
    ],
    prevention: [
      'Apply sunscreen daily',
      'Use antioxidant skincare',
      'Maintain skin barrier health',
      'Avoid harsh chemicals'
    ],
    severity: ['mild', 'moderate', 'severe']
  }
};

/**
 * Calculate disease risk score based on environmental factors
 * @param {Object} disease - Disease definition
 * @param {Object} environment - Environmental data (AQI, PM2.5, etc.)
 * @returns {Object} Risk assessment
 */
export function calculateDiseaseRisk(disease, environment) {
  const triggers = disease.triggers;
  let totalRisk = 0;
  let maxPossibleRisk = 0;
  const triggerContributions = [];

  for (const [factor, config] of Object.entries(triggers)) {
    const currentValue = environment[factor] || 0;
    const threshold = config.threshold;
    const weight = config.weight;
    
    // Calculate risk for this factor (0-100)
    let factorRisk = 0;
    if (currentValue > 0) {
      // Exponential risk curve - small increases at low levels, rapid at high levels
      const ratio = currentValue / threshold;
      factorRisk = Math.min(100, Math.pow(ratio, 1.5) * 50 + (ratio - 1) * 25);
      if (ratio > 1) {
        factorRisk = Math.min(100, 50 + (ratio - 1) * 50);
      }
    }
    
    const weightedRisk = factorRisk * weight;
    totalRisk += weightedRisk;
    maxPossibleRisk += 100 * weight;
    
    triggerContributions.push({
      factor,
      value: currentValue,
      threshold,
      risk: Math.round(factorRisk),
      weightedRisk: Math.round(weightedRisk)
    });
  }

  // Normalize to 0-100
  const normalizedRisk = maxPossibleRisk > 0 ? (totalRisk / maxPossibleRisk) * 100 : 0;
  
  // Determine severity level
  let severityLevel = 'low';
  let severityIndex = 0;
  
  if (normalizedRisk > 70) {
    severityLevel = 'critical';
    severityIndex = 3;
  } else if (normalizedRisk > 50) {
    severityLevel = 'severe';
    severityIndex = 2;
  } else if (normalizedRisk > 25) {
    severityLevel = 'moderate';
    severityIndex = 1;
  }

  // Generate personalized recommendation based on severity
  const recommendations = getPersonalizedRecommendations(disease, severityLevel, environment);

  return {
    diseaseId: disease.id,
    diseaseName: disease.name,
    category: disease.category,
    type: disease.type,
    description: disease.description,
    riskScore: Math.round(normalizedRisk),
    severity: severityLevel,
    severityIndex,
    triggers: triggerContributions,
    recommendations,
    prevention: disease.prevention,
    timestamp: new Date().toISOString()
  };
}

/**
 * Get personalized recommendations based on disease and severity
 */
function getPersonalizedRecommendations(disease, severity, environment) {
  const recommendations = [];
  const baseRecommendations = disease.recommendations || [];
  
  // Add severity-specific recommendations
  if (severity === 'critical' || severity === 'severe') {
    recommendations.push(`🚨 URGENT: ${severity === 'critical' ? 'Immediate medical attention' : 'Consult your healthcare provider'} recommended for ${disease.name}`);
  }
  
  // Add environment-specific recommendations
  if (environment.aqi > 100) {
    recommendations.push(`🌫️ High AQI (${environment.aqi}) - Stay indoors as much as possible`);
  }
  
  if (environment.pm25 > 35) {
    recommendations.push(`💨 PM2.5 levels (${environment.pm25} µg/m³) are elevated - Use N95 mask outdoors`);
  }
  
  if (environment.o3 > 60) {
    recommendations.push(`☀️ Ozone levels (${environment.o3} ppb) are high - Limit outdoor activities during peak hours`);
  }
  
  // Add some base recommendations
  const shuffled = [...baseRecommendations].sort(() => Math.random() - 0.5);
  recommendations.push(...shuffled.slice(0, 3));
  
  // Add prevention tips
  if (disease.prevention && disease.prevention.length > 0) {
    recommendations.push(`💡 Prevention: ${disease.prevention[0]}`);
  }
  
  return recommendations.slice(0, 6);
}

/**
 * Predict disease outbreaks based on environmental data
 */
export function predictOutbreaks(environment, diseaseList = null) {
  const diseases = diseaseList || Object.values(DISEASE_DATABASE);
  const predictions = [];

  for (const disease of diseases) {
    const risk = calculateDiseaseRisk(disease, environment);
    if (risk.riskScore > 15) { // Only include diseases with significant risk
      predictions.push(risk);
    }
  }

  // Sort by risk score (highest first)
  predictions.sort((a, b) => b.riskScore - a.riskScore);

  return {
    predictions,
    environment,
    timestamp: new Date().toISOString(),
    totalDiseases: predictions.length,
    highRiskCount: predictions.filter(p => p.riskScore > 50).length
  };
}

/**
 * Generate health recommendations based on overall environment
 */
export function generateHealthAdvice(environment) {
  const advice = [];
  const aqi = environment.aqi || 0;
  const pm25 = environment.pm25 || 0;
  const o3 = environment.o3 || 0;
  const pm10 = environment.pm10 || 0;

  // AQI based advice
  if (aqi <= 50) {
    advice.push({
      level: 'good',
      message: '🌿 Air quality is good. Enjoy outdoor activities!',
      icon: '✅'
    });
  } else if (aqi <= 100) {
    advice.push({
      level: 'moderate',
      message: '⚠️ Moderate air quality. Sensitive groups should limit outdoor exertion.',
      icon: '⚠️'
    });
  } else if (aqi <= 150) {
    advice.push({
      level: 'unhealthy_sensitive',
      message: '🔶 Unhealthy for sensitive groups. Avoid prolonged outdoor activities.',
      icon: '🔶'
    });
  } else if (aqi <= 200) {
    advice.push({
      level: 'unhealthy',
      message: '🔴 Unhealthy air quality. Everyone should limit outdoor activities.',
      icon: '🔴'
    });
  } else {
    advice.push({
      level: 'hazardous',
      message: '🚨 Hazardous air quality! Stay indoors and use air purifiers.',
      icon: '🚨'
    });
  }

  // Pollutant specific advice
  if (pm25 > 35) {
    advice.push({
      level: 'warning',
      message: `💨 High PM2.5 (${pm25} µg/m³). Use N95 masks when outdoors.`,
      icon: '💨'
    });
  }

  if (o3 > 70) {
    advice.push({
      level: 'warning',
      message: `☀️ Elevated ozone (${o3} ppb). Avoid outdoor exercise during peak hours.`,
      icon: '☀️'
    });
  }

  if (pm10 > 100) {
    advice.push({
      level: 'warning',
      message: `🌫️ High PM10 (${pm10} µg/m³). Keep windows closed.`,
      icon: '🌫️'
    });
  }

  return advice;
}

/**
 * Get disease statistics for a region
 */
export function getDiseaseStatistics(predictions) {
  const stats = {
    total: predictions.length,
    highRisk: predictions.filter(p => p.riskScore > 50).length,
    moderateRisk: predictions.filter(p => p.riskScore > 25 && p.riskScore <= 50).length,
    lowRisk: predictions.filter(p => p.riskScore <= 25).length,
    categories: {},
    types: {}
  };

  for (const prediction of predictions) {
    // Category breakdown
    if (!stats.categories[prediction.category]) {
      stats.categories[prediction.category] = { count: 0, totalRisk: 0 };
    }
    stats.categories[prediction.category].count++;
    stats.categories[prediction.category].totalRisk += prediction.riskScore;

    // Type breakdown
    if (!stats.types[prediction.type]) {
      stats.types[prediction.type] = { count: 0, totalRisk: 0 };
    }
    stats.types[prediction.type].count++;
    stats.types[prediction.type].totalRisk += prediction.riskScore;
  }

  return stats;
}