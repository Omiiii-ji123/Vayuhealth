import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

// ============================================================================
// SCENARIO DEFINITIONS & CONSTANTS
// ============================================================================

export const SCENARIO_TYPES = {
  LIVE: 'live',
  HIGH_SMOG_INVERSION: 'high_smog_inversion',
  STUBBLE_SURGE: 'stubble_surge',
  CLEAN_BASELINE: 'clean_baseline',
};

export const SCENARIO_METADATA = {
  [SCENARIO_TYPES.LIVE]: {
    id: SCENARIO_TYPES.LIVE,
    title: 'Live Telemetry Mode',
    shortLabel: 'Live Feed',
    tag: 'LIVE',
    icon: 'Radio',
    badgeColor: '#10b981', // green
    description: 'Streaming live data from Open-Meteo REST API, CPCB Stations, and NASA FIRMS VIIRS satellites.',
    stationName: 'Anand Vihar, Delhi',
    aqi: 418,
    pbl: 240,
    grapStage: 'Stage IV (Emergency)',
  },
  [SCENARIO_TYPES.HIGH_SMOG_INVERSION]: {
    id: SCENARIO_TYPES.HIGH_SMOG_INVERSION,
    title: 'High Smog Inversion (Anand Vihar Peak)',
    shortLabel: 'High Smog Inversion',
    tag: 'ANAND VIHAR PEAK',
    icon: 'ShieldAlert',
    badgeColor: '#ef4444', // red
    description: 'Catastrophic thermal inversion with PBL compressed to 180m, +4.5°C delta-T temperature inversion, and severe aerosol radiative trapping.',
    stationName: 'Anand Vihar, Delhi',
    aqi: 488,
    pbl: 180,
    grapStage: 'Stage IV (AQI > 450 Emergency)',
  },
  [SCENARIO_TYPES.STUBBLE_SURGE]: {
    id: SCENARIO_TYPES.STUBBLE_SURGE,
    title: 'Stubble Burning Surge (3,850+ Fires)',
    shortLabel: 'Stubble Surge',
    tag: 'PUNJAB / HARYANA DRIFT',
    icon: 'Flame',
    badgeColor: '#f97316', // orange
    description: 'Massive agricultural fire cluster (2,150 MW FRP) in Punjab & Haryana rapidly advecting into Delhi NCR via 18.5 km/h NW wind stream.',
    stationName: 'Anand Vihar, Delhi',
    aqi: 462,
    pbl: 210,
    grapStage: 'Stage IV (Emergency Protocol)',
  },
  [SCENARIO_TYPES.CLEAN_BASELINE]: {
    id: SCENARIO_TYPES.CLEAN_BASELINE,
    title: 'Clean Baseline (Post-Monsoon Dispersion)',
    shortLabel: 'Clean Baseline',
    tag: 'GOOD / SATISFACTORY',
    icon: 'Leaf',
    badgeColor: '#3b82f6', // blue
    description: 'Optimal atmospheric dispersion with 1,250m deep mixing layer, normal adiabatic lapse rate (-2.8°C), and zero stubble fire smoke.',
    stationName: 'Lodhi Road, Delhi',
    aqi: 58,
    pbl: 1250,
    grapStage: 'None (AQI < 100 Satisfactory)',
  },
};

// ============================================================================
// REALISTIC DATA GENERATORS FOR PRESETS
// ============================================================================

