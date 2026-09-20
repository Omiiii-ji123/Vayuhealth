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
  const [origin, setOrigin] = useState('Anand Vihar, Delhi');
  const [destination, setDestination] = useState('Connaught Place / ITO');
  const [originInput, setOriginInput] = useState('Anand Vihar, Delhi');
  const [destInput, setDestInput] = useState('Connaught Place / ITO');
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

  const ROUTE_PRESETS = [
    { label: '🏛️ Delhi: Anand Vihar ➔ Connaught Place', origin: 'Anand Vihar, Delhi', dest: 'Connaught Place / ITO' },
    { label: '🏛️ Delhi: Rohini ➔ Dwarka Sector 8', origin: 'Rohini Sector 16', dest: 'Dwarka Sector 8' },
    { label: '🏛️ Delhi NCR: Noida Sec 62 ➔ RK Puram', origin: 'Noida Sector 62', dest: 'R.K. Puram, Delhi' },
    { label: '🌊 Maharashtra: Dombivli ➔ BKC Mumbai', origin: 'Dombivli', dest: 'BKC, Mumbai' },
    { label: '🌊 Maharashtra: Thane ➔ Kalyan', origin: 'Thane Majiwada', dest: 'Kalyan Khadakpada' },
  ];

  // Calculate route
  const calculateRoute = useCallback(async (customOrigin, customDest) => {
    const o = customOrigin || origin;
    const d = customDest || destination;

    if (!o?.trim() || !d?.trim()) {
      setError('Please enter both origin and destination');
      return;
    }

    if (o.trim().toLowerCase() === d.trim().toLowerCase()) {
      setError('Origin and destination cannot be the same');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate API calculation delay
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const route = generateSafeRoute(o, d);
      setRouteData(route);
      setExpanded(true);
    } catch (err) {
      setError(err.message || 'Failed to calculate route. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [origin, destination]);

  // Initial calculation on mount
  useEffect(() => {
    calculateRoute('Anand Vihar, Delhi', 'Connaught Place / ITO');
  }, []);

  const handleSelectPreset = (preset) => {
    setOrigin(preset.origin);
    setOriginInput(preset.origin);
    setDestination(preset.dest);
    setDestInput(preset.dest);
    calculateRoute(preset.origin, preset.dest);
  };

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
          {/* Quick Preset Route Selector */}
          <div className="route-presets-container">
            <span className="route-presets-title">⚡ Quick Corridor Presets:</span>
            <div className="route-presets-chips">
              {ROUTE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`route-preset-chip ${origin === preset.origin && destination === preset.dest ? 'route-preset-chip--active' : ''}`}
                  onClick={() => handleSelectPreset(preset)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

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
                  placeholder="e.g. Anand Vihar, Delhi"
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
                  placeholder="e.g. Connaught Place / ITO, Delhi"
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
          background: var(--color-bg-primary, #ffffff);
          border: 1px solid var(--color-border, #e2e8f0);
          border-left: 4px solid #10b981;
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          color: var(--color-text-primary, #1e293b);
          width: 100%;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
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
          background: rgba(16, 185, 129, 0.12);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #10b981;
        }

        .safest-route__title {
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0;
          color: var(--color-text-primary, #1e293b);
        }

        .safest-route__subtitle {
          font-size: 0.85rem;
          color: var(--color-text-secondary, #64748b);
          margin: 2px 0 0 0;
        }

        .safest-route__toggle {
          background: var(--color-bg-secondary, #f1f5f9);
          border: 1px solid var(--color-border, #e2e8f0);
          color: var(--color-text-secondary, #64748b);
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
          background: var(--color-bg-hover, #e2e8f0);
          color: var(--color-text-primary, #1e293b);
        }

        .safest-route__body {
          margin-top: 1.2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        /* Route Presets */
        .route-presets-container {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .route-presets-title {
          font-size: 0.72rem;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .route-presets-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .route-preset-chip {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #cbd5e1;
          padding: 5px 10px;
          border-radius: 6px;
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .route-preset-chip:hover {
          background: rgba(56, 189, 248, 0.15);
          border-color: #38bdf8;
          color: #ffffff;
        }

        .route-preset-chip--active {
          background: #10b981 !important;
          border-color: #10b981 !important;
          color: #ffffff !important;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.35);
        }

        /* Search Bar */
        .safest-route__search {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          background: var(--color-bg-secondary, #f8fafc);
          padding: 14px;
          border-radius: 12px;
          border: 1px solid var(--color-border, #e2e8f0);
        }

        .safest-route__search-group {
          flex: 1;
          min-width: 180px;
        }

        .safest-route__search-label {
          display: block;
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--color-text-secondary, #64748b);
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
          border: 1px solid var(--color-border, #cbd5e1);
          background: var(--color-bg-primary, #ffffff);
          color: var(--color-text-primary, #1e293b);
          font-size: 0.85rem;
          transition: all 0.2s;
        }

        .safest-route__search-input:focus {
          outline: none;
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
        }

        .safest-route__search-input::placeholder {
          color: var(--color-text-secondary, #94a3b8);
        }

        .safest-route__suggestions {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          background: var(--color-bg-primary, #ffffff);
          border: 1px solid var(--color-border, #e2e8f0);
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
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
          color: var(--color-text-primary, #334155);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .safest-route__suggestion:hover {
          background: var(--color-bg-hover, #f1f5f9);
          color: var(--color-primary, #10b981);
        }

        .safest-route__search-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 20px;
          background: linear-gradient(135deg, #10b981, #06b6d4);
          color: #ffffff;
          font-weight: 700;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          align-self: flex-end;
          height: 40px;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
        }

        .safest-route__search-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(16, 185, 129, 0.35);
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
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid #ef4444;
          border-radius: 8px;
          color: #dc2626;
          font-size: 14px;
        }

        /* Risk Summary */
        .safest-route__risk-summary {
          padding: 14px 16px;
          background: var(--color-bg-secondary, #f8fafc);
          border-radius: 10px;
          border: 1px solid var(--color-border, #e2e8f0);
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
          color: var(--color-text-primary, #334155);
          margin: 0 0 12px 0;
        }

        .safest-route__recommendations {
          padding-top: 12px;
          border-top: 1px solid var(--color-border, #e2e8f0);
        }

        .safest-route__recommendations-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-secondary, #64748b);
          margin: 0 0 6px 0;
        }

        .safest-route__recommendations-list {
          margin: 0;
          padding-left: 20px;
          color: var(--color-text-primary, #475569);
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
          background: var(--color-bg-secondary, #f8fafc);
          border: 1px solid var(--color-border, #e2e8f0);
          border-bottom: none;
          border-radius: 12px 12px 0 0;
        }

        .safest-route__map-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-primary, #1e293b);
        }

        .safest-route__map-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 6px;
          color: #10b981;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .safest-route__map-btn:hover {
          background: rgba(16, 185, 129, 0.2);
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