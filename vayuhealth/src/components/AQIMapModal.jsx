import { useEffect, useRef, useState } from 'react';
import { X, MapPin, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

// Leaflet imports
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map Resizer component to ensure Leaflet recalculates dimensions when modal opens
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const t1 = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    const t2 = setTimeout(() => {
      map.invalidateSize();
    }, 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map]);
  return null;
}

// India location data
const INDIA_LOCATIONS = [
  // Delhi NCR (Primary Focus - CPCB / MoEFCC)
  { name: "Anand Vihar, Delhi", state: "Delhi", lat: 28.6400, lng: 77.3100, aqi: 418, status: "Hazardous", cases: "48,200" },
  { name: "Connaught Place, Delhi", state: "Delhi", lat: 28.6300, lng: 77.2100, aqi: 185, status: "Unhealthy", cases: "39,100" },

  // Maharashtra
  { name: "BKC, Mumbai", state: "Maharashtra", lat: 19.0600, lng: 72.8600, aqi: 162, status: "Unhealthy", cases: "38,500" },
  { name: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567, aqi: 128, status: "Unhealthy Sensitive", cases: "21,000" },
  { name: "Nagpur", state: "Maharashtra", lat: 21.1458, lng: 79.0882, aqi: 88, status: "Moderate", cases: "16,500" },
  { name: "Nashik", state: "Maharashtra", lat: 19.9975, lng: 73.7898, aqi: 75, status: "Moderate", cases: "11,200" },
  { name: "Kolhapur", state: "Maharashtra", lat: 16.7050, lng: 74.2433, aqi: 48, status: "Good", cases: "5,600" },
  
  // Uttar Pradesh & Bihar
  { name: "Charbagh, Lucknow", state: "Uttar Pradesh", lat: 26.8300, lng: 80.9200, aqi: 280, status: "Very Unhealthy", cases: "58,900" },
  { name: "Kanpur", state: "Uttar Pradesh", lat: 26.4499, lng: 80.3319, aqi: 295, status: "Very Unhealthy", cases: "48,200" },
  { name: "Varanasi", state: "Uttar Pradesh", lat: 25.3176, lng: 82.9739, aqi: 188, status: "Unhealthy", cases: "31,400" },
  { name: "Gandhi Maidan, Patna", state: "Bihar", lat: 25.6100, lng: 85.1400, aqi: 315, status: "Hazardous", cases: "61,200" },
  
  // West Bengal & North East
  { name: "Howrah, Kolkata", state: "West Bengal", lat: 22.5900, lng: 88.3100, aqi: 245, status: "Very Unhealthy", cases: "45,200" },
  { name: "Dispur, Guwahati", state: "Assam", lat: 26.1400, lng: 91.7800, aqi: 95, status: "Moderate", cases: "11,500" },
  { name: "Shillong", state: "Meghalaya", lat: 25.5788, lng: 91.8933, aqi: 30, status: "Good", cases: "1,800" },
  
  // Karnataka & Tamil Nadu
  { name: "Electronic City, Bengaluru", state: "Karnataka", lat: 12.8400, lng: 77.6600, aqi: 58, status: "Moderate", cases: "19,200" },
  { name: "Mysuru", state: "Karnataka", lat: 12.2958, lng: 76.6394, aqi: 42, status: "Good", cases: "7,100" },
  { name: "Adyar, Chennai", state: "Tamil Nadu", lat: 13.0000, lng: 80.2500, aqi: 45, status: "Good", cases: "14,500" },
  { name: "Coimbatore", state: "Tamil Nadu", lat: 11.0168, lng: 76.9558, aqi: 38, status: "Good", cases: "9,200" },
  
  // Gujarat & Rajasthan
  { name: "Narol, Ahmedabad", state: "Gujarat", lat: 22.9700, lng: 72.5800, aqi: 210, status: "Very Unhealthy", cases: "28,400" },
  { name: "Surat", state: "Gujarat", lat: 21.1702, lng: 72.8311, aqi: 145, status: "Unhealthy Sensitive", cases: "24,100" },
  { name: "Pink City, Jaipur", state: "Rajasthan", lat: 26.9100, lng: 75.7800, aqi: 175, status: "Unhealthy", cases: "22,100" },
  
  // Telangana, Andhra Pradesh & Kerala
  { name: "HITEC City, Hyderabad", state: "Telangana", lat: 17.4400, lng: 78.3700, aqi: 115, status: "Unhealthy Sensitive", cases: "16,800" },
  { name: "Visakhapatnam", state: "Andhra Pradesh", lat: 17.6868, lng: 83.2185, aqi: 72, status: "Moderate", cases: "13,400" },
  { name: "Thiruvananthapuram", state: "Kerala", lat: 8.5241, lng: 76.9366, aqi: 32, status: "Good", cases: "6,500" },
  { name: "Kochi", state: "Kerala", lat: 9.9312, lng: 76.2673, aqi: 39, status: "Good", cases: "8,900" },
  
  // North India & Union Territories
  { name: "Ludhiana", state: "Punjab", lat: 30.9010, lng: 75.8573, aqi: 230, status: "Very Unhealthy", cases: "21,400" },
  { name: "Srinagar", state: "Jammu & Kashmir", lat: 34.0837, lng: 74.7973, aqi: 48, status: "Good", cases: "5,200" },
  { name: "Shimla", state: "Himachal Pradesh", lat: 31.1048, lng: 77.1734, aqi: 28, status: "Good", cases: "2,400" },
  { name: "Dehradun", state: "Uttarakhand", lat: 30.3165, lng: 78.0322, aqi: 92, status: "Moderate", cases: "9,600" },
  { name: "Panaji", state: "Goa", lat: 15.4909, lng: 73.8278, aqi: 36, status: "Good", cases: "3,100" },
  { name: "Leh", state: "Ladakh UT", lat: 34.1526, lng: 77.5771, aqi: 18, status: "Good", cases: "500" }
];

