import { useMemo, useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Navigation, 
  Search, 
  Wind, 
  Layers,
  Clock,
  Route,
  Hospital,
  Eye,
  CheckCircle2,
  ShieldCheck,
  Radio,
  ArrowUpRight,
  Heart,
  Map,
  AlertCircle,
  Thermometer,
  Droplet,
  Gauge,
  ChevronDown,
  Maximize2,
  Minimize2,
  RefreshCw,
  Target
} from 'lucide-react';
import Layout from '../components/Layout';
import { Card, Loader, ErrorState, StatusBadge, EmptyState } from '../components/Common';
import AqiGauge from '../components/AqiGauge';
import { useAsync } from '../hooks/useAsync';
import { getAllAqi, getAqiByCity, getAqiByCoords } from '../api/aqi';
import { normalizeAqiList, normalizeAqiRecord, getAqiBand, formatRelativeTime } from '../utils/aqi';

// Import Leaflet for map
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons based on AQI
const getMarkerIcon = (aqi) => {
  const band = getAqiBand(aqi || 0);
  const color = band.color;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="14" fill="${color}" opacity="0.9" stroke="white" stroke-width="2"/>
      <text x="16" y="20" text-anchor="middle" fill="white" font-size="11" font-weight="bold">${aqi || '--'}</text>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

// Map controller component to handle bounds
function MapController({ markers }) {
  const map = useMap();
  
  useEffect(() => {
    if (markers && markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [markers, map]);
  
  return null;
}

// AQI layer badge component
const AqiLayerBadge = ({ value, label, color }) => (
  <div className="aqi-layer-badge" style={{ borderColor: color }}>
    <span className="aqi-layer-badge__value" style={{ color }}>{value}</span>
    <span className="aqi-layer-badge__label">{label}</span>
  </div>
);

// Clean route card component
const CleanRouteCard = ({ exposure = 'Low', time = '15 mins' }) => (
  <div className="clean-route-card">
    <div className="clean-route-card__header">
      <Route size={18} />
      <span className="clean-route-card__title">CLEANER ROUTE OPTION</span>
    </div>
    <div className="clean-route-card__body">
      <div className="clean-route-card__exposure">
        <span className="clean-route-card__label">Estimated Exposure</span>
        <div className={`clean-route-card__badge clean-route-card__badge--${exposure.toLowerCase()}`}>
          <CheckCircle2 size={14} />
          {exposure}
        </div>
      </div>
      <div className="clean-route-card__time">
        <Clock size={14} />
        <span>Travel Time: {time}</span>
      </div>
    </div>
  </div>
);

// Monitoring station card component
const StationCard = ({ name, distance, aqi, onClick }) => {
  const band = getAqiBand(aqi || 0);
  return (
    <div className="station-card" onClick={onClick}>
      <div className="station-card__info">
        <span className="station-card__name">{name}</span>
        <span className="station-card__distance">{distance}</span>
      </div>
      <div className="station-card__aqi">
        <span className="station-card__value" style={{ color: band.color }}>{aqi || '--'}</span>
        <span className="station-card__status" style={{ color: band.color }}>{band.label}</span>
      </div>
    </div>
  );
};

// Emergency facility card component
const EmergencyCard = ({ name, type, distance, status }) => (
  <div className="emergency-card">
    <div className="emergency-card__icon">
      <Hospital size={20} />
    </div>
    <div className="emergency-card__info">
      <span className="emergency-card__name">{name}</span>
      <span className="emergency-card__type">{type}</span>
      <span className="emergency-card__distance">{distance}</span>
    </div>
    <StatusBadge label={status} color={status === 'Open' ? 'green' : 'red'} size="sm" />
  </div>
);

// Info item component
const InfoItem = ({ icon: Icon, title, description, onClick }) => (
  <div className="info-card__item" onClick={onClick}>
    <Icon size={16} />
    <div>
      <span className="info-card__item-title">{title}</span>
      <span className="info-card__item-desc">{description}</span>
    </div>
    <ArrowUpRight size={14} className="info-card__item-arrow" />
  </div>
);

export default function AirQualityMap() {
  const [query, setQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState(null);
  const [mapView, setMapView] = useState('default');
  const [selectedStation, setSelectedStation] = useState(null);
  const mapRef = useRef(null);

  // Fetch AQI data
  const { data: allRaw, error: allError, loading: allLoading, refetch: refetchAll } = useAsync(() => getAllAqi(), []);
  const cities = useMemo(() => normalizeAqiList(allRaw), [allRaw]);

  const {
    data: selectedRaw,
    error: selectedError,
    loading: selectedLoading,
  } = useAsync(() => getAqiByCity(selectedCity), [selectedCity], { skip: !selectedCity });
  const selectedRecord = useMemo(() => normalizeAqiRecord(selectedRaw), [selectedRaw]);
  const selectedBand = getAqiBand(selectedRecord?.aqi ?? 0);

  // Filter cities based on search
  const filtered = useMemo(() => {
    if (!query.trim()) return cities;
    const q = query.toLowerCase();
    return cities.filter((c) => 
      c.city?.toLowerCase().includes(q) || 
      c.state?.toLowerCase().includes(q)
    );
  }, [cities, query]);

  // Mock data for UI (to match screenshot)
  const aqiLayers = [
    { value: 62, label: 'Good' },
    { value: 168, label: 'Unhealthy' },
    { value: 32, label: 'Excellent' },
    { value: 201, label: 'Hazardous' },
  ];

  // Mock monitoring stations with coordinates for map
  const mockStations = [
    { name: 'Kothrud', distance: '1.2 km away', aqi: 85, lat: 18.5033, lng: 73.8205 },
    { name: 'Shivajinagar', distance: '3.4 km away', aqi: 112, lat: 18.5300, lng: 73.8550 },
    { name: 'Baner', distance: '5.1 km away', aqi: 45, lat: 18.5578, lng: 73.7787 },
    { name: 'Swargate', distance: '6.8 km away', aqi: 156, lat: 18.5021, lng: 73.8761 },
  ];

  // Mock emergency facilities
  const emergencyFacilities = [
    { name: 'Sahyadri Hospital', type: 'Emergency Care', distance: '2.3 km', status: 'Open' },
    { name: 'Jehangir Hospital', type: 'Trauma Center', distance: '3.1 km', status: 'Open' },
    { name: 'Ruby Hall Clinic', type: 'General Hospital', distance: '4.5 km', status: 'Open' },
  ];

  // AQI Information items
  const infoItems = [
    { icon: Eye, title: 'Check Live AQI', description: 'Real-time air quality at your location' },
    { icon: Map, title: 'Explore Stations', description: 'View nearby monitoring stations' },
    { icon: Route, title: 'Plan Safe Routes', description: 'Find cleaner and safer travel routes' },
    { icon: Heart, title: 'Stay Healthy', description: 'Follow AI-powered health recommendations' },
  ];

  // Geolocation
  const locateMe = () => {
    if (!navigator.geolocation) {
      setLocateError('Geolocation is not supported in this browser.');
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const data = await getAqiByCoords(pos.coords.latitude, pos.coords.longitude);
          const norm = normalizeAqiRecord(data);
          setSelectedCity(norm?.city || null);
          
          // Center map on user location
          if (mapRef.current) {
            mapRef.current.setView([pos.coords.latitude, pos.coords.longitude], 13);
          }
        } catch (err) {
          setLocateError(err.message);
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocateError(err.message);
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  // Handle station click on map
  const handleStationClick = (station) => {
    setSelectedStation(station);
    setSelectedCity(station.name);
  };

  // Prepare markers for map
  const markers = mockStations.map(station => ({
    ...station,
    icon: getMarkerIcon(station.aqi)
  }));

  // Default center (Pune, Maharashtra)
  const defaultCenter = [18.5204, 73.8567];

  return (
    <Layout title="Air Quality Map" subtitle="Browse live AQI readings across every tracked location.">
      <div className="air-quality-dashboard">
        {/* Top Bar with Search */}
        <div className="top-bar">
          <div className="top-bar__search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search Locations, diseases or health topics..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="top-bar__input"
            />
            {query && (
              <button className="top-bar__clear" onClick={() => setQuery('')}>
                ✕
              </button>
            )}
          </div>
          <button className="btn btn--primary btn--sm" onClick={locateMe} disabled={locating}>
            <Navigation size={14} className={locating ? 'spin' : ''} /> 
            {locating ? 'Locating...' : 'Use my location'}
          </button>
        </div>

        {locateError && <div className="error-message">{locateError}</div>}

        {/* AQI Layers */}
        <div className="aqi-layers">
          <div className="aqi-layers__header">
            <Layers size={16} />
            <span>AQI Layers</span>
          </div>
          <div className="aqi-layers__grid">
            {aqiLayers.map((layer, idx) => {
              const band = getAqiBand(layer.value);
              return (
                <AqiLayerBadge 
                  key={idx}
                  value={layer.value}
                  label={layer.label}
                  color={band.color}
                />
              );
            })}
          </div>
        </div>

        {/* Map Section */}
        <div className="map-section">
          <div className="map-container">
            <MapContainer
              center={defaultCenter}
              zoom={12}
              className="leaflet-map"
              zoomControl={false}
              ref={mapRef}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ZoomControl position="bottomright" />
              
              {/* User location marker */}
              {locating && (
                <Circle
                  center={defaultCenter}
                  radius={500}
                  pathOptions={{ 
                    color: '#4299e1',
                    fillColor: '#4299e1',
                    fillOpacity: 0.2
                  }}
                />
              )}

              {/* Station markers */}
              {markers.map((station, idx) => (
                <Marker
                  key={idx}
                  position={[station.lat, station.lng]}
                  icon={station.icon}
                  eventHandlers={{
                    click: () => handleStationClick(station)
                  }}
                >
                  <Popup>
                    <div className="map-popup">
                      <strong>{station.name}</strong>
                      <div>AQI: {station.aqi}</div>
                      <div className="map-popup__status">
                        Status: {getAqiBand(station.aqi).label}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              <MapController markers={markers} />
            </MapContainer>

            {/* Map overlay controls */}
            <div className="map-controls">
              <button className="map-controls__btn" title="Zoom In" onClick={() => {
                const map = mapRef.current;
                if (map) map.zoomIn();
              }}>
                <Maximize2 size={16} />
              </button>
              <button className="map-controls__btn" title="Zoom Out" onClick={() => {
                const map = mapRef.current;
                if (map) map.zoomOut();
              }}>
                <Minimize2 size={16} />
              </button>
              <button className="map-controls__btn" title="Refresh" onClick={refetchAll}>
                <RefreshCw size={16} />
              </button>
            </div>

            {/* Heatmap overlay indicator */}
            <div className="heatmap-indicator">
              <div className="heatmap-indicator__label">
                <Gauge size={14} />
                <span>Heatmap</span>
              </div>
              <span className="heatmap-indicator__value">122</span>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="dashboard-grid">
          {/* Left Column */}
          <div className="dashboard-grid__main">
            {/* Selected Location Card */}
            {selectedCity && (
              <div className="location-card">
                <div className="location-card__header">
                  <div className="location-card__title">
                    <MapPin size={18} />
                    <span>{selectedRecord?.city || selectedCity}</span>
                    {selectedRecord?.state && (
                      <span className="location-card__state">{selectedRecord.state}</span>
                    )}
                  </div>
                  <span className="location-card__update">
                    <Clock size={12} />
                    Updated {formatRelativeTime(selectedRecord?.updatedAt)}
                  </span>
                </div>
                
                {selectedLoading ? (
                  <Loader label={`Fetching AQI for ${selectedCity}...`} />
                ) : selectedError ? (
                  <ErrorState message={selectedError.message} />
                ) : (
                  <div className="location-card__body">
                    <div className="location-card__gauge">
                      <AqiGauge value={selectedRecord?.aqi ?? 0} size={120} />
                    </div>
                    <div className="location-card__info">
                      <div className="location-card__primary">
                        <span className="location-card__pollutant">Primary Pollutant</span>
                        <span className="location-card__pollutant-value">PM2.5</span>
                      </div>
                      <div className="location-card__safe">
                        <ShieldCheck size={16} />
                        <span>Safe Level</span>
                      </div>
                      <div className="location-card__stats">
                        <div className="location-card__stat">
                          <span>PM2.5</span>
                          <strong>{selectedRecord?.pm25 ?? '--'} µg/m³</strong>
                        </div>
                        <div className="location-card__stat">
                          <span>PM10</span>
                          <strong>{selectedRecord?.pm10 ?? '--'} µg/m³</strong>
                        </div>
                        <div className="location-card__stat">
                          <span>O₃</span>
                          <strong>{selectedRecord?.o3 ?? '--'} ppb</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Clean Route Option */}
            <CleanRouteCard exposure="Low" time="15 mins" />

            {/* Nearby Monitoring Stations */}
            <div className="stations-card">
              <div className="stations-card__header">
                <Radio size={16} />
                <h3 className="stations-card__title">NEARBY MONITORING STATIONS</h3>
              </div>
              <div className="stations-card__list">
                {mockStations.map((station, idx) => (
                  <StationCard 
                    key={idx} 
                    {...station} 
                    onClick={() => handleStationClick(station)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="dashboard-grid__sidebar">
            {/* AQI Information */}
            <div className="info-card">
              <h3 className="info-card__title">AQI INFORMATION</h3>
              <div className="info-card__items">
                {infoItems.map((item, idx) => (
                  <InfoItem key={idx} {...item} />
                ))}
              </div>
            </div>

            {/* Emergency Facilities */}
            <div className="emergency-card__container">
              <h3 className="emergency-card__container-title">EMERGENCY FACILITIES</h3>
              <div className="emergency-card__list">
                {emergencyFacilities.map((facility, idx) => (
                  <EmergencyCard key={idx} {...facility} />
                ))}
              </div>
              <button className="btn btn--outline btn--full">
                Edit with Lovable
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .air-quality-dashboard {
          width: 100%;
        }

        /* Top Bar */
        .top-bar {
          display: flex;
          gap: 16px;
          align-items: center;
          margin-bottom: 20px;
        }

        .top-bar__search {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          background: white;
          padding: 10px 16px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          position: relative;
        }

        .top-bar__search svg {
          color: #a0aec0;
          flex-shrink: 0;
        }

        .top-bar__input {
          border: none;
          outline: none;
          flex: 1;
          font-size: 14px;
          color: #2d3748;
          background: transparent;
        }

        .top-bar__input::placeholder {
          color: #a0aec0;
        }

        .top-bar__clear {
          background: none;
          border: none;
          color: #a0aec0;
          cursor: pointer;
          padding: 0 4px;
          font-size: 12px;
        }

        .top-bar__clear:hover {
          color: #718096;
        }

        .error-message {
          color: #e53e3e;
          font-size: 14px;
          margin-bottom: 16px;
          padding: 8px 12px;
          background: #fed7d7;
          border-radius: 8px;
        }

        /* Buttons */
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
          background: #4299e1;
          color: white;
        }

        .btn--primary:hover {
          background: #3182ce;
        }

        .btn--primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn--sm {
          padding: 6px 12px;
          font-size: 12px;
        }

        .btn--outline {
          background: transparent;
          border: 1px solid #e2e8f0;
          color: #4a5568;
        }

        .btn--outline:hover {
          background: #f7fafc;
        }

        .btn--full {
          width: 100%;
          justify-content: center;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* AQI Layers */
        .aqi-layers {
          background: white;
          padding: 12px 20px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }

        .aqi-layers__header {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #4a5568;
          font-weight: 600;
          font-size: 14px;
        }

        .aqi-layers__grid {
          display: flex;
          gap: 16px;
          flex: 1;
          flex-wrap: wrap;
        }

        .aqi-layer-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 6px 12px;
          border-radius: 8px;
          border: 2px solid;
          background: #f7fafc;
        }

        .aqi-layer-badge__value {
          font-size: 20px;
          font-weight: 700;
        }

        .aqi-layer-badge__label {
          font-size: 12px;
          color: #4a5568;
          font-weight: 500;
        }

        /* Map Section */
        .map-section {
          margin-bottom: 24px;
        }

        .map-container {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          height: 420px;
          background: #f7fafc;
        }

        .leaflet-map {
          height: 100%;
          width: 100%;
        }

        .map-controls {
          position: absolute;
          right: 12px;
          top: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          z-index: 1000;
        }

        .map-controls__btn {
          width: 36px;
          height: 36px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          color: #4a5568;
        }

        .map-controls__btn:hover {
          background: #f7fafc;
          transform: scale(1.05);
        }

        .heatmap-indicator {
          position: absolute;
          bottom: 20px;
          left: 20px;
          background: white;
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          z-index: 1000;
        }

        .heatmap-indicator__label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #4a5568;
        }

        .heatmap-indicator__value {
          font-size: 18px;
          font-weight: 700;
          color: #2d3748;
        }

        /* Map Popup */
        .map-popup {
          padding: 4px 0;
        }

        .map-popup strong {
          display: block;
          font-size: 14px;
          color: #2d3748;
        }

        .map-popup__status {
          font-size: 12px;
          color: #718096;
          margin-top: 4px;
        }

        /* Custom marker styles */
        :global(.custom-marker) {
          background: none;
          border: none;
        }

        /* Dashboard Grid */
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
        }

        .dashboard-grid__main {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .dashboard-grid__sidebar {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Location Card */
        .location-card {
          background: white;
          padding: 20px 24px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }

        .location-card__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .location-card__title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 600;
          color: #1a202c;
        }

        .location-card__title svg {
          color: #4299e1;
        }

        .location-card__state {
          color: #718096;
          font-weight: 400;
          font-size: 14px;
        }

        .location-card__update {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #718096;
        }

        .location-card__body {
          display: flex;
          gap: 24px;
          align-items: center;
        }

        .location-card__gauge {
          flex-shrink: 0;
        }

        .location-card__info {
          flex: 1;
        }

        .location-card__primary {
          margin-bottom: 8px;
        }

        .location-card__pollutant {
          font-size: 12px;
          color: #718096;
          display: block;
        }

        .location-card__pollutant-value {
          font-size: 20px;
          font-weight: 600;
          color: #2d3748;
        }

        .location-card__safe {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #48bb78;
          font-size: 14px;
          font-weight: 500;
          background: #f0fff4;
          padding: 4px 12px;
          border-radius: 20px;
          margin-bottom: 12px;
        }

        .location-card__safe svg {
          color: #48bb78;
        }

        .location-card__stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .location-card__stat {
          display: flex;
          flex-direction: column;
        }

        .location-card__stat span {
          font-size: 12px;
          color: #718096;
        }

        .location-card__stat strong {
          font-size: 16px;
          color: #2d3748;
        }

        /* Clean Route Card */
        .clean-route-card {
          background: #ebf8ff;
          border: 1px solid #bee3f8;
          border-radius: 12px;
          padding: 16px 20px;
        }

        .clean-route-card__header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .clean-route-card__header svg {
          color: #2b6cb0;
        }

        .clean-route-card__title {
          font-size: 13px;
          font-weight: 700;
          color: #2b6cb0;
          letter-spacing: 0.5px;
        }

        .clean-route-card__body {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .clean-route-card__exposure {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .clean-route-card__label {
          font-size: 13px;
          color: #2c5282;
        }

        .clean-route-card__badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
        }

        .clean-route-card__badge--low {
          background: #c6f6d5;
          color: #276749;
        }

        .clean-route-card__badge--medium {
          background: #fefcbf;
          color: #975a16;
        }

        .clean-route-card__badge--high {
          background: #fed7d7;
          color: #9b2c2c;
        }

        .clean-route-card__time {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #2c5282;
          font-size: 14px;
          font-weight: 500;
        }

        /* Stations Card */
        .stations-card {
          background: white;
          padding: 16px 20px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }

        .stations-card__header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .stations-card__header svg {
          color: #4299e1;
        }

        .stations-card__title {
          font-size: 13px;
          font-weight: 700;
          color: #2d3748;
          letter-spacing: 0.5px;
          margin: 0;
        }

        .stations-card__list {
          display: grid;
          gap: 8px;
        }

        .station-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          border-radius: 8px;
          background: #f7fafc;
          transition: all 0.2s;
          cursor: pointer;
        }

        .station-card:hover {
          background: #edf2f7;
          transform: translateX(4px);
        }

        .station-card__info {
          display: flex;
          flex-direction: column;
        }

        .station-card__name {
          font-weight: 600;
          font-size: 14px;
          color: #2d3748;
        }

        .station-card__distance {
          font-size: 12px;
          color: #718096;
        }

        .station-card__aqi {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .station-card__value {
          font-size: 18px;
          font-weight: 700;
        }

        .station-card__status {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        /* Info Card */
        .info-card {
          background: white;
          padding: 16px 20px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }

        .info-card__title {
          font-size: 13px;
          font-weight: 700;
          color: #2d3748;
          letter-spacing: 0.5px;
          margin: 0 0 12px 0;
        }

        .info-card__items {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .info-card__item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 8px;
          background: #f7fafc;
          cursor: pointer;
          transition: all 0.2s;
        }

        .info-card__item:hover {
          background: #edf2f7;
          transform: translateX(4px);
        }

        .info-card__item > svg:first-child {
          color: #4299e1;
          flex-shrink: 0;
        }

        .info-card__item > div {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .info-card__item-title {
          font-size: 13px;
          font-weight: 600;
          color: #2d3748;
        }

        .info-card__item-desc {
          font-size: 11px;
          color: #718096;
        }

        .info-card__item-arrow {
          color: #a0aec0;
          flex-shrink: 0;
        }

        /* Emergency Card */
        .emergency-card__container {
          background: white;
          padding: 16px 20px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }

        .emergency-card__container-title {
          font-size: 13px;
          font-weight: 700;
          color: #2d3748;
          letter-spacing: 0.5px;
          margin: 0 0 12px 0;
        }

        .emergency-card__list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 12px;
        }

        .emergency-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 8px;
          background: #f7fafc;
        }

        .emergency-card__icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #fed7d7;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .emergency-card__icon svg {
          color: #e53e3e;
        }

        .emergency-card__info {
          flex: 1;
        }

        .emergency-card__name {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #2d3748;
        }

        .emergency-card__type {
          font-size: 11px;
          color: #718096;
        }

        .emergency-card__distance {
          font-size: 11px;
          color: #a0aec0;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .top-bar {
            flex-direction: column;
            align-items: stretch;
          }

          .aqi-layers {
            flex-wrap: wrap;
            gap: 12px;
          }

          .aqi-layers__grid {
            flex-wrap: wrap;
          }

          .location-card__body {
            flex-direction: column;
            align-items: center;
          }

          .location-card__stats {
            grid-template-columns: 1fr 1fr;
          }

          .clean-route-card__body {
            flex-direction: column;
            gap: 8px;
            align-items: flex-start;
          }

          .map-container {
            height: 300px;
          }

          .dashboard-grid {
            gap: 16px;
          }

          .location-card__header {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        @media (max-width: 480px) {
          .aqi-layers__grid {
            gap: 8px;
          }

          .aqi-layer-badge {
            padding: 4px 8px;
            gap: 6px;
          }

          .aqi-layer-badge__value {
            font-size: 16px;
          }

          .location-card__stats {
            grid-template-columns: 1fr;
          }

          .map-container {
            height: 250px;
          }
        }
      `}</style>
    </Layout>
  );
}