function generate72HourTimeline(scenario) {
  const now = new Date();
  const timeline = [];

  for (let h = 0; h < 72; h++) {
    const time = new Date(now.getTime() + h * 3600 * 1000);
    const hourOfDay = time.getHours();
    const isDay = hourOfDay >= 7 && hourOfDay <= 18;
    const solarFactor = isDay ? Math.sin(((hourOfDay - 6) / 12) * Math.PI) : 0;

    let pm25, pm10, o3, pbl, deltaT, inversionStrength, solar, temp, humidity, windSpeed, windDir, trappingPenalty;

    if (scenario === SCENARIO_TYPES.HIGH_SMOG_INVERSION) {
      // PBL stays severely compressed; solar is heavily attenuated by aerosol optical depth
      const diurnalPbl = isDay ? 180 + solarFactor * 140 : 150 - Math.cos((hourOfDay / 24) * 2 * Math.PI) * 30;
      pbl = Math.round(diurnalPbl);
      deltaT = Number((4.5 + Math.sin(h * 0.2) * 0.6 - (isDay ? 1.0 : 0)).toFixed(1));
      trappingPenalty = Number((115 + (1 - pbl / 400) * 35).toFixed(1));
      pm25 = Math.round(360 + trappingPenalty + Math.sin(h * 0.3) * 18 - (isDay ? 30 : 0));
      pm10 = Math.round(pm25 * 1.45);
      o3 = Math.round(18 + solarFactor * 32);
      inversionStrength = Math.round(88 + Math.min(12, deltaT * 2));
      solar = Math.round(solarFactor * 85); // heavy solar dimming from aerosol feedback
      temp = Math.round(17 + solarFactor * 5);
      humidity = Math.round(86 - solarFactor * 22);
      windSpeed = Number((1.2 + Math.random() * 0.8).toFixed(1)); // stagnant air
      windDir = 315;
    } else if (scenario === SCENARIO_TYPES.STUBBLE_SURGE) {
      // Plume front arrives at hour 6 and peaks around hour 16-36
      const plumePeak = h >= 12 && h <= 48 ? 1.0 : h < 12 ? (h / 12) : Math.max(0.6, 1 - (h - 48) / 48);
      const stubbleAddedPm25 = Math.round(195 * plumePeak);
      
      const basePbl = isDay ? 380 + solarFactor * 260 : 220;
      pbl = Math.round(basePbl - stubbleAddedPm25 * 0.4); // feedback collapse
      deltaT = Number((3.2 + plumePeak * 1.5 - (isDay ? 1.2 : 0)).toFixed(1));
      trappingPenalty = Number((85 + stubbleAddedPm25 * 0.3).toFixed(1));
      pm25 = Math.round(210 + stubbleAddedPm25 + Math.sin(h * 0.2) * 15);
      pm10 = Math.round(pm25 * 1.4);
      o3 = Math.round(25 + solarFactor * 45);
      inversionStrength = Math.round(75 + plumePeak * 18);
      solar = Math.round(solarFactor * (280 - stubbleAddedPm25 * 0.5));
      temp = Math.round(19 + solarFactor * 6);
      humidity = Math.round(74 - solarFactor * 25);
      windSpeed = Number((4.8 + Math.sin(h * 0.1) * 1.2).toFixed(1)); // strong transport wind
      windDir = 310;
    } else {
      // CLEAN BASELINE
      pbl = Math.round(isDay ? 1100 + solarFactor * 550 : 750);
      deltaT = Number((-2.8 + (isDay ? -1.2 : 0.5)).toFixed(1)); // normal lapse rate
      trappingPenalty = 0.0;
      pm25 = Math.round(24 + (isDay ? 12 : 5) + Math.sin(h * 0.2) * 4);
      pm10 = Math.round(pm25 * 1.7);
      o3 = Math.round(35 + solarFactor * 25);
      inversionStrength = 8;
      solar = Math.round(solarFactor * 680); // clear, high insolation
      temp = Math.round(24 + solarFactor * 7);
      humidity = Math.round(52 - solarFactor * 18);
      windSpeed = Number((5.8 + Math.sin(h * 0.1) * 1.5).toFixed(1));
      windDir = 135;
    }

    // Standard Indian AQI approximation from PM2.5
    let aqi;
    if (pm25 <= 30) aqi = Math.round((pm25 / 30) * 50);
    else if (pm25 <= 60) aqi = Math.round(50 + ((pm25 - 30) / 30) * 50);
    else if (pm25 <= 90) aqi = Math.round(100 + ((pm25 - 60) / 30) * 100);
    else if (pm25 <= 120) aqi = Math.round(200 + ((pm25 - 90) / 30) * 100);
    else if (pm25 <= 250) aqi = Math.round(300 + ((pm25 - 120) / 130) * 100);
    else aqi = Math.min(500, Math.round(400 + ((pm25 - 250) / 130) * 100));

    timeline.push({
      dateTime: time.toISOString(),
      time: time.toISOString(),
      hourIndex: h,
      aqi,
      pm25,
      pm10,
      o3,
      boundaryLayerHeight: pbl,
      inversionStrength,
      inversionSeverity: inversionStrength >= 80 ? 'Severe' : inversionStrength >= 50 ? 'Moderate' : 'None',
      surfaceSolarIrradiance: solar,
      temperature: temp,
      humidity,
      windSpeed,
      windDirection: windDir,
      deltaTInversion: deltaT,
      trappingPenalty,
      aerosolOpticalFeedback: (1.0 + (pm25 / 350) * 0.45).toFixed(2),
    });
  }

  return timeline;
}

