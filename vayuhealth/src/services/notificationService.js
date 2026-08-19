import { getAqiByCity, getAqiByLocation } from '../api/aqi';
import { getSurveillanceStats } from '../api/dashboard';
import { getConsolidatedDashboardData } from '../api/health';
import { getAqiBand, formatRelativeTime } from '../utils/aqi';

// Notification types
export const NOTIFICATION_TYPES = {
  AQI_ALERT: 'aqi_alert',
  WEEKLY_DIGEST: 'weekly_digest',
  AI_INSIGHT: 'ai_insight',
};

// Notification categories for styling
export const NOTIFICATION_CATEGORIES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  DANGER: 'danger',
};

// Store last notification time to avoid duplicates
let lastNotificationTime = {};

/**
 * Generate AQI Alert Notification
 */
export function generateAQIAlert(aqiData, city) {
  if (!aqiData) return null;

  const aqi = aqiData.aqi || 0;
  const band = getAqiBand(aqi);
  const previousAQI = localStorage.getItem(`prev_aqi_${city}`);
  const previousBand = previousAQI ? getAqiBand(parseInt(previousAQI)) : null;
  
  // Store current AQI for future comparison
  localStorage.setItem(`prev_aqi_${city}`, aqi.toString());

  // Check if it's been less than 2 hours since last alert
  const lastAlertTime = localStorage.getItem(`last_alert_${city}`);
  if (lastAlertTime) {
    const hoursSinceLastAlert = (Date.now() - parseInt(lastAlertTime)) / (1000 * 60 * 60);
    if (hoursSinceLastAlert < 2) {
      return null; // Don't send another alert within 2 hours
    }
  }

  let type = NOTIFICATION_CATEGORIES.INFO;
  let title = 'Air Quality Update';
  let message = '';
  let severity = '';

  if (aqi <= 50) {
    type = NOTIFICATION_CATEGORIES.SUCCESS;
    message = `🌿 Air quality in ${city} is GOOD (AQI: ${aqi}). Perfect conditions for outdoor activities!`;
    severity = 'Good';
  } else if (aqi <= 100) {
    type = NOTIFICATION_CATEGORIES.INFO;
    message = `ℹ️ Air quality in ${city} is MODERATE (AQI: ${aqi}). Sensitive groups should limit outdoor exertion.`;
    severity = 'Moderate';
  } else if (aqi <= 150) {
    type = NOTIFICATION_CATEGORIES.WARNING;
    message = `⚠️ Air quality in ${city} is UNHEALTHY FOR SENSITIVE GROUPS (AQI: ${aqi}). Consider wearing masks if you're in sensitive groups.`;
    severity = 'Unhealthy for Sensitive Groups';
  } else if (aqi <= 200) {
    type = NOTIFICATION_CATEGORIES.DANGER;
    message = `🔴 Air quality in ${city} is UNHEALTHY (AQI: ${aqi}). Everyone should limit outdoor activities.`;
    severity = 'Unhealthy';
  } else {
    type = NOTIFICATION_CATEGORIES.DANGER;
    message = `🚨 Air quality in ${city} is HAZARDOUS (AQI: ${aqi}). Stay indoors and use air purifiers.`;
    severity = 'Hazardous';
  }

  // Add pollutant-specific alerts
  if (aqiData.pm25 > 35) {
    message += ` PM2.5 is at ${aqiData.pm25} µg/m³.`;
  }
  if (aqiData.o3 > 70) {
    message += ` Ozone levels are elevated at ${aqiData.o3} ppb.`;
  }

  // Check if air quality has changed significantly
  if (previousAQI && previousBand) {
    const diff = aqi - parseInt(previousAQI);
    if (Math.abs(diff) > 20) {
      const trend = diff > 0 ? 'worsening' : 'improving';
      message += ` Air quality is ${trend} by ${Math.abs(diff)} points.`;
    }
  }

  // Store alert time
  localStorage.setItem(`last_alert_${city}`, Date.now().toString());

  return {
    id: `aqi_${Date.now()}`,
    type: NOTIFICATION_TYPES.AQI_ALERT,
    category: type,
    title,
    message,
    severity,
    aqi,
    city,
    timestamp: new Date().toISOString(),
    read: false,
    icon: type === NOTIFICATION_CATEGORIES.SUCCESS ? '✅' :
          type === NOTIFICATION_CATEGORIES.WARNING ? '⚠️' :
          type === NOTIFICATION_CATEGORIES.DANGER ? '🚨' : 'ℹ️',
  };
}

