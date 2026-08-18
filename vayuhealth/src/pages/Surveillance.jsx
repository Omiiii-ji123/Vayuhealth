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
  ExternalLink
} from 'lucide-react';

import Layout from '../components/Layout';
import { Card, Loader, ErrorState, EmptyState, StatusBadge } from '../components/Common';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../context/AuthContext';
import { getSurveillanceStats, getSurveillanceByCity, getSurveillanceByState } from '../api/dashboard';
import { getHealthStatsByDistrict } from '../api/health';
import { getDiseasePredictions, getLocationDiseasePredictions, getAllDiseases } from '../api/prediction';
import { getAqiByCity, getAqiByLocation } from '../api/aqi';
import { getAqiBand } from '../utils/aqi';

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

// Main Component
export default function Surveillance() {
  const { user } = useAuth();
  const [city, setCity] = useState(user?.city || user?.district || '');
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
      title="Disease Surveillance" 
      subtitle="Environment-linked diseases tracked across your region."
    >
      <div className="surveillance-page">
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
      `}</style>
    </Layout>
  );
}