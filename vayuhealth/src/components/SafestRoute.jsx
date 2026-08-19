import { useState, useEffect, useCallback } from 'react';
import { 
  Route, 
  MapPin, 
  Flag, 
  Navigation, 
  Search,
  RefreshCw,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wind,
  Gauge,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Globe,
  Layers,
  Maximize2,
  Target
} from 'lucide-react';

import RouteSummary from './RouteSummary';
import RouteTimeline from './RouteTimeline';
import RouteMap from './RouteMap';
import { 
  generateSafeRoute, 
  getRouteRecommendations,
  calculateDistanceKm,
  getAQIForLocation,
  getRiskLevel
} from '../utils/routeUtils';
import indiaLocations from '../data/indiaLocations';

export default function SafestRoute({ className = '' }) {
  const [origin, setOrigin] = useState('Dombivli');
  const [destination, setDestination] = useState('BKC, Mumbai');
  const [originInput, setOriginInput] = useState('Dombivli');
  const [destInput, setDestInput] = useState('BKC, Mumbai');
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const [selectedWaypoint, setSelectedWaypoint] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);

  // Location suggestions
  const locationNames = indiaLocations.map(loc => loc.name);

  // Handle origin input change with suggestions
  const handleOriginChange = (value) => {
    setOriginInput(value);
    if (value.length > 1) {
      const suggestions = locationNames
        .filter(name => name.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5);
      setOriginSuggestions(suggestions);
      setShowSuggestions(true);
    } else {
      setOriginSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle destination input change with suggestions
  const handleDestChange = (value) => {
    setDestInput(value);
    if (value.length > 1) {
      const suggestions = locationNames
        .filter(name => name.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5);
      setDestSuggestions(suggestions);
      setShowSuggestions(true);
    } else {
      setDestSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Select suggestion for origin
  const selectOriginSuggestion = (name) => {
    setOriginInput(name);
    setOrigin(name);
    setOriginSuggestions([]);
    setShowSuggestions(false);
  };

  // Select suggestion for destination
  const selectDestSuggestion = (name) => {
    setDestInput(name);
    setDestination(name);
    setDestSuggestions([]);
    setShowSuggestions(false);
  };

  // Calculate route
  const calculateRoute = useCallback(async () => {
    if (!origin.trim() || !destination.trim()) {
      setError('Please enter both origin and destination');
      return;
    }

    if (origin.trim().toLowerCase() === destination.trim().toLowerCase()) {
      setError('Origin and destination cannot be the same');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const route = generateSafeRoute(origin, destination);
      setRouteData(route);
      setExpanded(true);
    } catch (err) {
      setError(err.message || 'Failed to calculate route. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [origin, destination]);

  // Handle waypoint click on map
  const handleWaypointClick = (index) => {
    setSelectedWaypoint(index);
    // Scroll to the waypoint in timeline
    const timelineItems = document.querySelectorAll('.route-timeline__item');
    if (timelineItems[index]) {
      timelineItems[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Get route recommendations
  const recommendations = routeData ? getRouteRecommendations(routeData.metrics.maxAQI) : [];

  // Check if route has high risk
  const hasHighRisk = routeData?.waypoints?.some(w => w.riskLevel === 'high') || false;
  const hasModerateRisk = routeData?.waypoints?.some(w => w.riskLevel === 'moderate') || false;

  // Get risk summary
  const getRiskSummary = () => {
    if (hasHighRisk) {
      return {
        icon: AlertTriangle,
        color: '#e53e3e',
        label: 'High Risk Route',
        description: 'Contains hazardous air quality zones. Take precautions.'
      };
    }
    if (hasModerateRisk) {
      return {
        icon: AlertTriangle,
        color: '#ecc94b',
        label: 'Moderate Risk Route',
        description: 'Some areas have elevated pollution. Sensitive groups should take care.'
      };
    }
    return {
      icon: CheckCircle,
      color: '#48bb78',
      label: 'Safe Route',
      description: 'Good air quality throughout the route. Enjoy your journey!'
    };
  };

  const riskSummary = routeData ? getRiskSummary() : null;

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && (e.target.tagName !== 'INPUT')) {
        calculateRoute();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [calculateRoute]);

  return (
    <div className={`safest-route ${className}`}>
      {/* Header */}
      <div className="safest-route__header">
        <div className="safest-route__header-left">
          <div className="safest-route__icon">
            <Route size={20} />
          </div>
          <div>
            <h3 className="safest-route__title">
              🛣️ Safe Health Navigation Roadmap
            </h3>
            <p className="safest-route__subtitle">
              Plan your outdoor trip with step-by-step health directives to avoid hazardous AQI zones
            </p>
          </div>
        </div>
        <button 
          className="safest-route__toggle"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {expanded && (
        <div className="safest-route__body">
          {/* Search Bar */}
          <div className="safest-route__search">
            <div className="safest-route__search-group">
              <label className="safest-route__search-label">
                <MapPin size={14} />
                Start Location (Origin)
              </label>
              <div className="safest-route__search-input-wrapper">
                <input
                  type="text"
                  value={originInput}
                  onChange={(e) => handleOriginChange(e.target.value)}
                  placeholder="e.g. Dombivli, Thane"
                  className="safest-route__search-input"
                />
                {originSuggestions.length > 0 && (
                  <div className="safest-route__suggestions">
                    {originSuggestions.map((name, idx) => (
                      <button
                        key={idx}
                        className="safest-route__suggestion"
                        onClick={() => selectOriginSuggestion(name)}
                      >
                        <MapPin size={12} />
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="safest-route__search-group">
              <label className="safest-route__search-label">
                <Flag size={14} />
                Outdoor Destination
              </label>
              <div className="safest-route__search-input-wrapper">
                <input
                  type="text"
                  value={destInput}
                  onChange={(e) => handleDestChange(e.target.value)}
                  placeholder="e.g. Central Park, BKC"
                  className="safest-route__search-input"
                />
                {destSuggestions.length > 0 && (
                  <div className="safest-route__suggestions">
                    {destSuggestions.map((name, idx) => (
                      <button
                        key={idx}
                        className="safest-route__suggestion"
                        onClick={() => selectDestSuggestion(name)}
                      >
                        <Flag size={12} />
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button 
              className="safest-route__search-btn"
              onClick={calculateRoute}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Search size={16} />
                  Calculate Safe Route
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="safest-route__error">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          {/* Route Summary */}
          {routeData && (
            <RouteSummary 
              metrics={routeData.metrics}
              origin={routeData.origin}
              destination={routeData.destination}
            />
          )}

          {/* Risk Summary & Recommendations */}
          {routeData && riskSummary && (
            <div className="safest-route__risk-summary">
              <div className="safest-route__risk-badge" style={{ borderColor: riskSummary.color }}>
                <riskSummary.icon size={18} style={{ color: riskSummary.color }} />
                <span style={{ color: riskSummary.color }}>{riskSummary.label}</span>
              </div>
              <p className="safest-route__risk-description">{riskSummary.description}</p>
              
              {recommendations.length > 0 && (
                <div className="safest-route__recommendations">
                  <h4 className="safest-route__recommendations-title">
                    <Shield size={14} />
                    Travel Recommendations
                  </h4>
                  <ul className="safest-route__recommendations-list">
                    {recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Route Map */}
          {routeData && (
            <div className="safest-route__map-wrapper">
              <div className="safest-route__map-header">
                <span className="safest-route__map-title">
                  <Globe size={16} />
                  Route Map & Health Navigation Directives
                </span>
                <button 
                  className="safest-route__map-btn"
                  onClick={() => {
                    // This could open a fullscreen map modal
                    console.log('Open fullscreen map');
                  }}
                >
                  <Maximize2 size={14} />
                  View Fullscreen
                </button>
              </div>
              <RouteMap 
                waypoints={routeData.waypoints}
                onWaypointClick={handleWaypointClick}
                height={380}
              />
            </div>
          )}

          {/* Route Timeline */}
          {routeData && (
            <RouteTimeline 
              waypoints={routeData.waypoints}
              onWaypointClick={handleWaypointClick}
            />
          )}
        </div>
      )}

      <style jsx>{`
        .safest-route {
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(0, 242, 254, 0.25);
          border-left: 4px solid #00e676;
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          color: #fff;
          width: 100%;
        }

        .safest-route__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .safest-route__header-left {
          display: flex;
          gap: 12px;
          flex: 1;
        }

        .safest-route__icon {
          width: 40px;
          height: 40px;
          background: rgba(0, 242, 254, 0.15);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #00f2fe;
        }

        .safest-route__title {
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0;
          color: #fff;
        }

        .safest-route__subtitle {
          font-size: 0.85rem;
          color: #94a3b8;
          margin: 2px 0 0 0;
        }

        .safest-route__toggle {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94a3b8;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .safest-route__toggle:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .safest-route__body {
          margin-top: 1.2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        /* Search Bar */
        .safest-route__search {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          background: rgba(0, 0, 0, 0.3);
          padding: 14px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .safest-route__search-group {
          flex: 1;
          min-width: 180px;
        }

        .safest-route__search-label {
          display: block;
          font-size: 0.72rem;
          font-weight: 700;
          color: #94a3b8;
          margin-bottom: 4px;
        }

        .safest-route__search-label svg {
          display: inline;
          margin-right: 4px;
        }

        .safest-route__search-input-wrapper {
          position: relative;
        }

        .safest-route__search-input {
          width: 100%;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          font-size: 0.85rem;
          transition: all 0.2s;
        }

        .safest-route__search-input:focus {
          outline: none;
          border-color: #00f2fe;
          box-shadow: 0 0 0 3px rgba(0, 242, 254, 0.1);
          background: rgba(255, 255, 255, 0.08);
        }

        .safest-route__search-input::placeholder {
          color: #64748b;
        }

        .safest-route__suggestions {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          background: #1a2332;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          overflow: hidden;
          z-index: 50;
          max-height: 200px;
          overflow-y: auto;
        }

        .safest-route__suggestion {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          width: 100%;
          background: none;
          border: none;
          color: #cbd5e1;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safest-route__suggestion:hover {
          background: rgba(0, 242, 254, 0.1);
          color: #fff;
        }

        .safest-route__search-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 20px;
          background: linear-gradient(135deg, #00e676, #00f2fe);
          color: #000;
          font-weight: 700;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          align-self: flex-end;
          height: 40px;
        }

        .safest-route__search-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0, 230, 118, 0.3);
        }

        .safest-route__search-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Error */
        .safest-route__error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: rgba(229, 62, 62, 0.1);
          border: 1px solid #e53e3e;
          border-radius: 8px;
          color: #fc8181;
          font-size: 14px;
        }

        /* Risk Summary */
        .safest-route__risk-summary {
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .safest-route__risk-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 4px 14px;
          border: 1px solid;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .safest-route__risk-description {
          font-size: 14px;
          color: #cbd5e1;
          margin: 0 0 12px 0;
        }

        .safest-route__recommendations {
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .safest-route__recommendations-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #94a3b8;
          margin: 0 0 6px 0;
        }

        .safest-route__recommendations-list {
          margin: 0;
          padding-left: 20px;
          color: #cbd5e1;
          font-size: 13px;
          line-height: 1.6;
        }

        .safest-route__recommendations-list li {
          margin-bottom: 2px;
        }

        /* Map Wrapper */
        .safest-route__map-wrapper {
          border-radius: 12px;
          overflow: hidden;
        }

        .safest-route__map-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-bottom: none;
          border-radius: 12px 12px 0 0;
        }

        .safest-route__map-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #cbd5e1;
        }

        .safest-route__map-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          background: rgba(0, 242, 254, 0.1);
          border: 1px solid rgba(0, 242, 254, 0.2);
          border-radius: 6px;
          color: #00f2fe;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safest-route__map-btn:hover {
          background: rgba(0, 242, 254, 0.2);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .safest-route {
            padding: 1.2rem;
          }
        }

        @media (max-width: 768px) {
          .safest-route {
            padding: 1rem;
          }

          .safest-route__header-left {
            gap: 8px;
          }

          .safest-route__title {
            font-size: 1rem;
          }

          .safest-route__subtitle {
            font-size: 0.78rem;
          }

          .safest-route__search {
            flex-direction: column;
          }

          .safest-route__search-group {
            min-width: 100%;
          }

          .safest-route__search-btn {
            width: 100%;
            justify-content: center;
            align-self: stretch;
          }

          .safest-route__map-header {
            flex-direction: column;
            gap: 6px;
            align-items: flex-start;
          }

          .safest-route__map-btn {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .safest-route {
            padding: 0.75rem;
          }

          .safest-route__header-left {
            flex-direction: column;
          }

          .safest-route__icon {
            display: none;
          }

          .safest-route__title {
            font-size: 0.95rem;
          }

          .safest-route__search {
            padding: 10px;
          }

          .safest-route__search-input {
            font-size: 14px;
          }

          .safest-route__risk-badge {
            font-size: 12px;
          }

          .safest-route__risk-description {
            font-size: 13px;
          }

          .safest-route__recommendations-list {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}