// 26 Realistic NASA FIRMS Satellite Fire Clusters across Punjab & Haryana
const STUBBLE_SURGE_FIRES = [
  { id: 'FIRMS-PB-01', latitude: 30.245, longitude: 75.842, frp: 215.4, brightness: 372.1, confidence: 'high', distanceToDelhiKm: 235, estimatedDelhiArrivalHours: 5.1, district: 'Sangrur', state: 'Punjab' },
  { id: 'FIRMS-PB-02', latitude: 30.210, longitude: 75.910, frp: 184.2, brightness: 364.5, confidence: 'high', distanceToDelhiKm: 230, estimatedDelhiArrivalHours: 4.9, district: 'Sangrur', state: 'Punjab' },
  { id: 'FIRMS-PB-03', latitude: 30.180, longitude: 75.760, frp: 168.0, brightness: 358.9, confidence: 'high', distanceToDelhiKm: 242, estimatedDelhiArrivalHours: 5.3, district: 'Sunam', state: 'Punjab' },
  { id: 'FIRMS-PB-04', latitude: 30.220, longitude: 74.950, frp: 195.8, brightness: 368.2, confidence: 'high', distanceToDelhiKm: 295, estimatedDelhiArrivalHours: 6.4, district: 'Bathinda', state: 'Punjab' },
  { id: 'FIRMS-PB-05', latitude: 30.280, longitude: 75.020, frp: 172.5, brightness: 361.0, confidence: 'high', distanceToDelhiKm: 288, estimatedDelhiArrivalHours: 6.2, district: 'Bathinda', state: 'Punjab' },
  { id: 'FIRMS-PB-06', latitude: 30.810, longitude: 75.170, frp: 248.6, brightness: 381.4, confidence: 'high', distanceToDelhiKm: 310, estimatedDelhiArrivalHours: 6.7, district: 'Moga', state: 'Punjab' },
  { id: 'FIRMS-PB-07', latitude: 30.850, longitude: 75.240, frp: 162.0, brightness: 355.2, confidence: 'nominal', distanceToDelhiKm: 305, estimatedDelhiArrivalHours: 6.6, district: 'Moga', state: 'Punjab' },
  { id: 'FIRMS-PB-08', latitude: 30.920, longitude: 74.620, frp: 210.3, brightness: 374.8, confidence: 'high', distanceToDelhiKm: 360, estimatedDelhiArrivalHours: 7.8, district: 'Firozpur', state: 'Punjab' },
  { id: 'FIRMS-PB-09', latitude: 30.890, longitude: 75.850, frp: 145.7, brightness: 349.5, confidence: 'nominal', distanceToDelhiKm: 285, estimatedDelhiArrivalHours: 6.1, district: 'Ludhiana', state: 'Punjab' },
  { id: 'FIRMS-PB-10', latitude: 30.380, longitude: 75.540, frp: 178.4, brightness: 363.1, confidence: 'high', distanceToDelhiKm: 255, estimatedDelhiArrivalHours: 5.5, district: 'Barnala', state: 'Punjab' },
  { id: 'FIRMS-PB-11', latitude: 31.450, longitude: 74.920, frp: 188.9, brightness: 367.4, confidence: 'high', distanceToDelhiKm: 410, estimatedDelhiArrivalHours: 8.9, district: 'Tarn Taran', state: 'Punjab' },
  { id: 'FIRMS-PB-12', latitude: 29.980, longitude: 75.380, frp: 135.2, brightness: 344.0, confidence: 'nominal', distanceToDelhiKm: 245, estimatedDelhiArrivalHours: 5.3, district: 'Mansa', state: 'Punjab' },
  { id: 'FIRMS-PB-13', latitude: 30.040, longitude: 75.420, frp: 152.0, brightness: 351.2, confidence: 'high', distanceToDelhiKm: 240, estimatedDelhiArrivalHours: 5.2, district: 'Mansa', state: 'Punjab' },
  // Haryana clusters
  { id: 'FIRMS-HR-01', latitude: 29.800, longitude: 76.400, frp: 112.5, brightness: 338.2, confidence: 'high', distanceToDelhiKm: 145, estimatedDelhiArrivalHours: 3.1, district: 'Kaithal', state: 'Haryana' },
  { id: 'FIRMS-HR-02', latitude: 29.760, longitude: 76.480, frp: 128.0, brightness: 343.8, confidence: 'high', distanceToDelhiKm: 138, estimatedDelhiArrivalHours: 2.9, district: 'Kaithal', state: 'Haryana' },
  { id: 'FIRMS-HR-03', latitude: 29.680, longitude: 76.980, frp: 94.5, brightness: 332.1, confidence: 'nominal', distanceToDelhiKm: 125, estimatedDelhiArrivalHours: 2.7, district: 'Karnal', state: 'Haryana' },
  { id: 'FIRMS-HR-04', latitude: 29.620, longitude: 77.030, frp: 88.0, brightness: 329.5, confidence: 'nominal', distanceToDelhiKm: 118, estimatedDelhiArrivalHours: 2.5, district: 'Karnal', state: 'Haryana' },
  { id: 'FIRMS-HR-05', latitude: 29.310, longitude: 76.320, frp: 104.2, brightness: 336.0, confidence: 'high', distanceToDelhiKm: 110, estimatedDelhiArrivalHours: 2.3, district: 'Jind', state: 'Haryana' },
  { id: 'FIRMS-HR-06', latitude: 29.520, longitude: 75.450, frp: 118.4, brightness: 340.5, confidence: 'nominal', distanceToDelhiKm: 190, estimatedDelhiArrivalHours: 4.1, district: 'Fatehabad', state: 'Haryana' },
  { id: 'FIRMS-HR-07', latitude: 29.580, longitude: 75.520, frp: 132.8, brightness: 346.0, confidence: 'high', distanceToDelhiKm: 185, estimatedDelhiArrivalHours: 4.0, district: 'Fatehabad', state: 'Haryana' },
  { id: 'FIRMS-HR-08', latitude: 29.150, longitude: 75.720, frp: 96.0, brightness: 333.4, confidence: 'nominal', distanceToDelhiKm: 155, estimatedDelhiArrivalHours: 3.3, district: 'Hisar', state: 'Haryana' },
  { id: 'FIRMS-HR-09', latitude: 29.980, longitude: 76.880, frp: 82.5, brightness: 327.0, confidence: 'nominal', distanceToDelhiKm: 150, estimatedDelhiArrivalHours: 3.2, district: 'Kurukshetra', state: 'Haryana' },
  { id: 'FIRMS-HR-10', latitude: 30.120, longitude: 77.280, frp: 76.2, brightness: 324.5, confidence: 'low', distanceToDelhiKm: 165, estimatedDelhiArrivalHours: 3.5, district: 'Yamunanagar', state: 'Haryana' },
  { id: 'FIRMS-HR-11', latitude: 28.980, longitude: 76.580, frp: 64.0, brightness: 320.1, confidence: 'nominal', distanceToDelhiKm: 75, estimatedDelhiArrivalHours: 1.6, district: 'Rohtak', state: 'Haryana' },
  { id: 'FIRMS-HR-12', latitude: 28.990, longitude: 77.010, frp: 58.5, brightness: 318.0, confidence: 'low', distanceToDelhiKm: 48, estimatedDelhiArrivalHours: 1.0, district: 'Sonipat', state: 'Haryana' },
  { id: 'FIRMS-HR-13', latitude: 28.850, longitude: 76.920, frp: 48.0, brightness: 314.0, confidence: 'low', distanceToDelhiKm: 35, estimatedDelhiArrivalHours: 0.8, district: 'Jhajjar', state: 'Haryana' },
];