/**
 * Generate Weekly Digest Notification
 */
export function generateWeeklyDigest(aqiData, city, historicalData) {
  // Check if it's been 7 days since last digest
  const lastDigestTime = localStorage.getItem(`last_digest_${city}`);
  if (lastDigestTime) {
    const daysSinceLastDigest = (Date.now() - parseInt(lastDigestTime)) / (1000 * 60 * 60 * 24);
    if (daysSinceLastDigest < 7) {
      return null; // Only send weekly digest every 7 days
    }
  }

  if (!aqiData) return null;

  const aqi = aqiData.aqi || 0;
  const band = getAqiBand(aqi);
  
  // Calculate weekly stats (using stored history or mock)
  const weeklyData = getWeeklyStats(historicalData, aqi);
  
  // Store digest time
  localStorage.setItem(`last_digest_${city}`, Date.now().toString());

  const message = `📊 Weekly Air Quality Digest for ${city}:
• Average AQI: ${weeklyData.average} (${getAqiBand(weeklyData.average).label})
• Best Day: ${weeklyData.bestDay} (AQI: ${weeklyData.bestAQI})
• Worst Day: ${weeklyData.worstDay} (AQI: ${weeklyData.worstAQI})
• ${weeklyData.improvement > 0 ? '📈 Air quality improved by ' + weeklyData.improvement + '%' : '📉 Air quality worsened by ' + Math.abs(weeklyData.improvement) + '%'}

Total hours of unhealthy exposure avoided: ${weeklyData.hoursAvoided || 0} hours.`;

  return {
    id: `digest_${Date.now()}`,
    type: NOTIFICATION_TYPES.WEEKLY_DIGEST,
    category: NOTIFICATION_CATEGORIES.INFO,
    title: '📊 Weekly Air Quality Digest',
    message,
    timestamp: new Date().toISOString(),
    read: false,
    data: weeklyData,
    icon: '📊',
  };
}

/**
 * Generate AI Health Insight Notification
 */
export function generateAIInsight(aqiData, city, healthData) {
  if (!aqiData) return null;

  // Check if it's been 3 hours since last insight
  const lastInsightTime = localStorage.getItem(`last_insight_${city}`);
  if (lastInsightTime) {
    const hoursSinceLastInsight = (Date.now() - parseInt(lastInsightTime)) / (1000 * 60 * 60);
    if (hoursSinceLastInsight < 3) {
      return null;
    }
  }

  const aqi = aqiData.aqi || 0;
  const pm25 = aqiData.pm25 || 0;
  const o3 = aqiData.o3 || 0;
  const band = getAqiBand(aqi);

  let insights = [];
  let priority = 'low';

  // Generate insights based on current conditions
  if (aqi > 100) {
    insights.push(`🏠 Stay indoors when possible. Current AQI of ${aqi} is unhealthy.`);
    priority = 'high';
  }

  if (pm25 > 35) {
    insights.push(`😷 PM2.5 levels are elevated (${pm25} µg/m³). Wear N95 masks if going outside.`);
    priority = priority === 'high' ? 'high' : 'medium';
  }

  if (o3 > 60) {
    insights.push(`☀️ Ozone levels are high (${o3} ppb). Avoid outdoor exercise between 2-6 PM.`);
    priority = priority === 'high' ? 'high' : 'medium';
  }

  if (aqi <= 50) {
    insights.push(`🌿 Great day for outdoor activities! Air quality is excellent.`);
    priority = 'low';
  }

  // Add seasonal advice
  const month = new Date().getMonth();
  if (month >= 10 || month <= 2) {
    insights.push(`❄️ Winter air quality can be worse. Keep windows closed and use air purifiers.`);
  } else if (month >= 3 && month <= 6) {
    insights.push(`🌸 Spring pollen season. Consider antihistamines if you have allergies.`);
  }

  // Add health recommendation based on AQI
  if (healthData && healthData.insights) {
    const topInsight = healthData.insights[0];
    if (topInsight) {
      insights.push(`💡 ${topInsight}`);
    }
  }

  // Store insight time
  localStorage.setItem(`last_insight_${city}`, Date.now().toString());

  const message = `🧠 AI Health Insights for ${city}:
${insights.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}

${getHealthRecommendation(aqi, pm25, o3)}`;

  return {
    id: `insight_${Date.now()}`,
    type: NOTIFICATION_TYPES.AI_INSIGHT,
    category: priority === 'high' ? NOTIFICATION_CATEGORIES.DANGER :
              priority === 'medium' ? NOTIFICATION_CATEGORIES.WARNING :
              NOTIFICATION_CATEGORIES.SUCCESS,
    title: `🧠 AI Health Insight${priority === 'high' ? ' - Action Required' : ''}`,
    message,
    timestamp: new Date().toISOString(),
    read: false,
    priority,
    insights,
    icon: '🧠',
  };
}

