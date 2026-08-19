import { 
  MapPin, 
  Flag, 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Wind,
  Shield,
  Navigation,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import { useState } from 'react';

/**
 * Route Timeline Component
 * Displays step-by-step waypoint directives for the route
 */
export default function RouteTimeline({ waypoints, onWaypointClick, className = '' }) {
  const [expandedWaypoint, setExpandedWaypoint] = useState(null);
  const [showAll, setShowAll] = useState(false);

  if (!waypoints || waypoints.length === 0) {
    return (
      <div className={`route-timeline ${className}`}>
        <div className="route-timeline__empty">
          <Navigation size={32} />
          <p>No route waypoints available</p>
          <span>Generate a route to see step-by-step directives</span>
        </div>
      </div>
    );
  }

  const displayWaypoints = showAll ? waypoints : waypoints.slice(0, 4);
  const hasMore = waypoints.length > 4;

  // Get risk level class
  const getRiskClass = (riskLevel) => {
    switch(riskLevel) {
      case 'high': return 'route-timeline__item--high';
      case 'moderate': return 'route-timeline__item--moderate';
      case 'safe': return 'route-timeline__item--safe';
      default: return '';
    }
  };

  // Get badge class
  const getBadgeClass = (riskLevel) => {
    switch(riskLevel) {
      case 'high': return 'badge-high';
      case 'moderate': return 'badge-moderate';
      case 'safe': return 'badge-safe';
      default: return 'badge-safe';
    }
  };

  // Get risk icon
  const getRiskIcon = (riskLevel) => {
    switch(riskLevel) {
      case 'high': return <AlertTriangle size={14} />;
      case 'moderate': return <AlertCircle size={14} />;
      case 'safe': return <CheckCircle size={14} />;
      default: return <CheckCircle size={14} />;
    }
  };

  // Get AQI color
  const getAQIColor = (aqi) => {
    if (aqi > 200) return '#e53e3e';
    if (aqi > 150) return '#ed8936';
    if (aqi > 100) return '#ecc94b';
    if (aqi > 50) return '#48bb78';
    return '#38a169';
  };

  // Toggle waypoint expansion
  const toggleWaypoint = (index) => {
    if (expandedWaypoint === index) {
      setExpandedWaypoint(null);
    } else {
      setExpandedWaypoint(index);
    }
  };

  return (
    <div className={`route-timeline ${className}`}>
      {/* Header */}
      <div className="route-timeline__header">
        <h3 className="route-timeline__title">
          <Navigation size={18} />
          Step-by-Step Health Navigation Directives
        </h3>
        <span className="route-timeline__count">
          {waypoints.length} waypoints
        </span>
      </div>

      {/* Timeline Items */}
      <div className="route-timeline__list">
        {displayWaypoints.map((waypoint, index) => {
          const isExpanded = expandedWaypoint === index;
          const isFirst = index === 0;
          const isLast = index === waypoints.length - 1;
          const aqiColor = getAQIColor(waypoint.aqi);

          return (
            <div 
              key={index}
              className={`route-timeline__item ${getRiskClass(waypoint.riskLevel)}`}
              onClick={() => toggleWaypoint(index)}
            >
              {/* Step Badge */}
              <div className="route-timeline__step">
                <div className={`route-timeline__step-badge ${getBadgeClass(waypoint.riskLevel)}`}>
                  {isFirst ? '🚩' : isLast ? '🏁' : waypoint.step}
                </div>
                {!isLast && <div className="route-timeline__step-line" />}
              </div>

              {/* Content */}
              <div className="route-timeline__content">
                <div className="route-timeline__content-header">
                  <div className="route-timeline__content-info">
                    <h4 className="route-timeline__title-text">{waypoint.title}</h4>
                    <span className="route-timeline__subtitle">{waypoint.subtitle}</span>
                  </div>
                  <div className="route-timeline__content-badges">
                    <span 
                      className="route-timeline__aqi-badge"
                      style={{ 
                        background: `${aqiColor}20`,
                        color: aqiColor,
                        borderColor: aqiColor
                      }}
                    >
                      <Wind size={12} />
                      AQI {waypoint.aqi}
                    </span>
                    <span className={`route-timeline__risk-badge route-timeline__risk-badge--${waypoint.riskLevel}`}>
                      {getRiskIcon(waypoint.riskLevel)}
                      {waypoint.badgeText || waypoint.riskLevel.toUpperCase()}
                    </span>
                    <button 
                      className="route-timeline__expand-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWaypoint(index);
                      }}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Directive - Always visible */}
                <div className="route-timeline__directive">
                  <div className="route-timeline__directive-icon">
                    {waypoint.riskLevel === 'high' ? '🚨' : 
                     waypoint.riskLevel === 'moderate' ? '⚠️' : '✅'}
                  </div>
                  <p className="route-timeline__directive-text">{waypoint.directive}</p>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="route-timeline__details">
                    <div className="route-timeline__details-grid">
                      <div className="route-timeline__detail">
                        <span className="route-timeline__detail-label">
                          <MapPin size={12} />
                          Coordinates
                        </span>
                        <span className="route-timeline__detail-value">
                          {waypoint.lat.toFixed(4)}, {waypoint.lng.toFixed(4)}
                        </span>
                      </div>
                      <div className="route-timeline__detail">
                        <span className="route-timeline__detail-label">
                          <Shield size={12} />
                          Risk Level
                        </span>
                        <span 
                          className="route-timeline__detail-value"
                          style={{ color: aqiColor }}
                        >
                          {waypoint.riskLevel.toUpperCase()}
                        </span>
                      </div>
                      <div className="route-timeline__detail">
                        <span className="route-timeline__detail-label">
                          <Clock size={12} />
                          Status
                        </span>
                        <span className="route-timeline__detail-value">
                          {isFirst ? 'Departure' : isLast ? 'Arrival' : 'Transit'}
                        </span>
                      </div>
                    </div>

                    {/* Recommendation */}
                    {waypoint.recommendation && (
                      <div className="route-timeline__recommendation">
                        <div className="route-timeline__recommendation-icon">💡</div>
                        <div>
                          <span className="route-timeline__recommendation-label">Recommendation:</span>
                          <p className="route-timeline__recommendation-text">{waypoint.recommendation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Show More / Show Less */}
      {hasMore && (
        <button 
          className="route-timeline__show-more"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? (
            <>
              <ChevronUp size={16} />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown size={16} />
              Show All {waypoints.length} Waypoints
            </>
          )}
        </button>
      )}

      <style jsx>{`
        .route-timeline {
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 16px 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
        }

        .route-timeline__empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 20px;
          color: #a0aec0;
          gap: 8px;
        }

        .route-timeline__empty p {
          margin: 0;
          font-weight: 500;
          font-size: 14px;
        }

        .route-timeline__empty span {
          font-size: 13px;
        }

        .route-timeline__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .route-timeline__title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 15px;
          font-weight: 600;
          color: #2d3748;
          margin: 0;
        }

        .route-timeline__title svg {
          color: #4299e1;
        }

        .route-timeline__count {
          font-size: 12px;
          color: #718096;
          padding: 2px 10px;
          background: #f7fafc;
          border-radius: 12px;
        }

        .route-timeline__list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .route-timeline__item {
          display: flex;
          gap: 14px;
          padding: 12px 14px;
          border-radius: 10px;
          background: #fafbfc;
          border: 1px solid #edf2f7;
          cursor: pointer;
          transition: all 0.2s;
        }

        .route-timeline__item:hover {
          background: #f7fafc;
          border-color: #e2e8f0;
        }

        .route-timeline__item--high {
          border-left: 4px solid #e53e3e;
          background: rgba(229, 62, 62, 0.03);
        }

        .route-timeline__item--moderate {
          border-left: 4px solid #ecc94b;
          background: rgba(236, 201, 75, 0.03);
        }

        .route-timeline__item--safe {
          border-left: 4px solid #48bb78;
          background: rgba(72, 187, 120, 0.03);
        }

        .route-timeline__item--high:hover {
          background: rgba(229, 62, 62, 0.06);
        }

        .route-timeline__item--moderate:hover {
          background: rgba(236, 201, 75, 0.06);
        }

        .route-timeline__item--safe:hover {
          background: rgba(72, 187, 120, 0.06);
        }

        .route-timeline__step {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
        }

        .route-timeline__step-badge {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 13px;
          flex-shrink: 0;
        }

        .badge-high {
          background: #e53e3e;
          color: white;
        }

        .badge-moderate {
          background: #ecc94b;
          color: #000;
        }

        .badge-safe {
          background: #48bb78;
          color: white;
        }

        .route-timeline__step-line {
          width: 2px;
          flex: 1;
          background: #e2e8f0;
          margin: 4px 0;
          min-height: 20px;
        }

        .route-timeline__content {
          flex: 1;
          min-width: 0;
        }

        .route-timeline__content-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 6px;
          flex-wrap: wrap;
        }

        .route-timeline__content-info {
          flex: 1;
          min-width: 0;
        }

        .route-timeline__title-text {
          font-size: 14px;
          font-weight: 600;
          color: #2d3748;
          margin: 0;
        }

        .route-timeline__subtitle {
          font-size: 12px;
          color: #718096;
          display: block;
        }

        .route-timeline__content-badges {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .route-timeline__aqi-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 12px;
          border: 1px solid;
        }

        .route-timeline__risk-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 12px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .route-timeline__risk-badge--high {
          background: rgba(229, 62, 62, 0.1);
          color: #e53e3e;
        }

        .route-timeline__risk-badge--moderate {
          background: rgba(236, 201, 75, 0.1);
          color: #975a16;
        }

        .route-timeline__risk-badge--safe {
          background: rgba(72, 187, 120, 0.1);
          color: #276749;
        }

        .route-timeline__expand-btn {
          background: none;
          border: none;
          color: #a0aec0;
          cursor: pointer;
          padding: 2px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .route-timeline__expand-btn:hover {
          background: #edf2f7;
          color: #4a5568;
        }

        .route-timeline__directive {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.02);
          border-radius: 6px;
          margin-top: 4px;
        }

        .route-timeline__directive-icon {
          font-size: 16px;
          flex-shrink: 0;
        }

        .route-timeline__directive-text {
          font-size: 13px;
          color: #4a5568;
          line-height: 1.5;
          margin: 0;
        }

        .route-timeline__details {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #edf2f7;
        }

        .route-timeline__details-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .route-timeline__detail {
          display: flex;
          flex-direction: column;
          padding: 6px 10px;
          background: #f7fafc;
          border-radius: 6px;
        }

        .route-timeline__detail-label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: #718096;
        }

        .route-timeline__detail-value {
          font-size: 13px;
          font-weight: 500;
          color: #2d3748;
        }

        .route-timeline__recommendation {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 10px 12px;
          background: #ebf8ff;
          border-radius: 6px;
          margin-top: 8px;
          border: 1px solid #bee3f8;
        }

        .route-timeline__recommendation-icon {
          font-size: 16px;
          flex-shrink: 0;
        }

        .route-timeline__recommendation-label {
          font-size: 12px;
          font-weight: 600;
          color: #2b6cb0;
        }

        .route-timeline__recommendation-text {
          font-size: 13px;
          color: #2c5282;
          margin: 0;
          line-height: 1.5;
        }

        .route-timeline__show-more {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          padding: 8px;
          margin-top: 8px;
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          color: #4a5568;
          cursor: pointer;
          transition: all 0.2s;
        }

        .route-timeline__show-more:hover {
          background: #edf2f7;
          border-color: #cbd5e0;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .route-timeline {
            padding: 12px 16px;
          }

          .route-timeline__item {
            padding: 10px 12px;
            gap: 10px;
          }

          .route-timeline__content-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .route-timeline__content-badges {
            width: 100%;
          }

          .route-timeline__details-grid {
            grid-template-columns: 1fr 1fr;
          }

          .route-timeline__title-text {
            font-size: 13px;
          }

          .route-timeline__directive-text {
            font-size: 12px;
          }
        }

        @media (max-width: 480px) {
          .route-timeline__step-badge {
            width: 28px;
            height: 28px;
            font-size: 11px;
          }

          .route-timeline__details-grid {
            grid-template-columns: 1fr;
          }

          .route-timeline__content-badges {
            flex-wrap: wrap;
          }

          .route-timeline__aqi-badge {
            font-size: 10px;
          }

          .route-timeline__risk-badge {
            font-size: 9px;
          }
        }
      `}</style>
    </div>
  );
}