function buildScenarioTelemetry(scenario) {
  if (scenario === SCENARIO_TYPES.LIVE) {
    return null;
  }

  const timeline = generate72HourTimeline(scenario);

  if (scenario === SCENARIO_TYPES.HIGH_SMOG_INVERSION) {
    return {
      forecast72h: {
        stationName: 'Anand Vihar, Delhi',
        peakForecastedAqi: 488,
        peakPM25Concentration: 385.0,
        lowestPblHeightMeters: 180,
        inversionDurationHours: 64,
        timeline,
        modelType: 'Physics-Coupled Two-Way Feedback LightGBM Regressor (v1.0)',
      },
      inversionMetrics: {
        stationName: 'Anand Vihar, Delhi',
        currentPblHeightMeters: 180,
        inversionStrengthPercent: 92.0,
        inversionSeverity: 'Severe Inversion',
        deltaTInversion: 4.5,
        trappedPollutantPenaltyUgM3: 128.5,
        trappingPenaltyUgM3: 128.5,
        aerosolFeedbackMultiplier: '1.42',
        collapseRisk: 'Critical (Severe Ground-Level Smog Trapping)',
        summary: 'Severe nocturnal subsidence inversion layer holding particulate matter in sub-200m shallow atmospheric boundary layer.',
      },
      stubbleData: {
        totalFRP: 420.0,
        activeFireCount: 240,
        prevailingWindSpeedKmH: 4.2,
        prevailingWindDirectionDeg: 315.0,
        plumeDriftBearingDeg: 135.0,
        estimatedArrivalHours: 12.0,
        fastestPlumeArrivalHours: 12.0,
        delhiPm25ContributionUgM3: 42.5,
        estimatedDelhiPM25Influx: 43,
        fires: STUBBLE_SURGE_FIRES.slice(0, 5).map(f => ({
          ...f,
          fireRadiativePower: f.frp,
          brightnessTemperature: f.brightness,
          estimatedDelhiPM25Influx: Math.round(f.frp * 0.12),
        })),
      },
      grapData: {
        baselineAQI: 488,
        activeGrapStage: 'Stage IV (Severe+ / Emergency, AQI > 450)',
        simulatedAQI: 395,
        suggestedOddEven: true,
        suggestedTruckBan: true,
        suggestedConstructionBan: true,
      },
    };
  }

  if (scenario === SCENARIO_TYPES.STUBBLE_SURGE) {
    return {
      forecast72h: {
        stationName: 'Anand Vihar, Delhi',
        peakForecastedAqi: 462,
        peakPM25Concentration: 350.0,
        lowestPblHeightMeters: 210,
        inversionDurationHours: 48,
        timeline,
        modelType: 'Coupled NASA-FIRMS Vector LightGBM Regressor (v1.0)',
      },
      inversionMetrics: {
        stationName: 'Anand Vihar, Delhi',
        currentPblHeightMeters: 210,
        inversionStrengthPercent: 84.0,
        inversionSeverity: 'Severe Inversion',
        deltaTInversion: 3.6,
        trappedPollutantPenaltyUgM3: 98.0,
        trappingPenaltyUgM3: 98.0,
        aerosolFeedbackMultiplier: '1.35',
        collapseRisk: 'High (Stubble Plume Radiative Blocking)',
        summary: 'Intense aerosol loading from agricultural burning creating radiative feedback and boundary layer depression.',
      },
      stubbleData: {
        totalFRP: 2150.0,
        activeFireCount: 3852,
        prevailingWindSpeedKmH: 18.5,
        prevailingWindDirectionDeg: 315.0,
        plumeDriftBearingDeg: 135.0,
        estimatedArrivalHours: 5.2,
        fastestPlumeArrivalHours: 5.2,
        delhiPm25ContributionUgM3: 195.4,
        estimatedDelhiPM25Influx: 195,
        fires: STUBBLE_SURGE_FIRES.map(f => ({
          ...f,
          fireRadiativePower: f.frp,
          brightnessTemperature: f.brightness,
          estimatedDelhiPM25Influx: Math.round(f.frp * 0.12),
        })),
      },
      grapData: {
        baselineAQI: 462,
        activeGrapStage: 'Stage IV (Severe+ / Emergency, AQI > 450)',
        simulatedAQI: 368,
        suggestedOddEven: true,
        suggestedTruckBan: true,
        suggestedConstructionBan: true,
      },
    };
  }

  // CLEAN BASELINE
  return {
    forecast72h: {
      stationName: 'Lodhi Road, Delhi',
      peakForecastedAqi: 58,
      peakPM25Concentration: 28.5,
      lowestPblHeightMeters: 750,
      inversionDurationHours: 0,
      timeline,
      modelType: 'Physics-Coupled Two-Way Feedback LightGBM Regressor (v1.0)',
    },
    inversionMetrics: {
      stationName: 'Lodhi Road, Delhi',
      currentPblHeightMeters: 1250,
      inversionStrengthPercent: 8.0,
      inversionSeverity: 'None (Well-Mixed)',
      deltaTInversion: -2.8,
      trappedPollutantPenaltyUgM3: 0.0,
      trappingPenaltyUgM3: 0.0,
      aerosolFeedbackMultiplier: '1.00',
      collapseRisk: 'None (Deep Convective Mixing)',
      summary: 'Optimal post-monsoon atmospheric dispersion with 1250m mixing depth and normal negative temperature lapse rate.',
    },
    stubbleData: {
      totalFRP: 0.0,
      activeFireCount: 0,
      prevailingWindSpeedKmH: 14.5,
      prevailingWindDirectionDeg: 135.0,
      plumeDriftBearingDeg: 315.0,
      estimatedArrivalHours: 0.0,
      delhiPm25ContributionUgM3: 0.0,
      fires: [],
    },
    grapData: {
      baselineAQI: 58,
      activeGrapStage: 'None (AQI < 100 / Satisfactory)',
      simulatedAQI: 58,
      suggestedOddEven: false,
      suggestedTruckBan: false,
      suggestedConstructionBan: false,
    },
  };
}