/**
 * Get weekly statistics
 */
function getWeeklyStats(historicalData, currentAQI) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const weekData = [];
  
  // Use historical data if available, otherwise generate mock
  if (historicalData && historicalData.length > 0) {
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayData = historicalData.find(h => {
        const hDate = new Date(h.timestamp);
        return hDate.toDateString() === date.toDateString();
      });
      weekData.push({
        day: days[date.getDay()],
        aqi: dayData?.aqi || currentAQI + Math.floor(Math.random() * 20 - 10),
      });
    }
  } else {
    // Generate mock weekly data
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const variation = Math.floor(Math.random() * 30 - 15);
      weekData.push({
        day: days[date.getDay()],
        aqi: Math.max(10, currentAQI + variation),
      });
    }
  }

  const average = Math.round(weekData.reduce((sum, d) => sum + d.aqi, 0) / weekData.length);
  const best = weekData.reduce((min, d) => d.aqi < min.aqi ? d : min);
  const worst = weekData.reduce((max, d) => d.aqi > max.aqi ? d : max);
  const improvement = Math.round(((weekData[weekData.length - 1].aqi - weekData[0].aqi) / weekData[0].aqi) * 100);

  return {
    average,
    bestDay: best.day,
    bestAQI: best.aqi,
    worstDay: worst.day,
    worstAQI: worst.aqi,
    improvement,
    hoursAvoided: Math.floor(Math.random() * 20) + 5,
    data: weekData,
  };
}

/**
 * Get health recommendation based on AQI
 */
function getHealthRecommendation(aqi, pm25, o3) {
  if (aqi > 150) {
    return '🚨 Stay indoors with windows closed. Use HEPA air purifiers.';
  } else if (aqi > 100) {
    return '⚠️ Sensitive groups should limit outdoor activities. Keep windows closed.';
  } else if (aqi > 50) {
    return 'ℹ️ Sensitive individuals should reduce prolonged outdoor exertion.';
  } else {
    return '✅ Air quality is good. Enjoy outdoor activities!';
  }
}

/**
 * Generate all notifications for a city
 */
export async function generateAllNotifications(city, aqiData = null, healthData = null) {
  const notifications = [];
  
  try {
    // Fetch AQI data if not provided
    const aqi = aqiData || await getAqiByCity(city);
    if (!aqi) return notifications;

    // Fetch health data if not provided
    const health = healthData || await getConsolidatedDashboardData(null, city).catch(() => null);
    
    // Generate notifications
    const aqiAlert = generateAQIAlert(aqi, city);
    if (aqiAlert) notifications.push(aqiAlert);

    const weeklyDigest = generateWeeklyDigest(aqi, city);
    if (weeklyDigest) notifications.push(weeklyDigest);

    const aiInsight = generateAIInsight(aqi, city, health);
    if (aiInsight) notifications.push(aiInsight);

  } catch (error) {
    console.error('Error generating notifications:', error);
  }

  return notifications;
}

/**
 * Simulate real-time notifications (for demo purposes)
 */
export function simulateRealTimeNotifications(city, onNotification) {
  // Simulate periodic AQI updates
  const interval = setInterval(async () => {
    try {
      const aqiData = await getAqiByCity(city);
      if (aqiData) {
        const notification = generateAQIAlert(aqiData, city);
        if (notification) {
          onNotification(notification);
        }
      }
    } catch (error) {
      console.error('Error in real-time notification simulation:', error);
    }
  }, 60000); // Check every minute

  return interval;
}