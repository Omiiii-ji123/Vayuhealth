import { 
  MapPin, 
  Flag, 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  CheckCircle,
  AlertCircle,
  Clock,
  Route,
  Gauge,
  Wind
} from 'lucide-react';

/**
 * Route Summary Component
 * Displays route metrics like distance, peak risk, and safety score
 */
export default function RouteSummary({ metrics, origin, destination, className = '' }) {
  if (!metrics) {
    return (
      <div className={`route-summary ${className}`}>
        <div className="route-summary__empty">
          <Route size={32} />
          <p>No route data available</p>
          <span>Search for a route to see metrics</span>
        </div>
      </div>
    );
  }

  const {
    totalDistanceFormatted = '0 km',
    peakRisk = 'No risk',
    safetyScore = 0,
    avgAQI = 0,
    maxAQI = 0,
    minAQI = 0,
    safeSegments = 0,
    riskySegments = 0,
    totalSegments = 0,
  } = metrics;

  // Determine safety level
  const getSafetyLevel = (score) => {
    if (score >= 80) return { label: 'Safe', color: '#48bb78', icon: CheckCircle };
    if (score >= 60) return { label: 'Moderate', color: '#ecc94b', icon: AlertCircle };
    return { label: 'Risky', color: '#e53e3e', icon: AlertTriangle };
  };

  const safetyLevel = getSafetyLevel(safetyScore);
  const SafetyIcon = safetyLevel.icon;

  // Get AQI status color
  const getAQIColor = (aqi) => {
    if (aqi > 200) return '#e53e3e';
    if (aqi > 150) return '#ed8936';
    if (aqi > 100) return '#ecc94b';
    if (aqi > 50) return '#48bb78';
    return '#38a169';
  };

  // Get AQI label
  const getAQILabel = (aqi) => {
    if (aqi > 200) return 'Hazardous';
    if (aqi > 150) return 'Unhealthy';
    if (aqi > 100) return 'Unhealthy Sensitive';
    if (aqi > 50) return 'Moderate';
    return 'Good';
  };

  return (
    <div className={`route-summary ${className}`}>
      {/* Header */}
      <div className="route-summary__header">
        <h3 className="route-summary__title">
          <Route size={18} />
          Route Summary
        </h3>
        {origin && destination && (
          <div className="route-summary__locations">
            <span className="route-summary__location">
              <MapPin size={12} />
              {origin}
            </span>
            <span className="route-summary__arrow">→</span>
            <span className="route-summary__location">
              <Flag size={12} />
              {destination}
            </span>
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="route-summary__grid">
        {/* Distance */}
        <div className="route-summary__metric route-summary__metric--distance">
          <div className="route-summary__metric-icon">
            <MapPin size={16} />
          </div>
          <div className="route-summary__metric-content">
            <span className="route-summary__metric-label">Total Distance</span>
            <span className="route-summary__metric-value">{totalDistanceFormatted}</span>
          </div>
        </div>

        {/* Peak Risk */}
        <div className="route-summary__metric route-summary__metric--risk">
          <div className="route-summary__metric-icon" style={{ color: '#e53e3e' }}>
            <AlertTriangle size={16} />
          </div>
          <div className="route-summary__metric-content">
            <span className="route-summary__metric-label">Peak Segment Risk</span>
            <span className="route-summary__metric-value route-summary__metric-value--risk">
              {peakRisk}
            </span>
          </div>
        </div>

        {/* Safety Score */}
        <div className="route-summary__metric route-summary__metric--safety">
          <div className="route-summary__metric-icon" style={{ color: safetyLevel.color }}>
            <Shield size={16} />
          </div>
          <div className="route-summary__metric-content">
            <span className="route-summary__metric-label">Safety Score</span>
            <span className="route-summary__metric-value" style={{ color: safetyLevel.color }}>
              {safetyScore}%
            </span>
          </div>
        </div>

        {/* Average AQI */}
        <div className="route-summary__metric route-summary__metric--aqi">
          <div className="route-summary__metric-icon" style={{ color: getAQIColor(avgAQI) }}>
            <Wind size={16} />
          </div>
          <div className="route-summary__metric-content">
            <span className="route-summary__metric-label">Average AQI</span>
            <span className="route-summary__metric-value" style={{ color: getAQIColor(avgAQI) }}>
              {avgAQI} ({getAQILabel(avgAQI)})
            </span>
          </div>
        </div>
      </div>

      {/* Safety Status Badge */}
      <div className="route-summary__status">
        <div className={`route-summary__status-badge route-summary__status-badge--${safetyLevel.label.toLowerCase()}`}>
          <SafetyIcon size={16} />
          <span>{safetyLevel.label} Route</span>
        </div>
        <div className="route-summary__status-details">
          <span>{safeSegments} safe segments</span>
          <span>•</span>
          <span>{riskySegments} risky segments</span>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="route-summary__stats">
        <div className="route-summary__stat">
          <span className="route-summary__stat-label">
            <TrendingUp size={12} />
            Best AQI
          </span>
          <span className="route-summary__stat-value" style={{ color: '#48bb78' }}>
            {minAQI}
          </span>
        </div>
        <div className="route-summary__stat">
          <span className="route-summary__stat-label">
            <TrendingDown size={12} />
            Worst AQI
          </span>
          <span className="route-summary__stat-value" style={{ color: '#e53e3e' }}>
            {maxAQI}
          </span>
        </div>
        <div className="route-summary__stat">
          <span className="route-summary__stat-label">
            <Clock size={12} />
            Segments
          </span>
          <span className="route-summary__stat-value">
            {totalSegments}
          </span>
        </div>
      </div>

      <style jsx>{`
        .route-summary {
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 16px 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
        }

        .route-summary__empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 20px;
          color: #a0aec0;
          gap: 8px;
        }

        .route-summary__empty p {
          margin: 0;
          font-weight: 500;
          font-size: 14px;
        }

        .route-summary__empty span {
          font-size: 13px;
        }

        .route-summary__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .route-summary__title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 15px;
          font-weight: 600;
          color: #2d3748;
          margin: 0;
        }

        .route-summary__title svg {
          color: #4299e1;
        }

        .route-summary__locations {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #718096;
        }

        .route-summary__location {
          display: flex;
          align-items: center;
          gap: 4px;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .route-summary__arrow {
          color: #a0aec0;
        }

        .route-summary__grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 12px;
        }

        .route-summary__metric {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: #f7fafc;
          border-radius: 8px;
          border: 1px solid #edf2f7;
        }

        .route-summary__metric-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #4299e1;
        }

        .route-summary__metric-content {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .route-summary__metric-label {
          font-size: 11px;
          color: #718096;
        }

        .route-summary__metric-value {
          font-size: 14px;
          font-weight: 600;
          color: #2d3748;
        }

        .route-summary__metric-value--risk {
          color: #e53e3e;
        }

        .route-summary__status {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: #f7fafc;
          border-radius: 8px;
          margin-bottom: 12px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .route-summary__status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
        }

        .route-summary__status-badge--safe {
          background: #c6f6d5;
          color: #276749;
        }

        .route-summary__status-badge--moderate {
          background: #fefcbf;
          color: #975a16;
        }

        .route-summary__status-badge--risky {
          background: #fed7d7;
          color: #9b2c2c;
        }

        .route-summary__status-details {
          font-size: 12px;
          color: #718096;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .route-summary__stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .route-summary__stat {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 10px;
          background: #f7fafc;
          border-radius: 6px;
        }

        .route-summary__stat-label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: #718096;
        }

        .route-summary__stat-value {
          font-size: 14px;
          font-weight: 600;
          color: #2d3748;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .route-summary__grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .route-summary__stats {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 768px) {
          .route-summary__header {
            flex-direction: column;
            align-items: flex-start;
          }

          .route-summary__locations {
            flex-wrap: wrap;
          }

          .route-summary__grid {
            grid-template-columns: 1fr 1fr;
          }

          .route-summary__stats {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 480px) {
          .route-summary__grid {
            grid-template-columns: 1fr;
          }

          .route-summary__metric {
            padding: 8px 12px;
          }

          .route-summary__status {
            flex-direction: column;
            align-items: flex-start;
          }

          .route-summary__stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}