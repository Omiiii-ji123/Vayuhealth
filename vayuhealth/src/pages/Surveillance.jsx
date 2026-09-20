import { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Building2,
  Globe2,
  MapPinned,
  Search,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Heart,
  Brain,
  Eye,
  Wind,
  Droplet,
  Thermometer,
  Sun,
  CloudRain,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  MapPin,
  Navigation,
  Sparkles,
  User,
  Clock,
  Calendar,
  ArrowRight,
  ExternalLink,
  Sliders,
  Truck,
  Hammer,
  Car,
  FileCheck,
  ShieldAlert,
  Zap,
  Printer,
  Copy,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ComposedChart,
  ReferenceLine,
} from 'recharts';

import Layout from '../components/Layout';
import { Card, Loader, ErrorState, EmptyState, StatusBadge } from '../components/Common';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../context/AuthContext';
import { getSurveillanceStats, getSurveillanceByCity, getSurveillanceByState } from '../api/dashboard';
import { getHealthStatsByDistrict } from '../api/health';
import { getDiseasePredictions, getLocationDiseasePredictions, getAllDiseases } from '../api/prediction';
import { getAqiByCity, getAqiByLocation } from '../api/aqi';
import { getAqiBand } from '../utils/aqi';
import { simulatePolicy } from '../api/forecast';
import { useDemoScenario } from '../context/DemoScenarioContext';
import MunicipalOrderModal from '../components/MunicipalOrderModal';