// Helper: Get color based on AQI
const getAQIColor = (aqi) => {
  if (aqi > 300) return "#7f0000";
  if (aqi > 200) return "#b388ff";
  if (aqi > 150) return "#ff3d00";
  if (aqi > 100) return "#ff9100";
  if (aqi > 50) return "#ffea00";
  return "#00e676";
};

// Helper: Get status label
const getAQIStatus = (aqi) => {
  if (aqi > 300) return "Hazardous";
  if (aqi > 200) return "Very Unhealthy";
  if (aqi > 150) return "Unhealthy";
  if (aqi > 100) return "Unhealthy Sensitive";
  if (aqi > 50) return "Moderate";
  return "Good";
};

// Legend Component
const Legend = () => {
  const legendItems = [
    { label: "Good (0-50)", color: "#00e676" },
    { label: "Moderate (51-100)", color: "#ffea00" },
    { label: "Unhealthy Sensitive (101-150)", color: "#ff9100" },
    { label: "Unhealthy (151-200)", color: "#ff3d00" },
    { label: "Very Unhealthy (201-300)", color: "#b388ff" },
    { label: "Hazardous (300+)", color: "#7f0000" },
  ];

  return (
    <div className="aqi-legend">
      {legendItems.map((item, idx) => (
        <div key={idx} className="aqi-legend__item">
          <span className="aqi-legend__dot" style={{ background: item.color }} />
          <span className="aqi-legend__label">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

// Map Marker Component with Permanent Region Name Tooltip
const MapMarker = ({ location }) => {
  const color = getAQIColor(location.aqi);
  const status = getAQIStatus(location.aqi);
  const radius = location.aqi > 200 ? 13 : location.aqi > 100 ? 11 : 9;

  return (
    <CircleMarker
      center={[location.lat, location.lng]}
      radius={radius}
      pathOptions={{
        color: '#ffffff',
        fillColor: color,
        fillOpacity: 0.95,
        weight: 2,
        opacity: 1,
      }}
    >
      <Tooltip permanent direction="top" offset={[0, -10]} className="region-name-tooltip">
        <div className="tooltip-region-badge">
          <span className="tooltip-region-name">{location.name}</span>
          <span className="tooltip-region-aqi" style={{ backgroundColor: color }}>
            {location.aqi}
          </span>
        </div>
      </Tooltip>

      <Popup>
        <div className="map-popup">
          <h4 className="map-popup__title">{location.name}</h4>
          <div className="map-popup__state">{location.state}</div>
          <div className="map-popup__aqi" style={{ color }}>
            AQI: {location.aqi}
            <span className="map-popup__status">({status})</span>
          </div>
          <div className="map-popup__cases">
            🏥 Active Cases: <strong>{location.cases}</strong>
          </div>
        </div>
      </Popup>
    </CircleMarker>
  );
};

// Main Modal Component
export default function AQIMapModal({ isOpen, onClose }) {
  const mapRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Delay to ensure modal is rendered
      setTimeout(() => {
        setIsMapReady(true);
      }, 100);
    } else {
      setIsMapReady(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // India center coordinates
  const center = [20.5937, 78.9629];

  return (
    <div className="aqi-map-modal-overlay" onClick={onClose}>
      <div 
        className="aqi-map-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="aqi-map-modal-header">
          <div className="aqi-map-modal-header-left">
            <div className="aqi-map-modal-icon">
              <MapPin size={24} />
            </div>
            <div>
              <h3 className="aqi-map-modal-title">
                Interactive All-India Satellite AQI Map
              </h3>
              <p className="aqi-map-modal-subtitle">
                Satellite surveillance with live regional air quality markers and hospital surveillance across India
              </p>
            </div>
          </div>

          <div className="aqi-map-modal-header-right">
            <div className="satellite-indicator-badge">
              🛰️ High-Resolution Satellite View
            </div>

            <button 
              className="aqi-map-modal-close"
              onClick={onClose}
              aria-label="Close map"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Legend */}
        <Legend />

        {/* Map Container */}
        <div className="aqi-map-container">
          {isMapReady ? (
            <MapContainer
              key="india-satellite-map"
              center={center}
              zoom={5}
              className="aqi-leaflet-map"
              zoomControl={false}
              ref={mapRef}
            >
              <ZoomControl position="bottomright" />
              <MapResizer />
              
              {/* Satellite Imagery Base Layer */}
              <TileLayer
                attribution='&copy; Esri, Maxar, Earthstar Geographics'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={18}
              />

              {/* Geographic Place Names & State Boundaries Layer */}
              <TileLayer
                attribution='&copy; Esri'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                maxZoom={18}
              />

              {INDIA_LOCATIONS.map((location, idx) => (
                <MapMarker key={idx} location={location} />
              ))}
            </MapContainer>
          ) : (
            <div className="aqi-map-loading">
              <div className="aqi-map-loading__spinner" />
              <p>Loading India satellite surveillance map...</p>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="aqi-map-footer">
          <div className="aqi-map-footer__stat">
            <span className="aqi-map-footer__stat-value">{INDIA_LOCATIONS.length}</span>
            <span className="aqi-map-footer__stat-label">Locations Tracked</span>
          </div>
          <div className="aqi-map-footer__stat">
            <span className="aqi-map-footer__stat-value">
              {INDIA_LOCATIONS.filter(l => l.aqi > 200).length}
            </span>
            <span className="aqi-map-footer__stat-label">High Risk Areas</span>
          </div>
          <div className="aqi-map-footer__stat">
            <span className="aqi-map-footer__stat-value">
              {INDIA_LOCATIONS.filter(l => l.aqi <= 50).length}
            </span>
            <span className="aqi-map-footer__stat-label">Safe Areas</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Modal Overlay */
        .aqi-map-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 20px;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Modal Content */
        .aqi-map-modal-content {
          width: 95vw;
          max-width: 1150px;
          max-height: 92vh;
          background: var(--color-bg-primary, #ffffff);
          border: 1px solid var(--color-border, #e2e8f0);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.18);
          padding: 1.5rem;
          border-radius: 16px;
          color: var(--color-text-primary, #0f172a);
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s ease;
        }

        .aqi-map-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-shrink: 0;
          flex-wrap: wrap;
          gap: 12px;
        }

        .aqi-map-modal-header-left {
          display: flex;
          gap: 12px;
          align-items: center;
          flex: 1;
        }

        .aqi-map-modal-icon {
          width: 44px;
          height: 44px;
          background: rgba(16, 185, 129, 0.12);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #10b981;
        }

        .aqi-map-modal-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .satellite-indicator-badge {
          display: flex;
          align-items: center;
          background: #0f172a;
          color: #38bdf8;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.2px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .aqi-map-modal-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
          color: var(--color-text-primary, #0f172a);
        }

        .aqi-map-modal-subtitle {
          font-size: 0.82rem;
          color: var(--color-text-secondary, #64748b);
          margin: 2px 0 0 0;
        }

        .aqi-map-modal-close {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          color: #64748b;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .aqi-map-modal-close:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        /* Region Name Tooltip on Satellite Map */
        :global(.region-name-tooltip) {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }

        :global(.region-name-tooltip::before) {
          display: none !important;
        }

        :global(.tooltip-region-badge) {
          display: inline-flex;
          align-items: center;
          background: rgba(15, 23, 42, 0.88);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.35);
          border-radius: 6px;
          padding: 2px 6px;
          gap: 5px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
          pointer-events: none;
        }

        :global(.tooltip-region-name) {
          font-size: 11px;
          font-weight: 700;
          color: #ffffff;
          white-space: nowrap;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
        }

        :global(.tooltip-region-aqi) {
          font-size: 10px;
          font-weight: 800;
          color: #ffffff;
          padding: 1px 4px;
          border-radius: 4px;
        }
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .aqi-map-modal-close:hover {
          background: rgba(255, 61, 0, 0.4);
          transform: rotate(90deg);
        }

        /* Legend */
        .aqi-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          flex-shrink: 0;
        }

        .aqi-legend__item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          font-weight: 600;
          color: #cbd5e1;
        }

        .aqi-legend__dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.2);
          flex-shrink: 0;
        }

        .aqi-legend__label {
          white-space: nowrap;
        }

        /* Map Container */
        .aqi-map-container {
          height: 520px;
          min-height: 480px;
          width: 100%;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          background: #0f172a;
          position: relative;
        }

        .aqi-leaflet-map {
          width: 100%;
          height: 100%;
          min-height: 480px;
        }

        /* Loading State */
        .aqi-map-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          min-height: 400px;
          gap: 16px;
          color: #94a3b8;
        }

        .aqi-map-loading__spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(0, 242, 254, 0.1);
          border-top-color: #00f2fe;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Footer Stats */
        .aqi-map-footer {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          flex-shrink: 0;
        }

        .aqi-map-footer__stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .aqi-map-footer__stat-value {
          font-size: 1.4rem;
          font-weight: 800;
          color: #00f2fe;
        }

        .aqi-map-footer__stat-label {
          font-size: 0.75rem;
          color: #94a3b8;
          margin-top: 2px;
        }

        /* Popup Styles (global) */
        :global(.map-popup) {
          padding: 4px;
          min-width: 180px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        :global(.map-popup__title) {
          margin: 0 0 2px 0;
          font-size: 1rem;
          font-weight: 700;
          color: #fff;
        }

        :global(.map-popup__state) {
          font-size: 0.78rem;
          color: #94a3b8;
          margin-bottom: 6px;
        }

        :global(.map-popup__aqi) {
          font-size: 1.1rem;
          font-weight: 800;
          margin-bottom: 4px;
        }

        :global(.map-popup__status) {
          font-size: 0.7rem;
          font-weight: 600;
          margin-left: 6px;
          opacity: 0.8;
        }

        :global(.map-popup__cases) {
          font-size: 0.8rem;
          color: #cbd5e1;
        }

        :global(.map-popup__cases strong) {
          color: #ff3d00;
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
          color: #fff !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }

        :global(.leaflet-control-zoom a:hover) {
          background: rgba(0, 242, 254, 0.2) !important;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .aqi-map-modal-content {
            padding: 1rem;
            max-height: 95vh;
          }

          .aqi-map-modal-title {
            font-size: 1rem;
          }

          .aqi-map-modal-subtitle {
            font-size: 0.75rem;
          }

          .aqi-leaflet-map {
            min-height: 320px;
          }

          .aqi-map-container {
            min-height: 320px;
          }

          .aqi-map-footer {
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }

          .aqi-map-footer__stat-value {
            font-size: 1.1rem;
          }

          .aqi-legend {
            gap: 4px;
            padding: 6px 8px;
          }

          .aqi-legend__item {
            font-size: 0.65rem;
          }

          .aqi-legend__dot {
            width: 10px;
            height: 10px;
          }
        }

        @media (max-width: 480px) {
          .aqi-map-modal-overlay {
            padding: 10px;
          }

          .aqi-map-modal-content {
            padding: 0.75rem;
          }

          .aqi-map-modal-header-left {
            gap: 8px;
          }

          .aqi-map-modal-icon {
            width: 36px;
            height: 36px;
          }

          .aqi-map-modal-icon svg {
            width: 18px;
            height: 18px;
          }

          .aqi-leaflet-map {
            min-height: 260px;
          }

          .aqi-map-container {
            min-height: 260px;
          }

          .aqi-map-footer__stat-value {
            font-size: 0.9rem;
          }

          .aqi-map-footer__stat-label {
            font-size: 0.65rem;
          }
        }
      `}</style>
    </div>
  );
}