// ============================================================================
// CONTEXT CREATION & PROVIDER
// ============================================================================

const DemoScenarioContext = createContext(null);

export function DemoScenarioProvider({ children }) {
  const [currentScenario, setCurrentScenario] = useState(SCENARIO_TYPES.LIVE);

  const scenarioMeta = useMemo(() => {
    return SCENARIO_METADATA[currentScenario] || SCENARIO_METADATA[SCENARIO_TYPES.LIVE];
  }, [currentScenario]);

  const scenarioData = useMemo(() => {
    return buildScenarioTelemetry(currentScenario);
  }, [currentScenario]);

  const selectScenario = useCallback((scenarioId) => {
    if (Object.values(SCENARIO_TYPES).includes(scenarioId)) {
      setCurrentScenario(scenarioId);
    }
  }, []);

  const resetToLive = useCallback(() => {
    setCurrentScenario(SCENARIO_TYPES.LIVE);
  }, []);

  const value = useMemo(() => ({
    currentScenario,
    scenarioMeta,
    scenarioData,
    isScenarioActive: currentScenario !== SCENARIO_TYPES.LIVE,
    selectScenario,
    resetToLive,
    allScenarios: Object.values(SCENARIO_METADATA),
  }), [currentScenario, scenarioMeta, scenarioData, selectScenario, resetToLive]);

  return (
    <DemoScenarioContext.Provider value={value}>
      {children}
    </DemoScenarioContext.Provider>
  );
}

export function useDemoScenario() {
  const context = useContext(DemoScenarioContext);
  if (!context) {
    throw new Error('useDemoScenario must be used within a DemoScenarioProvider');
  }
  return context;
}