// Disease Card Component
const DiseaseCard = ({ disease, risk, onClick }) => {
  const severityColors = {
    low: '#48bb78',
    moderate: '#ecc94b',
    severe: '#ed8936',
    critical: '#e53e3e'
  };

  const severityLabels = {
    low: 'Low Risk',
    moderate: 'Moderate Risk',
    severe: 'High Risk',
    critical: 'Critical Risk'
  };

  const iconMap = {
    'Asthma Exacerbation': Wind,
    'Influenza': AlertCircle,
    'Bronchitis': AlertCircle,
    'Allergic Rhinitis': Eye,
    'COPD Exacerbation': Activity,
    'Pneumonia': AlertTriangle,
    'Conjunctivitis': Eye,
    'Cardiovascular Stress': Heart,
    'Skin Irritation': Shield
  };

  const DiseaseIcon = iconMap[disease.name] || Activity;

  return (
    <div className="disease-card" onClick={() => onClick(disease)}>
      <div className="disease-card__header">
        <div className="disease-card__icon" style={{ background: severityColors[risk.severity] + '20' }}>
          <DiseaseIcon size={18} color={severityColors[risk.severity]} />
        </div>
        <div className="disease-card__info">
          <h4 className="disease-card__name">{disease.name}</h4>
          <div className="disease-card__meta">
            <span className="disease-card__category">{disease.category}</span>
            <span className="disease-card__type">{disease.type}</span>
          </div>
        </div>
        <div className="disease-card__risk">
          <div className="disease-card__risk-score" style={{ color: severityColors[risk.severity] }}>
            {risk.riskScore}%
          </div>
          <StatusBadge label={severityLabels[risk.severity]} color={severityColors[risk.severity]} size="sm" />
        </div>
      </div>
      
      <div className="disease-card__body">
        <p className="disease-card__description">{disease.description}</p>
        
        <div className="disease-card__triggers">
          <span className="disease-card__triggers-label">Active Triggers:</span>
          <div className="disease-card__trigger-tags">
            {risk.triggers
              .filter(t => t.risk > 20)
              .slice(0, 3)
              .map((trigger, idx) => (
                <span key={idx} className="disease-card__trigger-tag">
                  {trigger.factor}: {trigger.value}
                </span>
              ))}
          </div>
        </div>

        <div className="disease-card__recommendations">
          <span className="disease-card__recommendations-label">Recommendations:</span>
          <ul>
            {risk.recommendations.slice(0, 2).map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

// Health Advice Card
const HealthAdviceCard = ({ advice }) => {
  if (!advice || advice.length === 0) return null;

  return (
    <div className="health-advice-card">
      <h4 className="health-advice-card__title">
        <Sparkles size={16} />
        Health Recommendations
      </h4>
      <div className="health-advice-card__list">
        {advice.map((item, idx) => (
          <div key={idx} className={`health-advice-card__item health-advice-card__item--${item.level}`}>
            <span className="health-advice-card__icon">{item.icon}</span>
            <span className="health-advice-card__message">{item.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Statistics Summary
const StatisticsSummary = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="stats-summary">
      <div className="stats-summary__item">
        <span className="stats-summary__value">{stats.total}</span>
        <span className="stats-summary__label">Total Diseases</span>
      </div>
      <div className="stats-summary__item stats-summary__item--high">
        <span className="stats-summary__value">{stats.highRisk}</span>
        <span className="stats-summary__label">High Risk</span>
      </div>
      <div className="stats-summary__item stats-summary__item--moderate">
        <span className="stats-summary__value">{stats.moderateRisk}</span>
        <span className="stats-summary__label">Moderate Risk</span>
      </div>
      <div className="stats-summary__item stats-summary__item--low">
        <span className="stats-summary__value">{stats.lowRisk}</span>
        <span className="stats-summary__label">Low Risk</span>
      </div>
    </div>
  );
};

// Environment Data Display
const EnvironmentDisplay = ({ environment }) => {
  if (!environment) return null;

  const envItems = [
    { key: 'aqi', label: 'AQI', icon: Wind, color: '#4299e1' },
    { key: 'pm25', label: 'PM2.5', icon: CloudRain, color: '#ed8936' },
    { key: 'pm10', label: 'PM10', icon: CloudRain, color: '#e53e3e' },
    { key: 'o3', label: 'O₃', icon: Sun, color: '#38a169' },
    { key: 'temperature', label: 'Temp', icon: Thermometer, color: '#f6ad55' },
    { key: 'humidity', label: 'Humidity', icon: Droplet, color: '#4299e1' },
  ];

  return (
    <div className="environment-display">
      <h4 className="environment-display__title">
        <MapPin size={14} />
        Current Environmental Conditions
      </h4>
      <div className="environment-display__grid">
        {envItems.map((item) => {
          const value = environment[item.key];
          if (value === undefined || value === null) return null;
          const Icon = item.icon;
          return (
            <div key={item.key} className="environment-display__item">
              <Icon size={14} color={item.color} />
              <span className="environment-display__value">{value}</span>
              <span className="environment-display__label">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Search Section
const SearchSection = ({ onSearch, loading }) => {
  const [city, setCity] = useState('');
  const [locating, setLocating] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (city.trim()) {
      onSearch(city.trim());
    }
  };

  const locateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onSearch(null, pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      (err) => {
        console.error('Location error:', err);
        setLocating(false);
        alert('Unable to get your location. Please search for a city instead.');
      },
      { timeout: 10000 }
    );
  };

  return (
    <div className="search-section">
      <form className="search-section__form" onSubmit={handleSearch}>
        <div className="search-section__input-wrapper">
          <Search size={16} className="search-section__icon" />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Search city for disease predictions..."
            className="search-section__input"
            disabled={loading}
          />
          <button type="submit" className="btn btn--primary btn--sm" disabled={loading || !city.trim()}>
            {loading ? <Loader size={14} className="spin" /> : 'Predict'}
          </button>
        </div>
      </form>
      
      <button className="btn btn--ghost btn--sm" onClick={locateMe} disabled={loading || locating}>
        <Navigation size={14} className={locating ? 'spin' : ''} />
        {locating ? 'Locating...' : 'Use my location'}
      </button>
    </div>
  );
};

// =========================================================
// =========================================================
// CPCB GRAP DECISION SUPPORT & POLICY SIMULATION SANDBOX
// =========================================================

// Supported Delhi-NCR continuous regulatory monitoring stations
const DELHI_NCR_STATIONS = [
  { id: 'anand_vihar', name: 'Anand Vihar, Delhi', area: 'East Delhi Influx Funnel', baseAqi: 448 },
  { id: 'ito', name: 'ITO, Delhi', area: 'Central Administrative Core', baseAqi: 382 },
  { id: 'dwarka', name: 'Dwarka Sector 8, Delhi', area: 'South-West Airshed', baseAqi: 345 },
  { id: 'rk_puram', name: 'RK Puram, Delhi', area: 'South Delhi Urban', baseAqi: 395 },
  { id: 'punjabi_bagh', name: 'Punjabi Bagh, Delhi', area: 'West Delhi Transport Corridor', baseAqi: 412 },
  { id: 'rohini', name: 'Rohini Sector 16, Delhi', area: 'North-West Industrial Zone', baseAqi: 428 },
  { id: 'noida_62', name: 'Noida Sector 62', area: 'NCR East Industrial Hub', baseAqi: 390 },
  { id: 'gurugram_51', name: 'Gurugram Sector 51', area: 'NCR South Cyber Corridor', baseAqi: 365 },
  { id: 'ghaziabad_vas', name: 'Ghaziabad Vasundhara', area: 'NCR North-East Influx Zone', baseAqi: 440 },
];

function GrapPolicySimulator({ city = 'Delhi NCR' }) {
  const { currentScenario, scenarioData, scenarioMeta, isScenarioActive } = useDemoScenario();
  const [selectedStation, setSelectedStation] = useState(city.includes('Delhi') ? city : 'Anand Vihar, Delhi');
  const [stubbleCut, setStubbleCut] = useState(40);
  const [vehicleCut, setVehicleCut] = useState(30);
  const [industrialCut, setIndustrialCut] = useState(25);
  const [oddEvenActive, setOddEvenActive] = useState(false);
  const [truckBanActive, setTruckBanActive] = useState(true);
  const [constructionBanActive, setConstructionBanActive] = useState(true);
  const [simResult, setSimResult] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Sync initial bans and sliders when scenario changes
  useEffect(() => {
    if (isScenarioActive && scenarioData?.grapData) {
      if (currentScenario === 'clean_baseline') {
        setStubbleCut(0);
        setVehicleCut(0);
        setIndustrialCut(0);
        setOddEvenActive(false);
        setTruckBanActive(false);
        setConstructionBanActive(false);
      } else if (currentScenario === 'stubble_surge') {
        setStubbleCut(75);
        setVehicleCut(35);
        setIndustrialCut(25);
        setOddEvenActive(true);
        setTruckBanActive(true);
        setConstructionBanActive(true);
      } else if (currentScenario === 'high_smog_inversion') {
        setStubbleCut(40);
        setVehicleCut(50);
        setIndustrialCut(40);
        setOddEvenActive(true);
        setTruckBanActive(true);
        setConstructionBanActive(true);
      }
    }
  }, [currentScenario, isScenarioActive]);

  useEffect(() => {
    let cancel = false;
    async function runSim() {
      if (isScenarioActive && currentScenario === 'clean_baseline') {
        setSimResult({
          stationName: selectedStation,
          baselineAvgAqi: 58,
          simulatedAvgAqi: 58,
          aqiReductionPercent: 0,
          baselineGrapStage: 'None (AQI < 100 / Satisfactory)',
          simulatedGrapStage: 'None (AQI < 100 / Satisfactory)',
          estimatedHospitalAdmissionsAvoided: 0,
          acuteAsthmaAttacksPrevented: 0,
          trajectoryComparison: [],
        });
        setSimulating(false);
        return;
      }

      setSimulating(true);
      try {
        const targetStation = isScenarioActive && scenarioMeta?.stationName 
          ? scenarioMeta.stationName 
          : selectedStation;
        const res = await simulatePolicy({
          stationName: targetStation,
          stubbleBurningReductionPercent: stubbleCut,
          vehicularTrafficCutPercent: vehicleCut,
          industrialEmissionCutPercent: industrialCut,
          applyOddEvenRule: oddEvenActive,
          applyTruckEntryBan: truckBanActive,
          applyConstructionBan: constructionBanActive,
        });
        if (!cancel) setSimResult(res);
      } catch (err) {
        console.error('Simulation error:', err);
      } finally {
        if (!cancel) setSimulating(false);
      }
    }
    const timer = setTimeout(runSim, 200);
    return () => { cancel = true; clearTimeout(timer); };
  }, [selectedStation, currentScenario, isScenarioActive, scenarioMeta, stubbleCut, vehicleCut, industrialCut, oddEvenActive, truckBanActive, constructionBanActive]);

  const baselineAQI = simResult?.baselineAvgAqi || 445;
  const simulatedAQI = simResult?.simulatedAvgAqi || 260;
  const aqiDropPct = simResult?.aqiReductionPercent || 41.5;
  const hospitalAvoided = simResult?.estimatedHospitalAdmissionsAvoided || 1400;
  const asthmaAvoided = simResult?.acuteAsthmaAttacksPrevented || 3800;
  const activeGrapStage = simResult?.baselineGrapStage || 'GRAP Stage IV (Severe+ AQI > 450)';
  const newGrapStage = simResult?.simulatedGrapStage || 'GRAP Stage II (Very Poor)';

  const getStageNum = (stageStr, aqi) => {
    if (stageStr) {
      if (stageStr.includes('IV') || stageStr.includes('4')) return 4;
      if (stageStr.includes('III') || stageStr.includes('3')) return 3;
      if (stageStr.includes('II') || stageStr.includes('2')) return 2;
      if (stageStr.includes('I') || stageStr.includes('1')) return 1;
    }
    if (aqi > 450) return 4;
    if (aqi > 400) return 3;
    if (aqi > 300) return 2;
    if (aqi > 200) return 1;
    return 1;
  };

  const baselineStageNum = getStageNum(simResult?.baselineGrapStage, baselineAQI);
  const simulatedStageNum = getStageNum(simResult?.simulatedGrapStage, simulatedAQI);
  const isDowngraded = simulatedStageNum < baselineStageNum;

  const applyPreset = (mode) => {
    if (mode === 'reset') {
      setStubbleCut(0);
      setVehicleCut(0);
      setIndustrialCut(0);
      setOddEvenActive(false);
      setTruckBanActive(false);
      setConstructionBanActive(false);
    } else if (mode === 'balanced') {
      setStubbleCut(45);
      setVehicleCut(30);
      setIndustrialCut(25);
      setOddEvenActive(false);
      setTruckBanActive(true);
      setConstructionBanActive(true);
    } else if (mode === 'emergency') {
      setStubbleCut(75);
      setVehicleCut(50);
      setIndustrialCut(40);
      setOddEvenActive(true);
      setTruckBanActive(true);
      setConstructionBanActive(true);
    }
  };

  // Prepare 72h comparison trajectory data for chart
  const trajectorySeries = useMemo(() => {
    if (simResult?.baselineTimeline?.length && simResult?.simulatedTimeline?.length) {
      return simResult.baselineTimeline
        .filter((_, idx) => idx % 3 === 0)
        .map((bPt, idx) => {
          const sPt = simResult.simulatedTimeline[idx * 3] || {};
          return {
            hourLabel: `+${bPt.hourOffset}h`,
            baselineAqi: bPt.aqi,
            simulatedAqi: sPt.aqi,
            baselinePm25: bPt.pm25,
            simulatedPm25: sPt.pm25,
          };
        });
    }
    return Array.from({ length: 25 }, (_, i) => {
      const h = i * 3;
      const diurnal = Math.sin(((h - 4) * Math.PI) / 12) * 45;
      const bAqi = Math.round(baselineAQI + diurnal);
      const sAqi = Math.round(simulatedAQI + diurnal * 0.65);
      return {
        hourLabel: `+${h}h`,
        baselineAqi: bAqi,
        simulatedAqi: sAqi,
        baselinePm25: Math.round((bAqi / 1.42) * 10) / 10,
        simulatedPm25: Math.round((sAqi / 1.42) * 10) / 10,
      };
    });
  }, [simResult, baselineAQI, simulatedAQI]);

  // Multi-horizon forecast thresholds (+24h, +48h, +72h) tied strictly to 72-hour predicted thresholds:
  // Stage I > 200, Stage II > 300, Stage III > 400, Stage IV > 450
  const horizonStats = useMemo(() => {
    const pts = trajectorySeries || [];
    const pts24 = pts.slice(0, 9);
    const pts48 = pts.slice(8, 17);
    const pts72 = pts.slice(16);

    const max24 = pts24.length ? Math.max(...pts24.map(p => Math.max(p.baselineAqi || 0, p.baselinePm25 || 0))) : baselineAQI + 25;
    const max48 = pts48.length ? Math.max(...pts48.map(p => Math.max(p.baselineAqi || 0, p.baselinePm25 || 0))) : baselineAQI + 15;
    const max72 = pts72.length ? Math.max(...pts72.map(p => Math.max(p.baselineAqi || 0, p.baselinePm25 || 0))) : baselineAQI - 10;

    const simMax24 = pts24.length ? Math.max(...pts24.map(p => Math.max(p.simulatedAqi || 0, p.simulatedPm25 || 0))) : simulatedAQI + 12;
    const simMax48 = pts48.length ? Math.max(...pts48.map(p => Math.max(p.simulatedAqi || 0, p.simulatedPm25 || 0))) : simulatedAQI + 8;
    const simMax72 = pts72.length ? Math.max(...pts72.map(p => Math.max(p.simulatedAqi || 0, p.simulatedPm25 || 0))) : simulatedAQI - 5;

    const getStageBadge = (val) => {
      if (val > 450) return { label: 'GRAP Stage IV (Severe+)', color: '#7f1d1d', text: 'Critical Emergency Breach (>450)' };
      if (val > 400) return { label: 'GRAP Stage III (Severe)', color: '#ef4444', text: 'Severe Threshold Breach (401-450)' };
      if (val > 300) return { label: 'GRAP Stage II (Very Poor)', color: '#f97316', text: 'Very Poor Threshold (301-400)' };
      if (val > 200) return { label: 'GRAP Stage I (Poor)', color: '#f59e0b', text: 'Poor Threshold (201-300)' };
      return { label: 'Satisfactory', color: '#10b981', text: 'Within Safe Ceiling (≤200)' };
    };

    return {
      h24: { max: max24, sim: simMax24, stage: getStageBadge(max24), offset: '+18h Peak' },
      h48: { max: max48, sim: simMax48, stage: getStageBadge(max48), offset: '+36h Peak' },
      h72: { max: max72, sim: simMax72, stage: getStageBadge(max72), offset: '+60h Peak' },
    };
  }, [trajectorySeries, baselineAQI, simulatedAQI]);

  const grapStages = [
    {
      stage: 1,
      name: 'Stage I',
      label: 'Poor',
      range: 'AQI 201 - 300',
      color: '#f59e0b',
      mandates: 'Water sprinkling, mechanized road sweeping, strict anti-smog gun deployment, open burning ban.',
    },
    {
      stage: 2,
      name: 'Stage II',
      label: 'Very Poor',
      range: 'AQI 301 - 400',
      color: '#f97316',
      mandates: 'Diesel generator set ban, parking fee hike, intensified public transport frequency, power supply 24/7.',
    },
    {
      stage: 3,
      name: 'Stage III',
      label: 'Severe',
      range: 'AQI 401 - 450',
      color: '#ef4444',
      mandates: 'Strict ban on non-essential construction & demolition, closure of stone crushers & brick kilns, BS-III petrol / BS-IV diesel car ban.',
    },
    {
      stage: 4,
      name: 'Stage IV',
      label: 'Severe+',
      range: 'AQI > 450',
      color: '#7f1d1d',
      mandates: 'Complete entry ban on non-essential diesel commercial trucks, Odd-Even private vehicle rule, online classes for schools, 50% WFH mandate.',
    },
  ];

  return (
    <div className="grap-simulator-container">
      {/* Top Command Banner */}
      <div className="grap-top-banner">
        {isScenarioActive && (
          <div 
            className="grap-scenario-banner" 
            style={{ 
              borderLeft: `4px solid ${scenarioMeta?.badgeColor || '#ef4444'}`,
              background: `${scenarioMeta?.badgeColor || '#ef4444'}15`,
              color: scenarioMeta?.badgeColor || '#ef4444',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              marginBottom: '12px'
            }}
          >
            <span 
              className="scenario-pulse-dot" 
              style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: scenarioMeta?.badgeColor,
                display: 'inline-block' 
              }} 
            />
            <span>
              <strong>PRESET ACTIVE:</strong> {scenarioMeta?.title} — {scenarioMeta?.description}
            </span>
          </div>
        )}

        <div className="grap-banner-badge-row">
          <div className="grap-banner-badge">
            <ShieldAlert size={16} color="#ef4444" />
            <span>CPCB & CAQM Statutory Regulatory Enforcement Engine — 72H Trajectory</span>
          </div>

          <div className="station-selector-wrapper">
            <span className="station-selector-lbl">Monitoring Airshed:</span>
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="cpcb-station-select"
            >
              {DELHI_NCR_STATIONS.map((stn) => (
                <option key={stn.id} value={stn.name}>
                  {stn.name} ({stn.area})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="banner-title-action-row">
          <div>
            <h2 className="grap-banner-title">CPCB / DPCC Command Center: Graded Response Action Plan (GRAP)</h2>
            <p className="grap-banner-sub">
              Automated statutory protocol tracking coupled with real-time "What-If" emission reduction sandbox to forecast public health relief and trigger de-escalation pathways.
            </p>
          </div>
          <button
            type="button"
            className="generate-grap-order-btn"
            onClick={() => setShowOrderModal(true)}
            title="Generate and print statutory municipal GRAP order"
          >
            <FileCheck size={16} />
            <span>Generate Municipal GRAP Order</span>
          </button>
        </div>

        {/* Preset Scenarios Buttons */}
        <div className="grap-preset-buttons">
          <span className="preset-label">Quick Regulatory Scenarios:</span>
          <button type="button" className="preset-btn" onClick={() => applyPreset('reset')}>
            Zero Intervention (Baseline)
          </button>
          <button type="button" className="preset-btn preset-btn--balanced" onClick={() => applyPreset('balanced')}>
            Balanced Mitigation (Target Stage II)
          </button>
          <button type="button" className="preset-btn preset-btn--emergency" onClick={() => applyPreset('emergency')}>
            Full Emergency Action (GRAP IV)
          </button>
        </div>
      </div>

      {/* Multi-Horizon Automated GRAP Threshold Breach Tracker */}
      <div className="horizon-alerts-container">
        <div className="horizon-alerts-header">
          <div className="horizon-header-title">
            <Clock size={16} color="#38bdf8" />
            <h4>72-HOUR AUTOMATED GRAP THRESHOLD BREACH TRACKER ({selectedStation})</h4>
          </div>
          <span className="horizon-statutory-mandate">
            Automated statutory alerts triggered when 72h coupled forecast crosses Stage I-IV limits
          </span>
        </div>

        <div className="horizon-cards-grid">
          <div className="horizon-card" style={{ borderTopColor: horizonStats.h24.stage.color }}>
            <div className="horizon-card__header">
              <span className="horizon-tag">+24H FORECAST HORIZON</span>
              <span className="horizon-offset">{horizonStats.h24.offset}</span>
            </div>
            <div className="horizon-aqi-stat">
              <span className="horizon-aqi-val" style={{ color: horizonStats.h24.stage.color }}>
                {horizonStats.h24.max}
              </span>
              <span className="horizon-aqi-label">Peak Predicted AQI</span>
            </div>
            <div className="horizon-stage-badge" style={{ backgroundColor: `${horizonStats.h24.stage.color}20`, color: horizonStats.h24.stage.color }}>
              {horizonStats.h24.stage.label}
            </div>
            <div className="horizon-card__footer">
              <span>Simulated Post-Policy: <strong>{horizonStats.h24.sim}</strong></span>
              <span style={{ color: '#10b981', fontWeight: 700 }}>(-{Math.round(((horizonStats.h24.max - horizonStats.h24.sim) / horizonStats.h24.max) * 100)}%)</span>
            </div>
          </div>

          <div className="horizon-card" style={{ borderTopColor: horizonStats.h48.stage.color }}>
            <div className="horizon-card__header">
              <span className="horizon-tag">+48H FORECAST HORIZON</span>
              <span className="horizon-offset">{horizonStats.h48.offset}</span>
            </div>
            <div className="horizon-aqi-stat">
              <span className="horizon-aqi-val" style={{ color: horizonStats.h48.stage.color }}>
                {horizonStats.h48.max}
              </span>
              <span className="horizon-aqi-label">Peak Predicted AQI</span>
            </div>
            <div className="horizon-stage-badge" style={{ backgroundColor: `${horizonStats.h48.stage.color}20`, color: horizonStats.h48.stage.color }}>
              {horizonStats.h48.stage.label}
            </div>
            <div className="horizon-card__footer">
              <span>Simulated Post-Policy: <strong>{horizonStats.h48.sim}</strong></span>
              <span style={{ color: '#10b981', fontWeight: 700 }}>(-{Math.round(((horizonStats.h48.max - horizonStats.h48.sim) / horizonStats.h48.max) * 100)}%)</span>
            </div>
          </div>

          <div className="horizon-card" style={{ borderTopColor: horizonStats.h72.stage.color }}>
            <div className="horizon-card__header">
              <span className="horizon-tag">+72H FORECAST HORIZON</span>
              <span className="horizon-offset">{horizonStats.h72.offset}</span>
            </div>
            <div className="horizon-aqi-stat">
              <span className="horizon-aqi-val" style={{ color: horizonStats.h72.stage.color }}>
                {horizonStats.h72.max}
              </span>
              <span className="horizon-aqi-label">Peak Predicted AQI</span>
            </div>
            <div className="horizon-stage-badge" style={{ backgroundColor: `${horizonStats.h72.stage.color}20`, color: horizonStats.h72.stage.color }}>
              {horizonStats.h72.stage.label}
            </div>
            <div className="horizon-card__footer">
              <span>Simulated Post-Policy: <strong>{horizonStats.h72.sim}</strong></span>
              <span style={{ color: '#10b981', fontWeight: 700 }}>(-{Math.round(((horizonStats.h72.max - horizonStats.h72.sim) / horizonStats.h72.max) * 100)}%)</span>
            </div>
          </div>
        </div>

        {/* Live Statutory Enforcement Directive Alert */}
        <div className={`mandatory-breach-alert ${baselineAQI > 400 ? 'mandatory-breach-alert--emergency' : ''}`}>
          <div className="breach-alert-icon">
            <ShieldAlert size={24} color={baselineAQI > 450 ? '#ef4444' : '#f97316'} />
          </div>
          <div className="breach-alert-content">
            <div className="breach-alert-headline">
              {baselineAQI > 450
                ? '🚨 STATUTORY ENFORCEMENT DIRECTIVE: MANDATORY GRAP STAGE IV (SEVERE+) ACTIVE'
                : baselineAQI > 400
                  ? '⚠️ STATUTORY ENFORCEMENT DIRECTIVE: GRAP STAGE III (SEVERE) MANDATORY'
                  : '⚡ STATUTORY ENFORCEMENT DIRECTIVE: GRAP STAGE II (VERY POOR) ACTIVE'}
            </div>
            <div className="breach-alert-details">
              72-Hour coupled forecast predicts acute particulate accumulation exceeding statutory ceilings under nocturnal inversion (&lt;260m) at {selectedStation}.
              Section 12 of the CAQM Act 2021 mandates immediate statutory notification across Delhi-NCR. Enforcing authorities must complete emergency deployment within <strong>4 hours</strong>.
            </div>
          </div>
          <button
            type="button"
            className="order-trigger-cta"
            onClick={() => setShowOrderModal(true)}
          >
            Issue Order
          </button>
        </div>
      </div>

      {/* Official 4-Stage GRAP Protocol Matrix */}
      <div className="grap-stages-matrix">
        <div className="stages-matrix-header">
          <h4>CPCB GRAP AUTOMATED TRIGGER STATUS (STAGES I TO IV)</h4>
          <span className="stages-matrix-sub">Real-time status based on 72-hour coupled atmospheric forecast</span>
        </div>
        <div className="stages-cards-row">
          {grapStages.map((st) => {
            const isCurrentActive = baselineStageNum === st.stage;
            const isSimulatedTarget = simulatedStageNum === st.stage;
            return (
              <div
                key={st.stage}
                className={`stage-card ${isCurrentActive ? 'stage-card--current' : ''} ${isSimulatedTarget ? 'stage-card--simulated' : ''}`}
                style={{ '--stage-color': st.color }}
              >
                <div className="stage-card__header">
                  <span className="stage-pill" style={{ background: `${st.color}25`, color: st.color, borderColor: st.color }}>
                    {st.name}: {st.label}
                  </span>
                  <span className="stage-range">{st.range}</span>
                </div>
                <div className="stage-card__body">
                  <p className="stage-mandate">{st.mandates}</p>
                </div>
                <div className="stage-card__footer">
                  {isCurrentActive && (
                    <div className="stage-status-badge stage-status-badge--active">
                      🔴 CURRENT ACTIVE TRIGGER
                    </div>
                  )}
                  {isSimulatedTarget && (
                    <div className="stage-status-badge stage-status-badge--target">
                      🟢 SIMULATED TARGET STAGE
                    </div>
                  )}
                  {!isCurrentActive && !isSimulatedTarget && (
                    <span className="stage-inactive-lbl">Inactive</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Transition Status Banner */}
        <div className={`stage-transition-banner ${isDowngraded ? 'stage-transition-banner--success' : ''}`}>
          <div className="transition-badge">
            <Zap size={14} />
            <span>Policy De-Escalation Status:</span>
          </div>
          <span className="transition-text">
            {isDowngraded ? (
              <>
                <strong>DE-ESCALATION ACHIEVED:</strong> Projected average AQI reduced from <strong>{baselineAQI}</strong> to <strong>{simulatedAQI}</strong> (-{aqiDropPct}%), enabling downgrade from <strong>{activeGrapStage}</strong> to <strong>{newGrapStage}</strong>. Critical commercial bans and school closures can be safely de-escalated.
              </>
            ) : (
              <>
                <strong>THRESHOLD PERSISTS:</strong> Projected average AQI of <strong>{simulatedAQI}</strong> remains within <strong>{activeGrapStage}</strong>. Increase agricultural burning cuts or vehicle restrictions to achieve de-escalation below AQI 400.
              </>
            )}
          </span>
        </div>
      </div>

      {/* Main Grid: Controls vs Live Impacts */}
      <div className="grap-main-grid">
        <div className="grap-column">
          <Card className="grap-card">
            <div className="grap-card__header">
              <span className="panel-tag">ADMIN CONTROL PANEL</span>
              <h3>Active Regulatory Protocol</h3>
            </div>

            <div className="active-policy-box">
              <div className="active-policy-label">ACTIVE EMERGENCY DIRECTIVE:</div>
              <div className="active-policy-title">{activeGrapStage}</div>
              <div className="active-policy-sub">Automatically triggered when 72-hour coupled forecast crosses AQI 400+ threshold.</div>
            </div>

            <div className="policy-toggles-section">
              <h4>Automated Enforcement Actions</h4>
              
              <div className={`policy-toggle-item ${truckBanActive ? 'policy-toggle-item--active' : ''}`}>
                <div className="policy-toggle-info">
                  <Truck size={18} color={truckBanActive ? '#38bdf8' : '#94a3b8'} />
                  <div>
                    <div className="toggle-title">Heavy Diesel Truck Entry Ban</div>
                    <div className="toggle-desc">Restricts non-essential interstate diesel commercial vehicles.</div>
                  </div>
                </div>
                <button 
                  type="button"
                  className={`toggle-btn ${truckBanActive ? 'toggle-btn--on' : ''}`}
                  onClick={() => setTruckBanActive(!truckBanActive)}
                >
                  {truckBanActive ? 'ACTIVE' : 'OFF'}
                </button>
              </div>

              <div className={`policy-toggle-item ${constructionBanActive ? 'policy-toggle-item--active' : ''}`}>
                <div className="policy-toggle-info">
                  <Hammer size={18} color={constructionBanActive ? '#38bdf8' : '#94a3b8'} />
                  <div>
                    <div className="toggle-title">Construction & Demolition Ban</div>
                    <div className="toggle-desc">Halts all civil construction, stone crushers & ready-mix plants.</div>
                  </div>
                </div>
                <button 
                  type="button"
                  className={`toggle-btn ${constructionBanActive ? 'toggle-btn--on' : ''}`}
                  onClick={() => setConstructionBanActive(!constructionBanActive)}
                >
                  {constructionBanActive ? 'ACTIVE' : 'OFF'}
                </button>
              </div>

              <div className={`policy-toggle-item ${oddEvenActive ? 'policy-toggle-item--active' : ''}`}>
                <div className="policy-toggle-info">
                  <Car size={18} color={oddEvenActive ? '#38bdf8' : '#94a3b8'} />
                  <div>
                    <div className="toggle-title">Odd-Even Private Vehicle Rule</div>
                    <div className="toggle-desc">Restricts private four-wheelers based on registration plate ending.</div>
                  </div>
                </div>
                <button 
                  type="button"
                  className={`toggle-btn ${oddEvenActive ? 'toggle-btn--on' : ''}`}
                  onClick={() => setOddEvenActive(!oddEvenActive)}
                >
                  {oddEvenActive ? 'ACTIVE' : 'ENABLE'}
                </button>
              </div>
            </div>
          </Card>
        </div>

        <div className="grap-column">
          <Card className="grap-card">
            <div className="grap-card__header">
              <span className="panel-tag">WHAT-IF POLICY SIMULATION SANDBOX</span>
              <h3>Emission Mitigation Controls</h3>
            </div>

            <div className="simulation-sliders-group">
              <div className="slider-control">
                <div className="slider-control__header">
                  <span>Reduce Agricultural Stubble Burning</span>
                  <strong className="slider-val">{stubbleCut}%</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={stubbleCut}
                  onChange={(e) => setStubbleCut(parseInt(e.target.value, 10))}
                  className="policy-range"
                />
                <div className="slider-hints">
                  <span>Current Fire Load</span>
                  <span>Target Zero Burning</span>
                </div>
              </div>

              <div className="slider-control">
                <div className="slider-control__header">
                  <span>Cut Vehicular & Diesel Fleet Traffic</span>
                  <strong className="slider-val">{vehicleCut}%</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={vehicleCut}
                  onChange={(e) => setVehicleCut(parseInt(e.target.value, 10))}
                  className="policy-range"
                />
                <div className="slider-hints">
                  <span>Standard Traffic</span>
                  <span>Full Public Transit Shift</span>
                </div>
              </div>

              <div className="slider-control">
                <div className="slider-control__header">
                  <span>Industrial & Brick Kiln Emission Cut</span>
                  <strong className="slider-val">{industrialCut}%</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={industrialCut}
                  onChange={(e) => setIndustrialCut(parseInt(e.target.value, 10))}
                  className="policy-range"
                />
              </div>
            </div>

            <div className="live-impact-results">
              <div className="impact-header">
                <h4>LIVE IMPACT PREDICTION</h4>
                {simulating && <span className="sim-calculating"><RefreshCw size={12} className="spin" /> Recalculating...</span>}
              </div>

              <div className="impact-metrics-grid">
                <div className="impact-metric-box">
                  <div className="impact-metric-title">Forecasted AQI Trajectory</div>
                  <div className="impact-metric-comparison">
                    <span className="val-before">{baselineAQI}</span>
                    <ArrowRight size={18} color="#94a3b8" />
                    <span className="val-after">{simulatedAQI}</span>
                    <span className="val-drop">(-{aqiDropPct}%)</span>
                  </div>
                  <div className="impact-metric-sub">
                    Enables downgrade to <strong>{newGrapStage}</strong>
                  </div>
                </div>

                <div className="impact-metric-box impact-metric-box--health">
                  <div
                    className="impact-metric-title"
                    title="Estimated daily Acute Respiratory Illness (ARI) admissions based on MoHFW Integrated Health Information Portal (IHIP) & ICMR sentinel hospital surveillance data."
                  >
                    Daily ARI Admissions (ICMR Sentinel Feed)
                  </div>
                  <div className="impact-stat-big">
                    <Heart size={20} color="#10b981" />
                    <span>~{hospitalAvoided.toLocaleString()}</span>
                  </div>
                  <div className="impact-metric-sub">
                    Fewer emergency ARI admissions across major Delhi hospital network.
                  </div>
                </div>

                <div className="impact-metric-box impact-metric-box--asthma">
                  <div className="impact-metric-title">Asthmatic & Vulnerable Relief</div>
                  <div className="impact-stat-big">
                    <Wind size={20} color="#38bdf8" />
                    <span>~{asthmaAvoided.toLocaleString()}</span>
                  </div>
                  <div className="impact-metric-sub">
                    Acute bronchospasm and wheezing episodes prevented.
                  </div>
                </div>
              </div>

              {simResult?.summaryMessage && (
                <div className="sim-summary-callout">
                  <Zap size={16} color="#38bdf8" />
                  <span>{simResult.summaryMessage}</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* 72-Hour AQI Trajectory Comparison Chart Card */}
      <Card className="grap-chart-card">
        <div className="grap-chart-card__header">
          <div>
            <span className="panel-tag">72-HOUR OUTLOOK SIMULATION</span>
            <h3 className="card-title">Forecasted AQI Trajectory: Baseline (No Action) vs Simulated Policy</h3>
          </div>
          <div className="chart-legend-pills">
            <span className="legend-pill legend-pill--baseline">🔴 Baseline Trajectory</span>
            <span className="legend-pill legend-pill--simulated">🟢 Simulated Trajectory</span>
          </div>
        </div>

        <div className="chart-wrapper" style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trajectorySeries} margin={{ top: 15, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="hourLabel" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} dy={6} />
              <YAxis domain={[150, 500]} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} label={{ value: 'Air Quality Index (AQI)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }} />
              <RechartsTooltip content={<PolicyComparisonTooltip />} />
              <ReferenceLine y={450} stroke="#7f1d1d" strokeDasharray="3 3" label={{ value: 'GRAP IV (>450)', fill: '#ef4444', fontSize: 10, position: 'top' }} />
              <ReferenceLine y={400} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'GRAP III (401-450)', fill: '#f87171', fontSize: 10, position: 'top' }} />
              <ReferenceLine y={300} stroke="#f97316" strokeDasharray="3 3" label={{ value: 'GRAP II (301-400)', fill: '#fb923c', fontSize: 10, position: 'top' }} />
              <ReferenceLine y={200} stroke="#eab308" strokeDasharray="3 3" label={{ value: 'GRAP I (201-300)', fill: '#facc15', fontSize: 10, position: 'top' }} />
              <Line type="monotone" dataKey="baselineAqi" name="Baseline AQI" stroke="#ef4444" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="simulatedAqi" name="Simulated AQI" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 5, fill: '#10b981' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Municipal GRAP Order Statutory Modal */}
      <MunicipalOrderModal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        stationName={selectedStation}
        baselineAqi={baselineAQI}
        simulatedAqi={simulatedAQI}
        stageName={activeGrapStage}
        stageNum={baselineStageNum}
        bans={{
          truckBan: truckBanActive,
          constructionBan: constructionBanActive,
          oddEven: oddEvenActive,
        }}
      />
    </div>
  );
}

function PolicyComparisonTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      padding: '10px 14px',
      fontSize: '12px',
      color: '#0f172a',
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      minWidth: '190px',
    }}>
      <div style={{ fontWeight: 700, color: '#0284c7', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '6px' }}>
        Forecast Offset: {data.hourLabel}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        <span style={{ color: '#dc2626', fontWeight: 600 }}>Baseline AQI:</span>
        <strong>{data.baselineAqi}</strong>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        <span style={{ color: '#059669', fontWeight: 600 }}>Simulated AQI:</span>
        <strong style={{ color: '#059669' }}>{data.simulatedAqi}</strong>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', borderTop: '1px solid #e2e8f0', paddingTop: '4px' }}>
        <span style={{ color: '#64748b' }}>Prevented Exposure:</span>
        <span style={{ color: '#0284c7', fontWeight: 700 }}>-{data.baselineAqi - data.simulatedAqi} pts</span>
      </div>
    </div>
  );
}

// Main Component
export default function Surveillance() {
  const { user } = useAuth();
  const [city, setCity] = useState(user?.city || user?.district || 'Anand Vihar, Delhi');
  const [activeTab, setActiveTab] = useState('grap_sandbox'); // 'grap_sandbox' | 'disease_surveillance'
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Fetch initial predictions for user's city
  useEffect(() => {
    if (city) {
      handlePrediction(city);
    }
  }, []);

  const handlePrediction = async (cityName, lat, lng) => {
    setLoading(true);
    setError(null);

    try {
      let result;
      if (lat && lng) {
        // Get predictions for location
        const aqiData = await getAqiByLocation(lat, lng);
        const cityFromLocation = aqiData?.city || aqiData?.locationName || 'Your Location';
        result = await getDiseasePredictions(cityFromLocation);
        setCity(cityFromLocation);
      } else {
        result = await getDiseasePredictions(cityName);
        setCity(cityName);
      }
      setPredictions(result);
    } catch (err) {
      console.error('Error getting predictions:', err);
      setError(err.message || 'Failed to get disease predictions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDiseaseClick = (disease) => {
    setSelectedDisease(disease);
    setShowDetails(true);
  };

  const closeModal = () => {
    setShowDetails(false);
    setSelectedDisease(null);
  };

  return (
    <Layout 
      title="CPCB / DPCC Command Center" 
      subtitle="Commission for Air Quality Management (CAQM) Statutory GRAP System & Predictive Atmospheric Policy Sandbox."
    >
      <div className="surveillance-page">
        {/* Top View Selector Tabs */}
        <div className="surveillance-view-tabs">
          <button 
            type="button"
            className={`surveillance-view-tab ${activeTab === 'grap_sandbox' ? 'surveillance-view-tab--active' : ''}`}
            onClick={() => setActiveTab('grap_sandbox')}
          >
            <ShieldAlert size={16} />
            <span>🏛️ CPCB / DPCC Command Center & GRAP Policy Sandbox</span>
          </button>
          <button 
            type="button"
            className={`surveillance-view-tab ${activeTab === 'disease_surveillance' ? 'surveillance-view-tab--active' : ''}`}
            onClick={() => setActiveTab('disease_surveillance')}
          >
            <Activity size={16} />
            <span>🦠 Secondary Epidemiological Surveillance</span>
          </button>
        </div>

        {activeTab === 'grap_sandbox' ? (
          <GrapPolicySimulator city={city} />
        ) : (
          <>
            {/* Search Section */}
            <SearchSection onSearch={handlePrediction} loading={loading} />

            {/* Error State */}
            {error && (
              <Card className="error-card">
                <ErrorState message={error} onRetry={() => handlePrediction(city)} />
              </Card>
            )}

        {/* Loading State */}
        {loading && (
          <Card className="loading-card">
            <Loader label="Analyzing environmental data and generating predictions..." />
          </Card>
        )}

        {/* Predictions Display */}
        {predictions && !loading && (
          <>
            {/* Environment and Statistics */}
            <div className="predictions-header">
              <div className="predictions-header__info">
                <h2 className="predictions-header__title">
                  <MapPin size={20} />
                  {city}
                </h2>
                <span className="predictions-header__time">
                  <Clock size={14} />
                  Updated {new Date(predictions.timestamp).toLocaleString()}
                </span>
              </div>
              <button 
                className="btn btn--ghost btn--sm"
                onClick={() => handlePrediction(city)}
                disabled={loading}
              >
                <RefreshCw size={14} className={loading ? 'spin' : ''} />
                Refresh
              </button>
            </div>

            <div className="predictions-grid">
              {/* Statistics Summary */}
              <Card className="stats-card">
                <h3 className="stats-card__title">
                  <Activity size={16} />
                  Disease Risk Overview
                </h3>
                <StatisticsSummary stats={predictions.statistics} />
                <HealthAdviceCard advice={predictions.advice} />
              </Card>

              {/* Environment Display */}
              <Card className="env-card">
                <EnvironmentDisplay environment={predictions.environment} />
              </Card>
            </div>

            {/* Disease Cards */}
            <Card className="diseases-card">
              <div className="diseases-card__header">
                <h3 className="diseases-card__title">
                  <Shield size={16} />
                  Predicted Disease Risks
                </h3>
                <span className="diseases-card__count">
                  {predictions.predictions.length} diseases detected
                </span>
              </div>

              {predictions.predictions.length === 0 ? (
                <EmptyState message="No significant disease risks detected in this area." />
              ) : (
                <div className="diseases-grid">
                  {predictions.predictions.map((risk, idx) => {
                    const disease = getAllDiseases().find(d => d.id === risk.diseaseId);
                    if (!disease) return null;
                    return (
                      <DiseaseCard
                        key={idx}
                        disease={disease}
                        risk={risk}
                        onClick={() => handleDiseaseClick({ ...disease, risk })}
                      />
                    );
                  })}
                </div>
              )}
            </Card>
          </>
        )}

        {/* Initial Empty State */}
        {!predictions && !loading && !error && (
          <Card className="empty-state-card">
            <EmptyState 
              icon={Search} 
              message="Search for a city or use your location"
              description="Get real-time disease predictions based on current environmental conditions."
            />
          </Card>
        )}
        </>
      )}

        {/* Disease Detail Modal */}
        {showDetails && selectedDisease && (
          <div className="modal-backdrop" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={closeModal}>×</button>
              <div className="modal-body">
                <div className="modal-header">
                  <h2>{selectedDisease.name}</h2>
                  <StatusBadge 
                    label={`${selectedDisease.risk.severity} Risk`} 
                    color={selectedDisease.risk.severity === 'critical' ? '#e53e3e' : 
                           selectedDisease.risk.severity === 'severe' ? '#ed8936' :
                           selectedDisease.risk.severity === 'moderate' ? '#ecc94b' : '#48bb78'} 
                  />
                </div>
                <div className="modal-meta">
                  <span className="modal-meta__item">
                    <span className="modal-meta__label">Category:</span>
                    {selectedDisease.category}
                  </span>
                  <span className="modal-meta__item">
                    <span className="modal-meta__label">Type:</span>
                    {selectedDisease.type}
                  </span>
                  <span className="modal-meta__item">
                    <span className="modal-meta__label">Risk Score:</span>
                    <span style={{ color: '#e53e3e', fontWeight: '700' }}>
                      {selectedDisease.risk.riskScore}%
                    </span>
                  </span>
                </div>
                <p className="modal-description">{selectedDisease.description}</p>
                
                <div className="modal-section">
                  <h4>🎯 Active Triggers</h4>
                  <div className="modal-triggers">
                    {selectedDisease.risk.triggers.map((trigger, idx) => (
                      <div key={idx} className="modal-trigger">
                        <span className="modal-trigger__label">{trigger.factor}</span>
                        <div className="modal-trigger__bar">
                          <div 
                            className="modal-trigger__bar-fill" 
                            style={{ width: `${trigger.risk}%`, background: trigger.risk > 50 ? '#e53e3e' : trigger.risk > 25 ? '#ecc94b' : '#48bb78' }}
                          />
                        </div>
                        <span className="modal-trigger__value">{trigger.value}</span>
                        <span className="modal-trigger__risk">{trigger.risk}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="modal-section">
                  <h4>💡 Recommendations</h4>
                  <ul className="modal-recommendations">
                    {selectedDisease.risk.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>

                <div className="modal-section">
                  <h4>🛡️ Prevention</h4>
                  <ul className="modal-preventions">
                    {selectedDisease.prevention.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .surveillance-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Top View Selector Tabs */
        .surveillance-view-tabs {
          display: flex;
          gap: 12px;
          background: #ffffff;
          padding: 6px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          flex-wrap: wrap;
        }

        .surveillance-view-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          color: #64748b;
          padding: 10px 18px;
          font-size: 13.5px;
          font-weight: 700;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .surveillance-view-tab:hover {
          color: #0f172a;
          background: #f1f5f9;
        }

        .surveillance-view-tab--active {
          background: #0284c7;
          color: #ffffff;
          box-shadow: 0 2px 10px rgba(2, 132, 199, 0.25);
        }

        /* GRAP Simulator Styling */
        .grap-simulator-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .grap-top-banner {
          background: #ffffff;
          border: 1px solid #fecaca;
          border-radius: 14px;
          padding: 20px 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 16px rgba(239, 68, 68, 0.06);
        }

        .grap-banner-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #fee2e2;
          color: #b91c1c;
          border: 1px solid #fca5a5;
          font-size: 11.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 4px 12px;
          border-radius: 20px;
          margin-bottom: 10px;
        }

        .grap-banner-title {
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 6px 0;
        }

        .grap-banner-sub {
          font-size: 13.5px;
          color: #475569;
          margin: 0;
          line-height: 1.5;
        }

        .grap-preset-buttons {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 14px;
          flex-wrap: wrap;
        }

        .preset-label {
          font-size: 11.5px;
          font-weight: 700;
          color: #475569;
        }

        .preset-btn {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          color: #334155;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 11.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .preset-btn:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        .preset-btn--balanced {
          background: #ecfdf5;
          border-color: #6ee7b7;
          color: #047857;
        }

        .preset-btn--balanced:hover {
          background: #d1fae5;
          color: #065f46;
        }

        .preset-btn--emergency {
          background: #fef2f2;
          border-color: #fca5a5;
          color: #b91c1c;
        }

        .preset-btn--emergency:hover {
          background: #fee2e2;
          color: #991b1b;
        }

        /* 4-Stage Protocol Matrix */
        .grap-stages-matrix {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 20px 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .stages-matrix-header {
          margin-bottom: 16px;
        }

        .stages-matrix-header h4 {
          font-size: 13px;
          font-weight: 800;
          color: #0284c7;
          letter-spacing: 0.8px;
          margin: 0 0 4px 0;
        }

        .stages-matrix-sub {
          font-size: 12px;
          color: #64748b;
        }

        .stages-cards-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
        }

        .stage-card {
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: all 0.25s ease;
        }

        .stage-card:not(.stage-card--current):not(.stage-card--simulated) {
          background: #f8fafc !important;
          border: 1.5px solid #e2e8f0 !important;
        }

        .stage-card:not(.stage-card--current):not(.stage-card--simulated) .stage-mandate {
          color: #334155 !important;
        }

        :global([data-theme='light']) .stage-card:not(.stage-card--current):not(.stage-card--simulated) {
          background: #f8fafc !important;
          border: 1.5px solid #cbd5e1 !important;
        }

        :global([data-theme='light']) .stage-card:not(.stage-card--current):not(.stage-card--simulated) .stage-mandate {
          color: #334155 !important;
        }

        .stage-card--current {
          border: 2px solid #ef4444 !important;
          background: #fff1f2 !important;
          box-shadow: 0 0 16px rgba(239, 68, 68, 0.15);
        }

        .stage-card--simulated {
          border: 2px solid #10b981 !important;
          background: #ecfdf5 !important;
          box-shadow: 0 0 16px rgba(16, 185, 129, 0.15);
        }

        .stage-card__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .stage-pill {
          font-size: 11px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 4px;
          border: 1px solid;
        }

        .stage-range {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
        }

        .stage-mandate {
          font-size: 11.5px;
          color: #334155;
          line-height: 1.45;
          margin: 0 0 12px 0;
        }

        .stage-card__footer {
          margin-top: auto;
        }

        .stage-status-badge {
          font-size: 10px;
          font-weight: 800;
          padding: 4px 8px;
          border-radius: 4px;
          text-align: center;
          letter-spacing: 0.5px;
        }

        .stage-status-badge--active {
          background: #fee2e2;
          color: #b91c1c;
          border: 2px solid #ef4444 !important;
        }

        .stage-status-badge--target {
          background: #d1fae5;
          color: #047857;
          border: 2px solid #10b981 !important;
        }

        .stage-inactive-lbl {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          color: #64748b !important;
          background: #f1f5f9;
          padding: 3px 8px;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
        }

        .stage-transition-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 16px;
          padding: 12px 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
        }

        .stage-transition-banner--success {
          background: #ecfdf5;
          border-color: #a7f3d0;
        }

        .transition-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 800;
          color: #0284c7;
          white-space: nowrap;
        }

        .stage-transition-banner--success .transition-badge {
          color: #047857;
        }

        .transition-text {
          font-size: 12px;
          color: #334155;
          line-height: 1.45;
        }

        /* 72-Hour Comparison Chart */
        .grap-chart-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 22px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .grap-chart-card__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 16px;
        }

        .chart-legend-pills {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .legend-pill {
          font-size: 11.5px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
        }

        .legend-pill--baseline {
          color: #b91c1c;
          background: #fee2e2;
          border: 1px solid #fca5a5;
        }

        .legend-pill--simulated {
          color: #047857;
          background: #d1fae5;
          border: 1px solid #a7f3d0;
        }

        .grap-main-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
          gap: 20px;
        }

        .grap-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 22px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .grap-card__header {
          margin-bottom: 18px;
        }

        .panel-tag {
          font-size: 10.5px;
          font-weight: 800;
          color: #0284c7;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }

        .grap-card__header h3 {
          font-size: 17px;
          font-weight: 700;
          color: #0f172a;
          margin: 4px 0 0 0;
        }

        .active-policy-box {
          background: #fff1f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 20px;
        }

        .active-policy-label {
          font-size: 10.5px;
          font-weight: 800;
          color: #b91c1c;
          letter-spacing: 0.5px;
        }

        .active-policy-title {
          font-size: 18px;
          font-weight: 900;
          color: #dc2626;
          margin: 4px 0;
        }

        .active-policy-sub {
          font-size: 11.5px;
          color: #475569;
          line-height: 1.4;
        }

        .policy-toggles-section h4 {
          font-size: 13.5px;
          font-weight: 700;
          color: #334155;
          margin: 0 0 12px 0;
        }

        .policy-toggle-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px 14px;
          margin-bottom: 10px;
          transition: all 0.2s;
        }

        .policy-toggle-item--active {
          background: #f0f9ff;
          border-color: #7dd3fc;
        }

        .policy-toggle-info {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          flex: 1;
        }

        .toggle-title {
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
        }

        .toggle-desc {
          font-size: 11.5px;
          color: #64748b;
          margin-top: 2px;
        }

        .toggle-btn {
          background: #e2e8f0;
          border: none;
          color: #475569;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
        }

        .toggle-btn--on {
          background: #10b981;
          color: #ffffff;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.25);
        }

        /* Sliders */
        .simulation-sliders-group {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 22px;
        }

        .slider-control {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 14px;
        }

        .slider-control__header {
          display: flex;
          justify-content: space-between;
          font-size: 12.5px;
          font-weight: 600;
          color: #334155;
          margin-bottom: 8px;
        }

        .slider-val {
          color: #0284c7;
          font-weight: 800;
        }

        .policy-range {
          width: 100%;
          accent-color: #0284c7;
          cursor: pointer;
        }

        .slider-hints {
          display: flex;
          justify-content: space-between;
          font-size: 10.5px;
          color: #64748b;
          margin-top: 4px;
        }

        /* Live Impact Results */
        .live-impact-results {
          border-top: 1px solid #e2e8f0;
          padding-top: 16px;
        }

        .impact-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .impact-header h4 {
          font-size: 12px;
          font-weight: 800;
          color: #0284c7;
          letter-spacing: 0.8px;
          margin: 0;
        }

        .sim-calculating {
          font-size: 11px;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .impact-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 10px;
          margin-bottom: 14px;
        }

        .impact-metric-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px;
        }

        .impact-metric-title {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          margin-bottom: 6px;
        }

        .impact-metric-comparison {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
        }

        .val-before {
          font-size: 16px;
          font-weight: 800;
          color: #dc2626;
          text-decoration: line-through;
        }

        .val-after {
          font-size: 20px;
          font-weight: 900;
          color: #059669;
        }

        .val-drop {
          font-size: 11.5px;
          font-weight: 700;
          color: #059669;
        }

        .impact-stat-big {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 20px;
          font-weight: 900;
          color: #0f172a;
          margin-bottom: 6px;
        }

        .impact-metric-sub {
          font-size: 10.5px;
          color: #64748b;
          line-height: 1.3;
        }

        .sim-summary-callout {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 12px;
          color: #0369a1;
          line-height: 1.4;
        }

        /* Search Section */
        .search-section {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .search-section__form {
          flex: 1;
          min-width: 200px;
        }

        .search-section__input-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
          background: white;
          padding: 4px 12px 4px 14px;
          border-radius: 10px;
          border: 1px solid var(--color-border);
          transition: all 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }

        .search-section__input-wrapper:focus-within {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
        }

        .search-section__icon {
          color: var(--color-text-faint);
          flex-shrink: 0;
        }

        .search-section__input {
          border: none;
          outline: none;
          flex: 1;
          font-size: 14px;
          color: var(--color-text-primary);
          background: transparent;
          padding: 8px 0;
        }

        .search-section__input::placeholder {
          color: var(--color-text-faint);
        }

        .btn {
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }

        .btn--primary {
          background: var(--color-primary, #4299e1);
          color: white;
        }

        .btn--primary:hover:not(:disabled) {
          background: var(--color-primary-dark, #3182ce);
          transform: translateY(-1px);
        }

        .btn--primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn--ghost {
          background: transparent;
          color: var(--color-text-secondary);
          border: 1px solid var(--color-border);
        }

        .btn--ghost:hover {
          background: var(--color-bg-hover);
        }

        .btn--sm {
          padding: 6px 12px;
          font-size: 12px;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Predictions Header */
        .predictions-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          background: white;
          padding: 16px 20px;
          border-radius: 12px;
          border: 1px solid var(--color-border);
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }

        .predictions-header__info {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .predictions-header__title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 600;
          margin: 0;
          color: var(--color-text-primary);
        }

        .predictions-header__title svg {
          color: var(--color-primary);
        }

        .predictions-header__time {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--color-text-secondary);
        }

        /* Predictions Grid */
        .predictions-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        /* Stats Card */
        .stats-card {
          padding: 20px;
        }

        .stats-card__title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 16px 0;
          color: var(--color-text-primary);
        }

        .stats-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .stats-summary__item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px;
          background: var(--color-bg-secondary);
          border-radius: 8px;
          border: 1px solid var(--color-border);
        }

        .stats-summary__value {
          font-size: 24px;
          font-weight: 700;
          color: var(--color-text-primary);
        }

        .stats-summary__label {
          font-size: 11px;
          color: var(--color-text-secondary);
          margin-top: 2px;
        }

        .stats-summary__item--high .stats-summary__value {
          color: #e53e3e;
        }

        .stats-summary__item--moderate .stats-summary__value {
          color: #ecc94b;
        }

        .stats-summary__item--low .stats-summary__value {
          color: #48bb78;
        }

        /* Health Advice Card */
        .health-advice-card {
          margin-top: 8px;
        }

        .health-advice-card__title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 10px 0;
          color: var(--color-text-primary);
        }

        .health-advice-card__list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .health-advice-card__item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 13px;
          border-left: 3px solid;
        }

        .health-advice-card__item--good {
          background: #f0fff4;
          border-color: #48bb78;
        }

        .health-advice-card__item--moderate {
          background: #fffbeb;
          border-color: #ecc94b;
        }

        .health-advice-card__item--unhealthy_sensitive {
          background: #fff5f0;
          border-color: #ed8936;
        }

        .health-advice-card__item--unhealthy {
          background: #fff5f5;
          border-color: #e53e3e;
        }

        .health-advice-card__item--hazardous {
          background: #fef2f2;
          border-color: #9b2c2c;
        }

        .health-advice-card__item--warning {
          background: #fefcbf;
          border-color: #d69e2e;
        }

        .health-advice-card__icon {
          font-size: 16px;
        }

        .health-advice-card__message {
          flex: 1;
        }

        /* Environment Card */
        .env-card {
          padding: 20px;
        }

        .environment-display__title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 12px 0;
          color: var(--color-text-primary);
        }

        .environment-display__grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .environment-display__item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px;
          background: var(--color-bg-secondary);
          border-radius: 8px;
          gap: 4px;
        }

        .environment-display__value {
          font-size: 18px;
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .environment-display__label {
          font-size: 11px;
          color: var(--color-text-secondary);
        }

        /* Diseases Card */
        .diseases-card {
          padding: 20px;
        }

        .diseases-card__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .diseases-card__title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          color: var(--color-text-primary);
        }

        .diseases-card__count {
          font-size: 13px;
          color: var(--color-text-secondary);
          padding: 4px 12px;
          background: var(--color-bg-secondary);
          border-radius: 20px;
        }

        .diseases-grid {
          display: grid;
          gap: 16px;
        }

        /* Disease Card */
        .disease-card {
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-radius: 10px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .disease-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          border-color: var(--color-primary);
        }

        .disease-card__header {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .disease-card__icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .disease-card__info {
          flex: 1;
          min-width: 0;
        }

        .disease-card__name {
          font-size: 15px;
          font-weight: 600;
          margin: 0 0 4px 0;
          color: var(--color-text-primary);
        }

        .disease-card__meta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .disease-card__category {
          font-size: 11px;
          padding: 2px 8px;
          background: var(--color-bg-hover);
          border-radius: 12px;
          color: var(--color-text-secondary);
        }

        .disease-card__type {
          font-size: 11px;
          padding: 2px 8px;
          background: #ebf8ff;
          border-radius: 12px;
          color: #2b6cb0;
        }

        .disease-card__risk {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          flex-shrink: 0;
        }

        .disease-card__risk-score {
          font-size: 22px;
          font-weight: 700;
        }

        .disease-card__body {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .disease-card__description {
          font-size: 13px;
          color: var(--color-text-secondary);
          margin: 0;
          line-height: 1.5;
        }

        .disease-card__triggers {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .disease-card__triggers-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text-secondary);
        }

        .disease-card__trigger-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .disease-card__trigger-tag {
          font-size: 11px;
          padding: 2px 8px;
          background: #fefcbf;
          border-radius: 12px;
          color: #975a16;
        }

        .disease-card__recommendations {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .disease-card__recommendations-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text-secondary);
        }

        .disease-card__recommendations ul {
          margin: 0;
          padding-left: 20px;
        }

        .disease-card__recommendations li {
          font-size: 12px;
          color: var(--color-text-secondary);
          line-height: 1.5;
        }

        /* Modal */
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          max-width: 700px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          padding: 32px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }

        .modal-close {
          position: absolute;
          top: 16px;
          right: 20px;
          background: none;
          border: none;
          font-size: 28px;
          color: var(--color-text-secondary);
          cursor: pointer;
          padding: 0 8px;
          line-height: 1;
        }

        .modal-close:hover {
          color: var(--color-text-primary);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .modal-header h2 {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
          color: var(--color-text-primary);
        }

        .modal-meta {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 16px;
          padding: 12px 16px;
          background: var(--color-bg-secondary);
          border-radius: 8px;
        }

        .modal-meta__item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--color-text-primary);
        }

        .modal-meta__label {
          font-weight: 600;
          color: var(--color-text-secondary);
        }

        .modal-description {
          font-size: 14px;
          color: var(--color-text-secondary);
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .modal-section {
          margin-bottom: 20px;
        }

        .modal-section h4 {
          font-size: 15px;
          font-weight: 600;
          margin: 0 0 10px 0;
          color: var(--color-text-primary);
        }

        .modal-triggers {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .modal-trigger {
          display: grid;
          grid-template-columns: 80px 1fr 50px 40px;
          gap: 8px;
          align-items: center;
          padding: 6px 10px;
          background: var(--color-bg-secondary);
          border-radius: 6px;
          font-size: 13px;
        }

        .modal-trigger__label {
          font-weight: 500;
          color: var(--color-text-primary);
        }

        .modal-trigger__bar {
          height: 6px;
          background: var(--color-border);
          border-radius: 3px;
          overflow: hidden;
        }

        .modal-trigger__bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.6s ease;
        }

        .modal-trigger__value {
          color: var(--color-text-secondary);
          font-size: 12px;
        }

        .modal-trigger__risk {
          font-weight: 600;
          font-size: 12px;
        }

        .modal-recommendations,
        .modal-preventions {
          margin: 0;
          padding-left: 24px;
        }

        .modal-recommendations li,
        .modal-preventions li {
          font-size: 14px;
          color: var(--color-text-secondary);
          line-height: 1.6;
          margin-bottom: 4px;
        }

        /* Empty State */
        .empty-state-card {
          padding: 60px 40px;
          text-align: center;
        }

        /* Error Card */
        .error-card {
          padding: 20px;
        }

        .loading-card {
          padding: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .predictions-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .search-section {
            flex-direction: column;
            align-items: stretch;
          }

          .predictions-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .stats-summary {
            grid-template-columns: repeat(2, 1fr);
          }

          .environment-display__grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .modal-content {
            padding: 20px;
            margin: 10px;
          }

          .modal-trigger {
            grid-template-columns: 60px 1fr 40px 30px;
            font-size: 12px;
          }
        }

        @media (max-width: 480px) {
          .stats-summary {
            grid-template-columns: 1fr 1fr;
          }

          .environment-display__grid {
            grid-template-columns: 1fr 1fr;
          }

          .disease-card__header {
            flex-wrap: wrap;
          }

          .disease-card__risk {
            width: 100%;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }

          .modal-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .modal-meta {
            flex-direction: column;
            gap: 8px;
          }
        }

        /* ===================================================
           CPCB / DPCC COMMAND CENTER & MUNICIPAL ORDER STYLES
        =================================================== */
        .grap-banner-badge-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 12px;
        }

        .station-selector-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .station-selector-lbl {
          font-size: 11.5px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .cpcb-station-select {
          background: #ffffff;
          color: #0284c7;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          outline: none;
          transition: all 0.2s;
        }

        .cpcb-station-select:hover {
          border-color: #0284c7;
          box-shadow: 0 0 10px rgba(2, 132, 199, 0.15);
        }

        .banner-title-action-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 16px;
        }

        .generate-grap-order-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #059669, #10b981);
          color: #ffffff;
          border: 1px solid rgba(16, 185, 129, 0.5);
          padding: 9px 18px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.3px;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25);
          white-space: nowrap;
        }

        .generate-grap-order-btn:hover {
          background: linear-gradient(135deg, #047857, #059669);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35);
        }

        /* 72-Hour Horizon Alerts Tracker */
        .horizon-alerts-container {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 20px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .horizon-alerts-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }

        .horizon-header-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .horizon-header-title h4 {
          font-size: 13.5px;
          font-weight: 800;
          color: #0284c7;
          letter-spacing: 0.5px;
          margin: 0;
        }

        .horizon-statutory-mandate {
          font-size: 11.5px;
          color: #64748b;
        }

        .horizon-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
          margin-bottom: 16px;
        }

        .horizon-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-top-width: 4px;
          border-radius: 10px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .horizon-card__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .horizon-tag {
          font-size: 10.5px;
          font-weight: 800;
          color: #64748b;
          letter-spacing: 0.5px;
        }

        .horizon-offset {
          font-size: 10.5px;
          color: #64748b;
          font-weight: 600;
        }

        .horizon-aqi-stat {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .horizon-aqi-val {
          font-size: 26px;
          font-weight: 900;
        }

        .horizon-aqi-label {
          font-size: 11px;
          color: #64748b;
        }

        .horizon-stage-badge {
          font-size: 11px;
          font-weight: 800;
          padding: 4px 8px;
          border-radius: 4px;
          text-align: center;
        }

        .horizon-card__footer {
          display: flex;
          justify-content: space-between;
          font-size: 11.5px;
          color: #475569;
          border-top: 1px solid #e2e8f0;
          padding-top: 8px;
          margin-top: 4px;
        }

        .mandatory-breach-alert {
          display: flex;
          align-items: center;
          gap: 16px;
          background: #fff7ed;
          border: 1px solid #fed7aa;
          border-radius: 10px;
          padding: 14px 18px;
          flex-wrap: wrap;
        }

        .mandatory-breach-alert--emergency {
          background: #fef2f2;
          border-color: #fca5a5;
          animation: pulse-border 2.5s infinite;
        }

        @keyframes pulse-border {
          0%, 100% { border-color: #fca5a5; box-shadow: 0 0 0 rgba(239, 68, 68, 0); }
          50% { border-color: #ef4444; box-shadow: 0 0 16px rgba(239, 68, 68, 0.2); }
        }

        .breach-alert-icon {
          flex-shrink: 0;
        }

        .breach-alert-content {
          flex: 1;
          min-width: 240px;
        }

        .breach-alert-headline {
          font-size: 13px;
          font-weight: 800;
          color: #b91c1c;
          margin-bottom: 3px;
        }

        .breach-alert-details {
          font-size: 11.5px;
          color: #334155;
          line-height: 1.45;
        }

        .order-trigger-cta {
          background: #ef4444;
          color: #ffffff;
          border: none;
          padding: 7px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .order-trigger-cta:hover {
          background: #dc2626;
          transform: translateY(-1px);
        }

        /* Official Statutory Municipal Order Modal */
        .order-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          overflow-y: auto;
        }

        .order-modal-window {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          width: 100%;
          max-width: 860px;
          max-height: 92vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.2);
          overflow: hidden;
        }

        .order-modal-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 20px;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          flex-wrap: wrap;
          gap: 10px;
        }

        .order-modal-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
        }

        .order-modal-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .order-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }

        .order-action-btn--print {
          background: #0284c7;
          color: white;
        }

        .order-action-btn--print:hover {
          background: #0369a1;
        }

        .order-action-btn--copy {
          background: #f1f5f9;
          color: #334155;
          border-color: #cbd5e1;
        }

        .order-action-btn--copy:hover {
          background: #e2e8f0;
        }

        .order-action-btn--close {
          background: transparent;
          color: #64748b;
          font-size: 16px;
          padding: 4px 8px;
        }

        .order-action-btn--close:hover {
          color: #0f172a;
        }

        .order-document-sheet {
          background: #ffffff;
          color: #0f172a;
          padding: 36px 44px;
          overflow-y: auto;
          font-family: 'Times New Roman', Times, serif;
          line-height: 1.55;
          font-size: 13.5px;
          box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.05);
        }

        .order-doc-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .govt-emblem {
          font-size: 32px;
          margin-bottom: 4px;
        }

        .govt-title {
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.5px;
          color: #0f172a;
        }

        .govt-sub {
          font-size: 12.5px;
          font-weight: 700;
          color: #334155;
          margin-top: 2px;
        }

        .govt-address {
          font-size: 11px;
          color: #64748b;
          margin-top: 4px;
        }

        .govt-divider {
          height: 2px;
          background: #0f172a;
          margin: 14px 0 10px 0;
        }

        .order-meta-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 16px;
        }

        .order-subject-block {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-left: 4px solid #0f172a;
          padding: 10px 14px;
          margin-bottom: 18px;
          font-size: 12.5px;
          text-align: justify;
        }

        .order-body-text p {
          margin-bottom: 12px;
          text-align: justify;
        }

        .order-directives-list {
          margin: 14px 0 16px 20px;
          padding: 0;
        }

        .order-directives-list li {
          margin-bottom: 8px;
          text-align: justify;
        }

        .order-penalty-notice {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-left: 4px solid #ef4444;
          padding: 8px 12px;
          font-size: 12px;
          color: #991b1b;
        }

        .order-signature-block {
          display: flex;
          justify-content: flex-end;
          margin-top: 36px;
        }

        .sig-space {
          text-align: right;
          min-width: 280px;
        }

        .sig-seal {
          display: inline-block;
          border: 2px dashed #94a3b8;
          padding: 8px 14px;
          font-size: 10px;
          font-weight: 700;
          color: #64748b;
          margin-bottom: 12px;
          text-align: center;
        }

        .sig-name {
          font-size: 13.5px;
          color: #0f172a;
        }

        .sig-role {
          font-size: 11.5px;
          color: #475569;
        }

        /* @media print formatting */
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-grap-order, #printable-grap-order * {
            visibility: visible;
          }
          #printable-grap-order {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 28px;
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 12pt;
          }
          .order-modal-toolbar {
            display: none !important;
          }
        }
      `}</style>
    </Layout>
  );
}