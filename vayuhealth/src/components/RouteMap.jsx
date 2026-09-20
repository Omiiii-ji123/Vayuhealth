import { useEffect, useRef, useState, Fragment } from 'react';
import { 
  MapPin, 
  Navigation, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  ZoomIn, 
  ZoomOut, 
  Layers, 
  Target 
} from 'lucide-react';

// Import Leaflet
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, Tooltip, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map Resizer component to ensure Leaflet recalculates size when route is calculated
function MapResizer({ waypoints }) {
  const map = useMap();
  useEffect(() => {
    const t1 = setTimeout(() => {
      map.invalidateSize();
      if (waypoints && waypoints.length > 1) {
        const bounds = L.latLngBounds(waypoints.map(w => [w.lat, w.lng]));
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
      }
    }, 100);
    const t2 = setTimeout(() => {
      map.invalidateSize();
    }, 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map, waypoints]);
  return null;
}

// Custom marker icons based on risk level
const getWaypointIcon = (riskLevel, isStart, isEnd) => {
  let color;
  let symbol;
  
  if (isStart) {
    color = '#48bb78';
    symbol = '🚩';
  } else if (isEnd) {
    color = '#4299e1';
    symbol = '🏁';
  } else {
    switch(riskLevel) {
      case 'high':
        color = '#e53e3e';
        symbol = '🔴';
        break;
      case 'moderate':
        color = '#ecc94b';
        symbol = '🟡';
        break;
      case 'safe':
        color = '#48bb78';
        symbol = '🟢';
        break;
      default:
        color = '#48bb78';
        symbol = '🟢';
    }
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="14" fill="${color}" stroke="#ffffff" stroke-width="2.5" opacity="0.95"/>
      <text x="16" y="21" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="bold">${symbol}</text>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'custom-waypoint-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

// Route Polyline Component
function RoutePolyline({ waypoints }) {
  if (!waypoints || waypoints.length < 2) return null;
  const positions = waypoints.map(w => [w.lat, w.lng]);

  return (
    <>
      <Polyline
        positions={positions}
        pathOptions={{
          color: '#10b981',
          weight: 4,
          opacity: 0.9,
          dashArray: '8, 8',
        }}
      />
      <Polyline
        positions={positions}
        pathOptions={{
          color: '#059669',
          weight: 2,
          opacity: 1,
        }}
      />
    </>
  );
}

export default function RouteMap({ waypoints = [], className = '', height = '500px', onWaypointClick, showControls = true }) {
  const mapRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);

  // Default center (India or first waypoint)
  const defaultCenter = (waypoints && waypoints.length > 0 && waypoints[0]?.lat)
    ? [waypoints[0].lat, waypoints[0].lng]
    : [20.5937, 78.9629];

  // Handle map ready state
  useEffect(() => {
    setIsMapReady(true);
  }, []);

  // Get risk color for circle
  const getRiskColor = (riskLevel) => {
    switch(riskLevel) {
      case 'high': return '#e53e3e';
      case 'moderate': return '#ecc94b';
      case 'safe': return '#48bb78';
      default: return '#48bb78';
    }
  };

  // Get risk radius
  const getRiskRadius = (riskLevel) => {
    switch(riskLevel) {
      case 'high': return 1500;
      case 'moderate': return 1000;
      case 'safe': return 500;
      default: return 500;
    }
  };

  if (!waypoints || waypoints.length === 0) {
    return (
      <div className={`route-map ${className}`} style={{ height }}>
        <div className="route-map__empty">
          <Navigation size={32} />
          <p>No route to display</p>
          <span>Generate a route to see it on the map</span>
        </div>
        <style jsx>{`
          .route-map {
            width: 100%;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            background: #f7fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }

          .route-map__empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            color: #a0aec0;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`route-map ${className}`} style={{ height }}>
      <div className="route-map__container">
        {/* Satellite Indicator Badge on Map */}
        <div className="route-map-satellite-badge">
          🛰️ Satellite Route Surveillance
        </div>

        {isMapReady ? (
          <MapContainer
            key="route-satellite-map"
            center={defaultCenter}
            zoom={8}
            className="route-leaflet-map"
            zoomControl={false}
            ref={mapRef}
            whenReady={() => {
              if (mapRef.current) {
                setMapInstance(mapRef.current);
              }
            }}
          >
            <ZoomControl position="bottomright" />
            <MapResizer waypoints={waypoints} />
            
            {/* Satellite Imagery Base Layer */}
            <TileLayer
              attribution='&copy; Esri, Maxar, Earthstar Geographics'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />

            {/* Geographic Place Names & State Boundaries Layer */}
            <TileLayer
              attribution='&copy; Esri'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />

            {/* Route Polyline */}
            <RoutePolyline waypoints={waypoints} />

            {/* Waypoint Markers with Permanent Region Labels */}
            {waypoints.map((waypoint, index) => {
              const isStart = index === 0;
              const isEnd = index === waypoints.length - 1;
              const markerIcon = getWaypointIcon(waypoint.riskLevel, isStart, isEnd);
              const riskColor = getRiskColor(waypoint.riskLevel);
              const riskRadius = getRiskRadius(waypoint.riskLevel);

              return (
                <Fragment key={`wp-${index}-${waypoint.lat}-${waypoint.lng}`}>
                  {/* Risk Circle */}
                  <Circle
                    center={[waypoint.lat, waypoint.lng]}
                    radius={riskRadius}
                    pathOptions={{
                      color: riskColor,
                      fillColor: riskColor,
                      fillOpacity: 0.12,
                      weight: 1.5,
                      opacity: 0.6,
                    }}
                  />

                  {/* Marker */}
                  <Marker
                    position={[waypoint.lat, waypoint.lng]}
                    icon={markerIcon}
                    eventHandlers={{
                      click: () => onWaypointClick?.(index)
                    }}
                  >
                    <Tooltip permanent direction="top" offset={[0, -18]} className="waypoint-name-tooltip">
                      <div className="waypoint-tooltip-badge">
                        <span className="waypoint-tooltip-title">
                          {isStart ? '🚩 Start: ' : isEnd ? '🏁 Dest: ' : ''}{waypoint.title}
                        </span>
                        <span className="waypoint-tooltip-aqi" style={{ backgroundColor: riskColor }}>
                          AQI {waypoint.aqi}
                        </span>
                      </div>
                    </Tooltip>

                    <Popup>
                      <div className="route-map-popup">
                        <div className="route-map-popup__header">
                          <span className="route-map-popup__step">
                            {isStart ? '🚩 Start' : isEnd ? '🏁 End' : `Step ${waypoint.step}`}
                          </span>
                          <span 
                            className={`route-map-popup__risk route-map-popup__risk--${waypoint.riskLevel}`}
                          >
                            {waypoint.riskLevel.toUpperCase()}
                          </span>
                        </div>
                        <h4 className="route-map-popup__title">{waypoint.title}</h4>
                        <div className="route-map-popup__aqi">
                          <span>AQI: </span>
                          <strong style={{ color: getRiskColor(waypoint.riskLevel) }}>
                            {waypoint.aqi}
                          </strong>
                        </div>
                        <p className="route-map-popup__directive">{waypoint.directive}</p>
                      </div>
                    </Popup>
                  </Marker>
                </Fragment>
              );
            })}
          </MapContainer>
        ) : (
          <div className="route-map__loading">
            <div className="route-map__loading-spinner" />
            <p>Loading map...</p>
          </div>
        )}

        {/* Controls */}
        {showControls && (
          <div className="route-map__controls">
            <button 
              className="route-map__control-btn" 
              title="Zoom In"
              onClick={() => {
                if (mapRef.current) {
                  const map = mapRef.current;
                  map.zoomIn();
                }
              }}
            >
              <ZoomIn size={16} />
            </button>
            <button 
              className="route-map__control-btn" 
              title="Zoom Out"
              onClick={() => {
                if (mapRef.current) {
                  const map = mapRef.current;
                  map.zoomOut();
                }
              }}
            >
              <ZoomOut size={16} />
            </button>
            <button 
              className="route-map__control-btn" 
              title="Fit Route"
              onClick={() => {
                if (mapRef.current && waypoints.length > 0) {
                  const map = mapRef.current;
                  const latLngs = waypoints.map(w => [w.lat, w.lng]);
                  const bounds = L.latLngBounds(latLngs);
                  map.fitBounds(bounds, { padding: [50, 50] });
                }
              }}
            >
              <Target size={16} />
            </button>
            <button 
              className="route-map__control-btn" 
              title="Refresh"
              onClick={() => {
                if (mapRef.current) {
                  mapRef.current.invalidateSize();
                }
              }}
            >
              <RefreshCw size={16} />
            </button>
          </div>
        )}

        {/* Legend */}
        <div className="route-map__legend">
          <div className="route-map__legend-item">
            <span className="route-map__legend-dot route-map__legend-dot--high" />
            <span className="route-map__legend-label">High Risk</span>
          </div>
          <div className="route-map__legend-item">
            <span className="route-map__legend-dot route-map__legend-dot--moderate" />
            <span className="route-map__legend-label">Moderate Risk</span>
          </div>
          <div className="route-map__legend-item">
            <span className="route-map__legend-dot route-map__legend-dot--safe" />
            <span className="route-map__legend-label">Safe</span>
          </div>
          <div className="route-map__legend-item">
            <span className="route-map__legend-line" />
            <span className="route-map__legend-label">Route Path</span>
          </div>
        </div>

        {/* Info */}
        <div className="route-map__info">
          <span className="route-map__info-text">
            {waypoints.length} waypoints • {waypoints.filter(w => w.riskLevel === 'high').length} high risk zones
          </span>
        </div>
      </div>

      <style jsx>{`
        .route-map {
          width: 100%;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          background: #090d16;
          position: relative;
        }

        .route-map__container {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .route-leaflet-map {
          width: 100%;
          height: 100%;
        }

        .route-map__loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 12px;
          color: #94a3b8;
        }

        .route-map__loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(0, 242, 254, 0.1);
          border-top-color: #00f2fe;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .route-map__controls {
          position: absolute;
          right: 12px;
          top: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          z-index: 1000;
        }

        .route-map__control-btn {
          width: 34px;
          height: 34px;
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          color: #94a3b8;
        }

        .route-map__control-btn:hover {
          background: rgba(0, 242, 254, 0.15);
          border-color: #00f2fe;
          color: #00f2fe;
          transform: scale(1.05);
        }

        .route-map-satellite-badge {
          position: absolute;
          top: 14px;
          right: 14px;
          display: inline-flex;
          align-items: center;
          background: rgba(15, 23, 42, 0.92);
          backdrop-filter: blur(4px);
          padding: 5px 12px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #38bdf8;
          font-size: 11px;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
          z-index: 1000;
        }

        /* Permanent Waypoint Name Tooltip on Satellite Map */
        :global(.waypoint-name-tooltip) {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }

        :global(.waypoint-name-tooltip::before) {
          display: none !important;
        }

        :global(.waypoint-tooltip-badge) {
          display: inline-flex;
          align-items: center;
          background: rgba(15, 23, 42, 0.92);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 6px;
          padding: 2px 7px;
          gap: 5px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          pointer-events: none;
        }

        :global(.waypoint-tooltip-title) {
          font-size: 11px;
          font-weight: 700;
          color: #ffffff;
          white-space: nowrap;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
        }

        :global(.waypoint-tooltip-aqi) {
          font-size: 10px;
          font-weight: 800;
          color: #ffffff;
          padding: 1px 5px;
          border-radius: 4px;
        }

        .route-map__legend {
          position: absolute;
          bottom: 20px;
          left: 20px;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(4px);
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 8px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          z-index: 1000;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .route-map__legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: #334155;
        }

        .route-map__legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.2);
          flex-shrink: 0;
        }

        .route-map__legend-dot--high {
          background: #e53e3e;
        }

        .route-map__legend-dot--moderate {
          background: #ecc94b;
        }

        .route-map__legend-dot--safe {
          background: #48bb78;
        }

        .route-map__legend-line {
          width: 20px;
          height: 3px;
          background: #00f2fe;
          border-radius: 2px;
          flex-shrink: 0;
        }

        .route-map__legend-label {
          font-size: 11px;
          color: #cbd5e1;
        }

        .route-map__info {
          position: absolute;
          bottom: 20px;
          right: 20px;
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 6px 12px;
          z-index: 1000;
        }

        .route-map__info-text {
          font-size: 11px;
          color: #94a3b8;
        }

        /* Popup Styles */
        .route-map-popup {
          padding: 4px;
          min-width: 200px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .route-map-popup__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .route-map-popup__step {
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
        }

        .route-map-popup__risk {
          font-size: 10px;
          font-weight: 700;
          padding: 1px 8px;
          border-radius: 10px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .route-map-popup__risk--high {
          background: rgba(229, 62, 62, 0.2);
          color: #e53e3e;
        }

        .route-map-popup__risk--moderate {
          background: rgba(236, 201, 75, 0.2);
          color: #ecc94b;
        }

        .route-map-popup__risk--safe {
          background: rgba(72, 187, 120, 0.2);
          color: #48bb78;
        }

        .route-map-popup__title {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 4px 0;
          color: #fff;
        }

        .route-map-popup__aqi {
          font-size: 13px;
          color: #94a3b8;
          margin-bottom: 4px;
        }

        .route-map-popup__aqi strong {
          font-size: 16px;
        }

        .route-map-popup__directive {
          font-size: 12px;
          color: #cbd5e1;
          line-height: 1.4;
          margin: 0;
        }

        /* Leaflet Popup Overrides */
        :global(.leaflet-popup-content-wrapper) {
          background: #0f172a !important;
          color: #fff !important;
          border: 1px solid rgba(0, 242, 254, 0.3) !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6) !important;
        }

        :global(.leaflet-popup-tip) {
          background: #0f172a !important;
        }

        :global(.leaflet-popup-close-button) {
          color: #94a3b8 !important;
        }

        :global(.leaflet-control-zoom) {
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 8px !important;
          overflow: hidden !important;
        }

        :global(.leaflet-control-zoom a) {
          background: rgba(15, 23, 42, 0.9) !important;
          color: #94a3b8 !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }

        :global(.leaflet-control-zoom a:hover) {
          background: rgba(0, 242, 254, 0.15) !important;
          color: #00f2fe !important;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .route-map__legend {
            display: none;
          }

          .route-map__info {
            bottom: 12px;
            right: 12px;
          }

          .route-map__controls {
            right: 8px;
            top: 8px;
          }

          .route-map__control-btn {
            width: 30px;
            height: 30px;
          }
        }

        @media (max-width: 480px) {
          .route-map-popup {
            min-width: 150px;
          }

          .route-map-popup__title {
            font-size: 12px;
          }

          .route-map-popup__directive {
            font-size: 11px;
          }

          .route-map__info-text {
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
}