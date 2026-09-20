import { useMemo, useState, useEffect, useRef } from 'react';
import React from 'react';
import { 
  MapPin, 
  Navigation, 
  Search, 
  Wind, 
  Layers,
  Clock,
  Route,
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
  Target,
  Globe,
  Play,
  Pause,
  Zap,
} from 'lucide-react';
import Layout from '../components/Layout';
import { Card, Loader, ErrorState, StatusBadge, EmptyState } from '../components/Common';
import AqiGauge from '../components/AqiGauge';
import AQIMapTrigger from '../components/AQIMapTrigger';
import AQIMapModal from '../components/AQIMapModal';
import SafestRoute from '../components/SafestRoute';
import CityAutocomplete from '../components/CityAutocomplete';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useAsync } from '../hooks/useAsync';
import { getAllAqi, getAqiByCity, getAqiByCoords, DELHI_NCR_STATIONS } from '../api/aqi';
import { normalizeAqiList, normalizeAqiRecord, getAqiBand, formatRelativeTime } from '../utils/aqi';
import { indiaLocations } from '../data/indiaLocations';
import { getStubblePlumes } from '../api/forecast';
import { useDemoScenario } from '../context/DemoScenarioContext';
import { getAllMicroHotspots } from '../utils/microHotspotDetector';

// Import Leaflet for map
import { MapContainer, TileLayer, WMSTileLayer, Marker, Popup, Circle, Tooltip, Polygon, Polyline, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Enhanced FRP-weighted fire marker icon for NASA FIRMS satellite thermal anomalies
const getFireMarkerIcon = (frp = 50) => {
  const numFrp = Number(frp) || 50;
  const size = Math.min(42, Math.max(22, Math.round(18 + Math.sqrt(numFrp) * 2.0)));
  const isHigh = numFrp >= 80;
  const isExtreme = numFrp >= 130;
  const color = isExtreme ? '#b91c1c' : isHigh ? '#ef4444' : numFrp >= 45 ? '#f97316' : '#eab308';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="#ffffff" stroke-width="1.5">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
  `;

  return L.divIcon({
    html: `
      <div class="custom-firms-marker-container ${isHigh ? 'firms-thermal-pulse' : ''}" style="width: ${size}px; height: ${size}px;">
        ${isHigh ? `<div class="firms-halo" style="border-color: ${color}; width: ${size + 14}px; height: ${size + 14}px; margin-top: -7px; margin-left: -7px;"></div>` : ''}
        <div style="filter: drop-shadow(0 0 8px ${color}); cursor: pointer;">${svg}</div>
      </div>
    `,
    className: 'custom-fire-marker-wrapper',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

// Wind vector marker icon for U/V grid
const getWindVectorIcon = (u = 3.5, v = -3.5, speedKmH = 18) => {
  // Meteorological wind angle: angle vector points towards (NW wind blowing to SE ~ 135 deg)
  const angleDeg = (Math.atan2(u, -v) * 180 / Math.PI + 360) % 360;
  const svg = `
    <div style="transform: rotate(${Math.round(angleDeg)}deg); display: flex; align-items: center; justify-content: center; width: 26px; height: 26px;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 4px rgba(56, 189, 248, 0.9));">
        <line x1="12" y1="19" x2="12" y2="5"></line>
        <polyline points="5 12 12 5 19 12"></polyline>
      </svg>
    </div>
  `;
  return L.divIcon({
    html: svg,
    className: 'custom-wind-vector-marker',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  });
};

// Traffic chokepoint marker icon (pulsing vehicular hotspot)
const getTrafficChokepointIcon = (nox = 95) => {
  const isExtreme = nox > 100;
  const color = isExtreme ? '#ea580c' : '#f97316';
  const size = 32;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2"></rect>
      <circle cx="7" cy="17" r="2"></circle>
      <circle cx="17" cy="17" r="2"></circle>
      <path d="M5 11l2-5h10l2 5"></path>
    </svg>
  `;
  return L.divIcon({
    html: `
      <div class="custom-microhotspot-marker traffic-hotspot-pin" style="width: ${size}px; height: ${size}px; background: ${color}; border: 2px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 14px ${color}; cursor: pointer;">
        ${svg}
      </div>
    `,
    className: 'custom-traffic-marker-wrapper',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

// Biomass / Waste smoldering marker icon (pulsing unvented combustion plume)
const getBiomassSmolderingIcon = (pm25 = 400) => {
  const size = 34;
  const color = '#ef4444';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="${color}" stroke="#ffffff" stroke-width="1.8">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
  `;
  return L.divIcon({
    html: `
      <div class="custom-microhotspot-marker biomass-smolder-pin" style="width: ${size}px; height: ${size}px; background: rgba(220, 38, 38, 0.95); border: 2px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 16px #ef4444; cursor: pointer;">
        ${svg}
      </div>
    `,
    className: 'custom-biomass-marker-wrapper',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

// Wind U/V Grid Nodes across the Punjab-Haryana-Delhi transport corridor
const WIND_GRID_NODES = [
  { id: 'wv_1', name: 'Amritsar - Gurdaspur Corridor', lat: 31.30, lng: 75.10, speed: 17.5, dir: 312, u: 3.4, v: -3.8 },
  { id: 'wv_2', name: 'Jalandhar - Kapurthala Sector', lat: 31.20, lng: 75.80, speed: 18.2, dir: 315, u: 3.6, v: -3.6 },
  { id: 'wv_3', name: 'Hoshiarpur Foothills', lat: 31.30, lng: 76.40, speed: 14.1, dir: 320, u: 3.0, v: -2.5 },
  { id: 'wv_4', name: 'Firozpur - Faridkot Basin', lat: 30.70, lng: 74.90, speed: 16.8, dir: 310, u: 3.6, v: -3.0 },
  { id: 'wv_5', name: 'Ludhiana - Moga Industrial Belt', lat: 30.80, lng: 75.60, speed: 19.4, dir: 315, u: 3.8, v: -3.8 },
  { id: 'wv_6', name: 'Fatehgarh Sahib - Khanna Sector', lat: 30.60, lng: 76.30, speed: 17.0, dir: 316, u: 3.4, v: -3.5 },
  { id: 'wv_7', name: 'Bathinda - Mansa Agriculture Belt', lat: 30.10, lng: 75.20, speed: 15.6, dir: 312, u: 3.2, v: -2.9 },
  { id: 'wv_8', name: 'Sangrur - Patiala Stubble Hotspot', lat: 30.20, lng: 75.90, speed: 18.5, dir: 315, u: 3.7, v: -3.7 },
  { id: 'wv_9', name: 'Ambala - Kurukshetra Corridor', lat: 30.20, lng: 76.80, speed: 16.2, dir: 318, u: 3.3, v: -3.1 },
  { id: 'wv_10', name: 'Sirsa - Fatehabad Plains', lat: 29.50, lng: 75.30, speed: 14.8, dir: 308, u: 3.2, v: -2.6 },
  { id: 'wv_11', name: 'Kaithal - Jind Agrarian Zone', lat: 29.60, lng: 76.20, speed: 17.4, dir: 315, u: 3.4, v: -3.4 },
  { id: 'wv_12', name: 'Karnal - Panipat GT Road Corridor', lat: 29.60, lng: 76.90, speed: 18.0, dir: 316, u: 3.5, v: -3.6 },
  { id: 'wv_13', name: 'Hisar - Rohtak Wind Gateway', lat: 28.90, lng: 75.90, speed: 15.2, dir: 312, u: 3.1, v: -2.8 },
  { id: 'wv_14', name: 'Sonipat - Delhi Incursion Front', lat: 28.90, lng: 76.80, speed: 16.5, dir: 315, u: 3.3, v: -3.3 },
  { id: 'wv_15', name: 'NCT Delhi Receptor Bowl', lat: 28.61, lng: 77.21, speed: 11.2, dir: 314, u: 2.2, v: -2.2 },
  { id: 'wv_16', name: 'Faridabad - Noida Downwind Sector', lat: 28.45, lng: 77.45, speed: 9.8, dir: 312, u: 1.9, v: -2.1 },
];

// Official Delhi NCT Statutory Boundary Polygon Coordinates
const DELHI_NCT_BOUNDARY = [
  [28.883, 77.083], // North (Narela / Alipur)
  [28.850, 77.217], // North East border
  [28.733, 77.300], // North East (Shahdara / Dilshad Garden)
  [28.640, 77.333], // East (Anand Vihar / Ghazipur)
  [28.533, 77.333], // South East (Mayur Vihar / Kalindi Kunj)
  [28.467, 77.283], // South East (Badarpur / Tughlakabad)
  [28.417, 77.167], // South (Asola / Bhati)
  [28.483, 77.067], // South West (Mahipalpur / Rajokri)
  [28.517, 76.917], // South West border (Najafgarh / Chhawla)
  [28.633, 76.883], // West border (Tikri / Mundka)
  [28.783, 76.967], // North West (Bawana / Kanjhawala)
  [28.883, 77.083], // Close loop
];

// Helper to generate dynamic nearby stations
const getNearbyStationsForLocation = (cityName, lat, lng, baseAqi = 65) => {
  const norm = (cityName || '').toLowerCase();
  
  if (norm.includes('delhi') || norm.includes('noida') || norm.includes('anand vihar') || norm.includes('ghaziabad') || norm.includes('gurugram') || norm.includes('faridabad') || norm.includes('ncr')) {
    return DELHI_NCR_STATIONS.map((st) => {
      const dist = Math.max(0.8, Math.round(Math.hypot((st.lat - (lat || 28.6502)) * 111, (st.lng - (lng || 77.3027)) * 96) * 10) / 10);
      let multiplier = 1.0;
      if (st.name.includes('Anand Vihar') || st.name.includes('Ghaziabad') || st.name.includes('Wazirpur') || st.name.includes('Mundka') || st.name.includes('Jahangirpuri')) {
        multiplier = 1.22;
      } else if (st.name.includes('Punjabi Bagh') || st.name.includes('Rohini') || st.name.includes('Noida') || st.name.includes('Faridabad') || st.name.includes('ITO')) {
        multiplier = 1.08;
      } else if (st.name.includes('Lodhi Road') || st.name.includes('Mandir Marg') || st.name.includes('Siri Fort')) {
        multiplier = 0.82;
      } else {
        multiplier = 0.95;
      }
      return {
        name: st.name,
        zone: st.zone,
        lat: st.lat,
        lng: st.lng,
        distance: `${dist} km away`,
        aqi: Math.max(35, Math.round(baseAqi * multiplier)),
      };
    });
  }

  if (norm.includes('mumbai') || norm.includes('bkc')) {
    return [
      { name: 'BKC Bandra East', distance: '1.5 km away', aqi: Math.max(30, Math.round(baseAqi * 1.12)), lat: 19.0600, lng: 72.8600 },
      { name: 'Chembur East', distance: '2.8 km away', aqi: Math.max(35, Math.round(baseAqi * 1.25)), lat: 19.0650, lng: 72.8900 },
      { name: 'Sion Circle', distance: '3.7 km away', aqi: Math.max(28, Math.round(baseAqi * 0.94)), lat: 19.0400, lng: 72.8630 },
      { name: 'Worli Seaface', distance: '5.9 km away', aqi: Math.max(20, Math.round(baseAqi * 0.78)), lat: 19.0150, lng: 72.8180 },
    ];
  }

  if (norm.includes('dombivli') || norm.includes('kalyan')) {
    return [
      { name: 'Kalyan Khadakpada', distance: '1.8 km away', aqi: Math.max(30, Math.round(baseAqi * 0.95)), lat: 19.2450, lng: 73.1250 },
      { name: 'Dombivli MIDC Phase II', distance: '2.4 km away', aqi: Math.max(35, Math.round(baseAqi * 1.18)), lat: 19.2100, lng: 73.0990 },
      { name: 'Kopar Station West', distance: '3.2 km away', aqi: Math.max(25, Math.round(baseAqi * 0.88)), lat: 19.2280, lng: 73.0780 },
      { name: 'Ulhasnagar Sub-station', distance: '5.6 km away', aqi: Math.max(35, Math.round(baseAqi * 1.22)), lat: 19.2190, lng: 73.1530 },
      { name: 'Thane Majiwada Ring', distance: '8.4 km away', aqi: Math.max(30, Math.round(baseAqi * 1.05)), lat: 19.2180, lng: 72.9850 },
    ];
  }

  // Generic offset calculation for any Indian coordinates
  const cLat = lat || 28.6502;
  const cLng = lng || 77.3027;
  const cName = cityName || 'Anand Vihar, Delhi';

  return [
    { name: `${cName} Central Hub`, distance: '1.2 km away', aqi: Math.max(20, Math.round(baseAqi * 0.94)), lat: cLat + 0.008, lng: cLng + 0.007 },
    { name: `${cName} Industrial Area`, distance: '2.9 km away', aqi: Math.max(30, Math.round(baseAqi * 1.22)), lat: cLat - 0.015, lng: cLng + 0.012 },
    { name: `${cName} Suburb Ring`, distance: '4.4 km away', aqi: Math.max(22, Math.round(baseAqi * 0.85)), lat: cLat + 0.022, lng: cLng - 0.014 },
    { name: `${cName} Green Enclave`, distance: '6.1 km away', aqi: Math.max(18, Math.round(baseAqi * 0.72)), lat: cLat - 0.028, lng: cLng - 0.020 },
  ];
};

// Custom marker icons based on AQI
const getMarkerIcon = (aqi) => {
  const band = getAqiBand(aqi || 0);
  const color = band.color;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34">
      <circle cx="17" cy="17" r="15" fill="${color}" opacity="0.95" stroke="white" stroke-width="2.5"/>
      <text x="17" y="21" text-anchor="middle" fill="white" font-size="11" font-weight="bold">${aqi || '--'}</text>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: 'custom-marker',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17]
  });
};

// Map controller component to handle center & bounds
function MapController({ center, markers }) {
  const map = useMap();
  
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, 11, { animate: true });
    } else if (markers && markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [center, markers, map]);
  
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
  const { user } = useAuth();
  const { notifyLocationAqiChange } = useNotifications();
  const { currentScenario, scenarioData, scenarioMeta, isScenarioActive } = useDemoScenario();
  const role = (user?.role || '').toUpperCase();
  const isAdmin = role === 'ADMIN' || role.includes('ADMIN') || user?.email?.toLowerCase().includes('admin');
  const [showAdvancedGis, setShowAdvancedGis] = useState(isAdmin);
  const [showWmsAod, setShowWmsAod] = useState(false);
  const [showCaqmBoundary, setShowCaqmBoundary] = useState(true);
  const [currentCityName, setCurrentCityName] = useState(() => {
    const c = user?.city || user?.district;
    if (!c || c.toLowerCase().includes('dombivli') || c.toLowerCase().includes('thane') || c.toLowerCase().includes('mumbai')) {
      return 'Anand Vihar, Delhi';
    }
    return c;
  });
  const [currentCoords, setCurrentCoords] = useState([28.6502, 77.3027]);
  const [currentAqiValue, setCurrentAqiValue] = useState(418);
  const [searchInput, setSearchInput] = useState('');
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState(null);
  const [mapLayerType, setMapLayerType] = useState('satellite'); // 'satellite' | 'street'
  const [selectedStation, setSelectedStation] = useState(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [showStubblePlumes, setShowStubblePlumes] = useState(true);
  const [showWindVectors, setShowWindVectors] = useState(true);
  const [showMicroHotspots, setShowMicroHotspots] = useState(true);
  const [plumeHours, setPlumeHours] = useState(0);
  const [stubbleTelemetry, setStubbleTelemetry] = useState(null);
  const [isPlayingPlume, setIsPlayingPlume] = useState(false);
  const mapRef = useRef(null);
  const lastMapNotifiedRef = useRef('');

  const microHotspots = useMemo(() => {
    return getAllMicroHotspots(stubbleTelemetry?.prevailingWindSpeedKmH || 14.2);
  }, [stubbleTelemetry]);

  useEffect(() => {
    setShowAdvancedGis(isAdmin);
  }, [isAdmin]);

  // Fetch active NASA FIRMS stubble fires or load preset scenario data
  useEffect(() => {
    if (isScenarioActive && scenarioData?.stubbleData) {
      setStubbleTelemetry(scenarioData.stubbleData);
      setCurrentAqiValue(scenarioMeta.aqi);
      setCurrentCityName(scenarioMeta.stationName);
      if (currentScenario === 'clean_baseline') {
        setCurrentCoords([28.5916, 77.2274]);
      } else {
        setCurrentCoords([28.6469, 77.3160]);
      }
    } else {
      async function loadStubbleData() {
        try {
          const data = await getStubblePlumes();
          if (data) setStubbleTelemetry(data);
        } catch (err) {
          console.error('Error loading stubble data:', err);
        }
      }
      loadStubbleData();
    }
  }, [currentScenario, scenarioData, isScenarioActive]);

  // Dynamic smoke plume trajectories and advancing fronts synced with plumeHours (0h-72h)
  const dynamicPlumes = useMemo(() => {
    if (!stubbleTelemetry?.fires || !stubbleTelemetry.fires.length) return [];
    const windSpeed = stubbleTelemetry.prevailingWindSpeedKmH || 14.2;
    const delhiCoords = [28.6139, 77.2090];

    return stubbleTelemetry.fires.map((fire) => {
      const startLat = fire.latitude;
      const startLon = fire.longitude;
      const dist = fire.distanceToDelhiKm || 250;
      const arrivalHours = fire.estimatedDelhiArrivalHours || Math.max(3, Math.round(dist / windSpeed));
      
      // Travel progress ratio (0 = at fire, 1 = at Delhi, > 1 = past Delhi)
      const ratio = dist > 0 ? (windSpeed * plumeHours) / dist : 0;
      
      let frontLat, frontLon;
      if (ratio <= 1.0) {
        frontLat = startLat + ratio * (delhiCoords[0] - startLat);
        frontLon = startLon + ratio * (delhiCoords[1] - startLon);
      } else {
        const excess = ratio - 1.0;
        frontLat = delhiCoords[0] - excess * 0.6;
        frontLon = delhiCoords[1] + excess * 1.2;
      }

      // Curved trajectory points for natural meteorological drift
      const midLat = startLat + (frontLat - startLat) * 0.5 - 0.05 * ratio;
      const midLon = startLon + (frontLon - startLon) * 0.5 + 0.08 * ratio;
      const pathPoints = [
        [startLat, startLon],
        [midLat, midLon],
        [frontLat, frontLon],
      ];

      const hasReachedDelhi = plumeHours >= arrivalHours;

      return {
        id: fire.id,
        fire,
        pathPoints,
        frontCoords: [frontLat, frontLon],
        hasReachedDelhi,
        arrivalHours,
        puffRadius: Math.max(5000, Math.min(26000, 5000 + plumeHours * 300)),
      };
    });
  }, [stubbleTelemetry, plumeHours]);

  // Dynamic Gaussian forward-dispersion plume cone into Delhi boundary
  const gaussianPlumeCone = useMemo(() => {
    // Normalizing travel time: smoke front reaches Delhi border in ~12h
    const progress = Math.min(1.0, plumeHours / 20.0);
    const apexLat = 30.55;
    const apexLng = 75.60;
    const delhiCentroid = [28.6139, 77.2090];
    
    // Front coordinates advancing along the 315° NW-SE trajectory towards Delhi
    const frontLat = apexLat + (delhiCentroid[0] - apexLat) * progress;
    const frontLng = apexLng + (delhiCentroid[1] - apexLng) * progress;
    
    // Gaussian lateral spreading sigma_y(x)
    const lateralScale = 0.25 + progress * 0.45;
    
    // Core concentrated plume cone (PM2.5 > 250 ug/m3)
    const coreCone = [
      [30.85, 75.35], // NW flank near Ludhiana
      [30.65, 76.25], // NE flank near Patiala
      [frontLat + lateralScale * 0.35, frontLng + lateralScale * 0.55], // Eastern boundary
      [frontLat, frontLng], // Apex front
      [frontLat - lateralScale * 0.45, frontLng - lateralScale * 0.35], // Western boundary
      [30.15, 75.05], // SW flank near Bathinda
    ];

    // Secondary regional dispersion envelope (Ambient haze > 100 ug/m3)
    const hazeScale = 0.55 + progress * 0.85;
    const hazeEnvelope = [
      [31.60, 74.80], // Amritsar
      [31.40, 76.70], // Foothills / Chandigarh
      [frontLat + hazeScale * 0.50, frontLng + hazeScale * 0.90],
      [frontLat - 0.20, frontLng + 0.20],
      [frontLat - hazeScale * 0.80, frontLng - hazeScale * 0.40],
      [29.90, 74.30], // SW Punjab border
    ];

    return {
      coreCone,
      hazeEnvelope,
      frontLat,
      frontLng,
      hasInundatedDelhi: plumeHours >= 12,
    };
  }, [plumeHours]);

  // Dynamic regional smoke dispersion polygon envelope expanding with plumeHours
  const regionalDispersionPolygon = useMemo(() => {
    const progress = Math.min(1.0, plumeHours / 72);
    return [
      [31.8, 74.3],
      [31.4, 76.6],
      [Math.min(31.2, 28.9 - progress * 0.6), Math.max(77.2, 76.5 + progress * 1.8)],
      [Math.min(30.8, 28.2 - progress * 0.8), Math.max(76.8, 76.0 + progress * 1.5)],
      [30.2 - progress * 2.0, 74.4 + progress * 0.8],
      [30.5, 74.2],
    ];
  }, [plumeHours]);

  // Auto-play animation for 0h-72h plume drift
  useEffect(() => {
    if (!isPlayingPlume) return;
    const interval = setInterval(() => {
      setPlumeHours((prev) => (prev >= 72 ? 0 : prev + 6));
    }, 900);
    return () => clearInterval(interval);
  }, [isPlayingPlume]);


  // Fetch AQI data when currentCityName changes
  const {
    data: cityRaw,
    error: cityError,
    loading: cityLoading,
    refetch: refetchCity
  } = useAsync(() => getAqiByCity(currentCityName), [currentCityName]);

  const activeRecord = useMemo(() => {
    if (!cityRaw) return null;
    const norm = normalizeAqiRecord(cityRaw);
    if (norm.aqi) {
      setCurrentAqiValue(norm.aqi);
    }
    return norm;
  }, [cityRaw]);

  // Dispatch real-time notification whenever location / AQI updates
  useEffect(() => {
    const aqi = activeRecord?.aqi || currentAqiValue;
    if (!currentCityName || !aqi) return;
    const key = `${currentCityName}_${aqi}`;
    if (lastMapNotifiedRef.current === key) return;
    lastMapNotifiedRef.current = key;

    if (typeof notifyLocationAqiChange === 'function') {
      notifyLocationAqiChange(currentCityName, aqi);
    }
  }, [currentCityName, activeRecord, currentAqiValue, notifyLocationAqiChange]);

  // Auto-scroll if navigated with hash #safe-health-route
  useEffect(() => {
    if (window.location.hash === '#safe-health-route') {
      setTimeout(() => {
        const el = document.getElementById('safe-health-route');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 350);
    }
  }, []);

  // Dynamic nearby stations list for the current location
  const nearbyStations = useMemo(() => {
    return getNearbyStationsForLocation(
      currentCityName,
      currentCoords[0],
      currentCoords[1],
      currentAqiValue
    );
  }, [currentCityName, currentCoords, currentAqiValue]);

  // Prepare markers for map
  const markers = useMemo(() => {
    return nearbyStations.map(station => ({
      ...station,
      icon: getMarkerIcon(station.aqi)
    }));
  }, [nearbyStations]);

  // Handle station click on map
  const handleStationClick = (station) => {
    setSelectedStation(station);
  };

  // Handle user selecting a city from autocomplete
  const handleSelectCity = (item) => {
    setCurrentCityName(item.name);
    setSearchInput(item.name);
    if (item.lat && item.lng) {
      setCurrentCoords([item.lat, item.lng]);
    }
  };

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
          const { latitude, longitude } = pos.coords;
          setCurrentCoords([latitude, longitude]);
          const data = await getAqiByCoords(latitude, longitude);
          const norm = normalizeAqiRecord(data);
          const name = norm?.locationName || norm?.city || 'My Location';
          setCurrentCityName(name);
          setCurrentAqiValue(norm?.aqi || 65);
          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], 12);
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
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Handle map ready state
  useEffect(() => {
    setIsMapReady(true);
  }, []);

  const aqiLayers = [
    { value: 45, label: 'Good' },
    { value: 85, label: 'Moderate' },
    { value: 135, label: 'Sensitive' },
    { value: 185, label: 'Unhealthy' },
  ];

  // AQI Information items
  const infoItems = [
    { 
      icon: Eye, 
      title: 'Check Live AQI', 
      description: 'Real-time air quality at your location',
      onClick: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    { 
      icon: Map, 
      title: 'Explore Stations', 
      description: 'View nearby monitoring stations',
      onClick: () => {
        const el = document.getElementById('regional-map');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    },
    { 
      icon: Route, 
      title: 'Plan Safe Routes', 
      description: 'Find cleaner and safer travel routes on map',
      onClick: () => {
        const el = document.getElementById('safe-health-route');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    },
    { 
      icon: Heart, 
      title: 'Stay Healthy', 
      description: 'Follow AI-powered health recommendations',
      onClick: () => {
        const el = document.querySelector('.location-card');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    },
  ];

  return (
    <Layout title="Air Quality Map" subtitle="Real-time color-coded environmental surveillance markers across your region.">
      <div className="air-quality-dashboard">
        {/* Top Bar with Search and Map Trigger */}
        <div className="top-bar">
          <div className="top-bar__search-box">
            <CityAutocomplete
              value={searchInput}
              onChange={(val) => setSearchInput(val)}
              onSelect={handleSelectCity}
              placeholder="Search Indian cities, towns or districts..."
            />
          </div>
          <div className="top-bar__actions">
            <AQIMapTrigger 
              onClick={() => setIsMapModalOpen(true)}
              label="🗺️ All-India Map"
              className="map-trigger-btn"
            />
            <button className="btn btn--primary btn--sm" onClick={locateMe} disabled={locating}>
              <Navigation size={14} className={locating ? 'spin' : ''} /> 
              {locating ? 'Locating...' : 'My Location'}
            </button>
          </div>
        </div>

        {locateError && <div className="error-message">{locateError}</div>}

        {/* AQI Layers */}
        <div className="aqi-layers">
          <div className="aqi-layers__header">
            <Layers size={16} />
            <span>AQI Scale Reference</span>
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

        {/* ===================================================
            SAFEST ROUTE - SAFETY PATH FROM ONE REGION TO ANOTHER ON MAP
        =================================================== */}
        <div id="safe-health-route" className="safest-route-wrapper" style={{ marginBottom: '24px' }}>
          <SafestRoute />
        </div>

        {/* Map Section */}
        <div className="map-section" id="regional-map">
          <div className="map-header">
            <h3 className="map-header__title">
              <MapPin size={16} />
              {currentCityName}
            </h3>
            <div className="map-header__controls">
              {(isAdmin || showAdvancedGis) ? (
                <>
                  <button 
                    className={`map-header__btn ${showStubblePlumes ? 'map-header__btn--active' : ''}`}
                    onClick={() => setShowStubblePlumes(!showStubblePlumes)}
                    title="Toggle Satellite Stubble Burning & Plume Dispersion"
                  >
                    🔥 Stubble: {showStubblePlumes ? 'ON' : 'OFF'}
                  </button>

                  <button 
                    className={`map-header__btn ${showWindVectors ? 'map-header__btn--active' : ''}`}
                    onClick={() => setShowWindVectors(!showWindVectors)}
                    title="Toggle Wind Vectors (U/V Grid) Transport Corridor"
                  >
                    💨 Vectors: {showWindVectors ? 'ON' : 'OFF'}
                  </button>

                  <button 
                    className={`map-header__btn ${showWmsAod ? 'map-header__btn--active' : ''}`}
                    onClick={() => setShowWmsAod(!showWmsAod)}
                    title="Toggle NASA GIBS MODIS Aerosol Optical Depth WMS Overlay"
                  >
                    🛰️ NASA WMS: {showWmsAod ? 'ON' : 'OFF'}
                  </button>

                  <button 
                    className={`map-header__btn ${showCaqmBoundary ? 'map-header__btn--active' : ''}`}
                    onClick={() => setShowCaqmBoundary(!showCaqmBoundary)}
                    title="Toggle CAQM Statutory NCR Airshed Boundary"
                  >
                    🏛️ CAQM Boundary: {showCaqmBoundary ? 'ON' : 'OFF'}
                  </button>
                </>
              ) : (
                <div className="satellite-indicator-badge">
                  🏛️ MoEFCC / CPCB Public Portal
                </div>
              )}

              {!isAdmin && (
                <button 
                  className="map-header__btn"
                  onClick={() => setShowAdvancedGis(!showAdvancedGis)}
                  title="Toggle Advanced GIS & Meteorological Layer"
                >
                  {showAdvancedGis ? '👁️ Simple View' : '🔬 Advanced GIS'}
                </button>
              )}

              <button 
                className={`map-header__btn ${showMicroHotspots ? 'map-header__btn--active' : ''}`}
                onClick={() => setShowMicroHotspots(!showMicroHotspots)}
                title="Toggle Traffic Chokepoints & Biomass/Waste Smoldering Micro-Hotspots"
                style={{
                  background: showMicroHotspots ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.22), rgba(249, 115, 22, 0.22))' : undefined,
                  borderColor: showMicroHotspots ? '#f97316' : undefined,
                  color: showMicroHotspots ? '#fdba74' : undefined,
                }}
              >
                🚦 Hotspots: {showMicroHotspots ? 'ON' : 'OFF'}
              </button>

              <button 
                className="map-header__btn"
                onClick={() => setIsMapModalOpen(true)}
              >
                <Globe size={14} />
                All-India Map
              </button>
              <span className="map-header__update">
                <Clock size={12} />
                Live Feed Active
              </span>
            </div>
          </div>
          
          <div className="map-container">
            {isMapReady ? (
              <MapContainer
                center={[28.6502, 77.3027]}
                zoom={11}
                maxBounds={[[27.8, 76.2], [30.5, 78.5]]}
                maxBoundsViscosity={0.8}
                className="leaflet-map"
                zoomControl={false}
                ref={mapRef}
              >
                {/* Satellite Imagery Base Layer */}
                <TileLayer
                  key="sat-layer"
                  attribution='&copy; Esri, Maxar, Earthstar Geographics'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={19}
                />

                {/* Region Names & Boundaries Hybrid Layer */}
                <TileLayer
                  key="sat-labels"
                  attribution='&copy; Esri'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={19}
                />

                {/* NASA GIBS Aerosol Optical Depth (AOD) WMS Overlay Layer */}
                {showWmsAod && (
                  <WMSTileLayer
                    url="https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi"
                    layers="MODIS_Terra_Aerosol"
                    format="image/png"
                    transparent={true}
                    opacity={0.65}
                    attribution="&copy; NASA EOSDIS GIBS"
                  />
                )}

                <ZoomControl position="bottomright" />
                
                {/* User location marker */}
                <Circle
                  center={currentCoords}
                  radius={800}
                  pathOptions={{ 
                    color: '#10b981',
                    fillColor: '#10b981',
                    fillOpacity: 0.25
                  }}
                />

                {/* NASA FIRMS Stubble Fire Hotspots Layer (FRP-Weighted with Thermal Radiance) */}
                {(isAdmin || showAdvancedGis) && showStubblePlumes && stubbleTelemetry?.fires?.map((fire) => {
                  const frpVal = fire.fireRadiativePower || fire.frp || 75;
                  const isHighFrp = frpVal >= 80;
                  return (
                    <React.Fragment key={`firms-fire-${fire.id}`}>
                      {/* High FRP Thermal Radiation Halo Ring */}
                      {isHighFrp && (
                        <Circle
                          center={[fire.latitude, fire.longitude]}
                          radius={Math.min(18000, Math.max(7000, Math.round(frpVal * 130)))}
                          pathOptions={{
                            color: '#ef4444',
                            fillColor: '#ef4444',
                            fillOpacity: 0.16,
                            weight: 1.5,
                            dashArray: '3, 4',
                          }}
                        />
                      )}
                      <Marker
                        position={[fire.latitude, fire.longitude]}
                        icon={getFireMarkerIcon(frpVal)}
                      >
                        <Popup>
                          <div className="map-popup firms-popup">
                            <strong style={{ color: '#ef4444', fontSize: '13px' }}>
                              🔥 NASA FIRMS Thermal Anomaly
                            </strong>
                            <div style={{ fontWeight: 700, margin: '2px 0 6px 0' }}>
                              📍 {fire.district}, {fire.state}
                            </div>
                            <div style={{ fontSize: '11.5px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <div>Satellite Sensor: <strong>VIIRS S-NPP / NOAA-20</strong></div>
                              <div>Fire Radiative Power (FRP): <strong style={{ color: frpVal >= 80 ? '#ef4444' : '#f97316' }}>{frpVal} MW</strong> ({frpVal >= 80 ? 'Severe Combustion' : 'Active Burn'})</div>
                              <div>Brightness Temp: <strong>{fire.brightnessTemperature || fire.brightness || 338.4} K</strong></div>
                              <div>Detection Confidence: <strong style={{ color: '#10b981' }}>98% (High Quality I-Band)</strong></div>
                              <div>Est. Drift to Delhi: <strong>~{fire.estimatedDelhiArrivalHours || 12}h</strong></div>
                              <div style={{ color: '#ef4444', fontWeight: 800, borderTop: '1px solid #e2e8f0', paddingTop: '4px', marginTop: '2px' }}>
                                Delhi Influx Potential: +{fire.estimatedDelhiPM25Influx || Math.round(frpVal * 0.45)} μg/m³
                              </div>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    </React.Fragment>
                  );
                })}

                {/* Dynamic Individual Plume Dispersion Vectors (Punjab / Haryana -> Delhi NCR) */}
                {(isAdmin || showAdvancedGis) && showStubblePlumes && dynamicPlumes.map((plume) => (
                  <React.Fragment key={`plume-traj-${plume.id}`}>
                    {/* Directional Smoke Drift Vector Path */}
                    <Polyline
                      positions={plume.pathPoints}
                      pathOptions={{
                        color: '#f97316',
                        weight: 2.5,
                        opacity: 0.85,
                        dashArray: '5, 8',
                      }}
                    />

                    {/* Advancing Smoke Plume Puff Front */}
                    {plumeHours > 0 && (
                      <Circle
                        center={plume.frontCoords}
                        radius={plume.puffRadius}
                        pathOptions={{
                          color: '#ea580c',
                          fillColor: '#ea580c',
                          fillOpacity: Math.max(0.12, 0.30 - (plumeHours / 72) * 0.12),
                          weight: 1.5,
                          dashArray: '3, 4',
                        }}
                      >
                        <Popup>
                          <div className="map-popup">
                            <strong style={{ color: '#ea580c' }}>💨 Advancing Smoke Front (+{plumeHours}h)</strong>
                            <div>Origin: {plume.fire.district}, {plume.fire.state}</div>
                            <div>Fastest Delhi Arrival: <strong>~{plume.arrivalHours}h</strong></div>
                            <div>Delhi PM2.5 Influx: <strong>+{plume.fire.estimatedDelhiPM25Influx} μg/m³</strong></div>
                            <div style={{ color: plume.hasReachedDelhi ? '#ef4444' : '#f59e0b', fontWeight: 700, marginTop: '3px' }}>
                              Status: {plume.hasReachedDelhi ? '🚨 Inundating Delhi NCR' : '✈️ In Transit Towards Delhi'}
                            </div>
                          </div>
                        </Popup>
                      </Circle>
                    )}
                  </React.Fragment>
                ))}

                {/* Gaussian Plume Dispersion Trajectory Cone (Punjab -> Haryana -> Delhi NCR) */}
                {(isAdmin || showAdvancedGis) && showStubblePlumes && (
                  <>
                    {/* Secondary Ambient Haze Dispersion Envelope */}
                    <Polygon
                      key={`gaussian-haze-envelope-${plumeHours}`}
                      positions={gaussianPlumeCone.hazeEnvelope}
                      pathOptions={{
                        color: '#f59e0b',
                        fillColor: '#f59e0b',
                        fillOpacity: 0.08 + (plumeHours / 72) * 0.14,
                        weight: 1.5,
                        dashArray: '4, 6',
                      }}
                    />

                    {/* Primary Core Gaussian Plume Dispersion Cone */}
                    <Polygon
                      key={`gaussian-core-cone-${plumeHours}`}
                      positions={gaussianPlumeCone.coreCone}
                      pathOptions={{
                        color: '#ea580c',
                        fillColor: '#ea580c',
                        fillOpacity: 0.18 + (plumeHours / 72) * 0.24,
                        weight: 2,
                        dashArray: '6, 8',
                      }}
                    >
                      <Popup>
                        <div className="map-popup">
                          <strong style={{ color: '#ea580c' }}>🌾 Gaussian Stubble Plume Dispersion Cone (+{plumeHours}h)</strong>
                          <div>Transport Azimuth: <strong>315° North-Westerly Corridor</strong></div>
                          <div>Origin Farm Hotspots: <strong>Sangrur / Ludhiana / Bathinda / Kaithal</strong></div>
                          <div>Downwind Receptor: <strong>Delhi NCR Boundary</strong></div>
                          <div>Trajectory Alignment: {stubbleTelemetry?.windTrajectory || 'North-Westerly'}</div>
                          <div style={{ color: '#ea580c', fontWeight: 700, marginTop: '4px' }}>
                            Peak Downwind Influx: +{Math.round((stubbleTelemetry?.estimatedDelhiPM25Influx || 162) * (0.35 + (plumeHours / 72) * 0.65))} μg/m³
                          </div>
                        </div>
                      </Popup>
                    </Polygon>
                  </>
                )}

                {/* Delhi NCT Statutory Boundary Polygon */}
                {showCaqmBoundary && (
                  <Polygon
                    positions={DELHI_NCT_BOUNDARY}
                    pathOptions={{
                      color: plumeHours >= 12 ? '#ef4444' : '#38bdf8',
                      fillColor: plumeHours >= 12 ? '#ef4444' : '#38bdf8',
                      fillOpacity: plumeHours >= 12 ? 0.28 : 0.09,
                      weight: 2.5,
                      dashArray: plumeHours >= 12 ? '4, 4' : undefined,
                    }}
                  >
                    <Popup>
                      <div className="map-popup">
                        <strong style={{ color: plumeHours >= 12 ? '#ef4444' : '#38bdf8' }}>
                          🏛️ Delhi National Capital Territory (NCT Boundary)
                        </strong>
                        <div>Statutory Area: <strong>DPCC / CPCB Regulatory Airshed</strong></div>
                        <div>Forecast Horizon: <strong>+{plumeHours} Hours Ahead</strong></div>
                        <div>Status: <strong style={{ color: plumeHours >= 12 ? '#ef4444' : '#10b981' }}>
                          {plumeHours >= 12 ? '🚨 Smoke Plume Inundation Active under Inversion' : '⏳ Smoke Plume in Upwind Transit across Haryana'}
                        </strong></div>
                        <div style={{ color: '#ef4444', fontWeight: 700, marginTop: '4px' }}>
                          Stubble Ground Influx: +{plumeHours >= 12 ? (stubbleTelemetry?.estimatedDelhiPM25Influx || 162) : Math.round((stubbleTelemetry?.estimatedDelhiPM25Influx || 162) * (plumeHours / 12))} μg/m³
                        </div>
                      </div>
                    </Popup>
                  </Polygon>
                )}

                {/* Wind Vectors (U/V Grid) Transport Corridor Layer */}
                {(isAdmin || showAdvancedGis) && showWindVectors && WIND_GRID_NODES.map((node) => (
                  <Marker
                    key={node.id}
                    position={[node.lat, node.lng]}
                    icon={getWindVectorIcon(node.u, node.v, node.speed)}
                  >
                    <Popup>
                      <div className="map-popup wind-vector-popup">
                        <strong style={{ color: '#38bdf8' }}>💨 Atmospheric Wind Vector (U/V Grid)</strong>
                        <div style={{ fontWeight: 600, margin: '2px 0 4px 0' }}>{node.name}</div>
                        <div style={{ fontSize: '11.5px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div>Wind Velocity: <strong>{node.speed} km/h ({(node.speed / 3.6).toFixed(1)} m/s)</strong></div>
                          <div>Direction: <strong>{node.dir}° ({node.dir >= 290 && node.dir <= 340 ? 'North-Westerly Drift' : `${node.dir}°`})</strong></div>
                          <div>Zonal Velocity (U): <strong>+{node.u} m/s (Eastward)</strong></div>
                          <div>Meridional Velocity (V): <strong>{node.v} m/s (Southward)</strong></div>
                          <div>Transport Level: <strong>10m Surface / 950 hPa Inversion Layer</strong></div>
                          <div style={{ color: '#f59e0b', fontSize: '11px', marginTop: '2px' }}>
                            Direct transport vector funneling smoke towards Delhi bowl.
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Delhi NCR Regional Receptor Circle Indicator */}
                {(isAdmin || showAdvancedGis) && showStubblePlumes && (
                  <Circle
                    center={[28.6139, 77.2090]}
                    radius={16000}
                    pathOptions={{
                      color: plumeHours >= (stubbleTelemetry?.fastestPlumeArrivalHours || 7.5) ? '#ef4444' : '#38bdf8',
                      fillColor: plumeHours >= (stubbleTelemetry?.fastestPlumeArrivalHours || 7.5) ? '#ef4444' : '#38bdf8',
                      fillOpacity: plumeHours >= (stubbleTelemetry?.fastestPlumeArrivalHours || 7.5) ? 0.32 : 0.10,
                      weight: 2,
                      dashArray: '4, 4',
                    }}
                  >
                    <Popup>
                      <div className="map-popup">
                        <strong style={{ color: '#ef4444' }}>🏛️ Delhi NCR Receptor Air Mass</strong>
                        <div>Forecast Horizon: +{plumeHours} Hours</div>
                        <div>Stubble PM2.5 Influx: +{stubbleTelemetry?.estimatedDelhiPM25Influx || 162} μg/m³</div>
                        <div>Trajectory Alignment: {stubbleTelemetry?.windTrajectory || 'North-Westerly (NW Drift)'}</div>
                        <div style={{ color: plumeHours >= (stubbleTelemetry?.fastestPlumeArrivalHours || 7.5) ? '#ef4444' : '#10b981', fontWeight: 700, marginTop: '4px' }}>
                          {plumeHours >= (stubbleTelemetry?.fastestPlumeArrivalHours || 7.5)
                            ? '🚨 Plume Inundation Active (Trapped under inversion)'
                            : '⏳ Smoke Plume in Upwind Transit'}
                        </div>
                      </div>
                    </Popup>
                  </Circle>
                )}

                {/* Real-Time Micro-Hotspot Layer: Traffic Chokepoints & Biomass Smoldering Plumes */}
                {showMicroHotspots && microHotspots.map((spot) => {
                  const isTraffic = spot.type === 'traffic';
                  return (
                    <React.Fragment key={`micro-hotspot-${spot.id}`}>
                      <Circle
                        center={[spot.lat, spot.lng]}
                        radius={isTraffic ? 1400 : 2400}
                        pathOptions={{
                          color: spot.color,
                          fillColor: spot.color,
                          fillOpacity: isTraffic ? 0.20 : 0.25,
                          weight: 2,
                          dashArray: isTraffic ? '4, 4' : '5, 6',
                        }}
                      />

                      <Marker
                        position={[spot.lat, spot.lng]}
                        icon={isTraffic ? getTrafficChokepointIcon(spot.noxPpb) : getBiomassSmolderingIcon(spot.pm25)}
                      >
                        <Tooltip permanent direction="bottom" offset={[0, 14]} className="micro-hotspot-tooltip">
                          <div style={{
                            fontSize: '10.5px',
                            fontWeight: 800,
                            color: '#ffffff',
                            background: isTraffic ? 'rgba(234, 88, 12, 0.94)' : 'rgba(220, 38, 38, 0.94)',
                            padding: '2px 7px',
                            borderRadius: '6px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
                            whiteSpace: 'nowrap'
                          }}>
                            {isTraffic ? `🚦 ${spot.name.split('-')[0].trim()}` : `🔥 ${spot.name.split('&')[0].trim()}`}
                          </div>
                        </Tooltip>

                        <Popup>
                          <div className="map-popup micro-hotspot-popup" style={{ minWidth: '250px' }}>
                            <strong style={{ color: spot.color, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              {isTraffic ? '🚨 Traffic Chokepoint Detected' : '⚠️ Biomass / Waste Smoldering'}
                            </strong>
                            <div style={{ fontWeight: 700, margin: '4px 0 6px 0', fontSize: '13px', color: '#0f172a' }}>
                              📍 {spot.name}
                            </div>
                            <div style={{ fontSize: '11.5px', display: 'flex', flexDirection: 'column', gap: '4px', color: '#334155' }}>
                              {isTraffic ? (
                                <>
                                  <div>Corridor: <strong>{spot.corridor}</strong></div>
                                  <div>NOx Concentration: <strong style={{ color: '#ea580c' }}>{spot.noxPpb} ppb</strong> (Statutory Limit: 80 ppb)</div>
                                  <div>Carbon Monoxide (CO): <strong>{spot.coPpm} ppm</strong></div>
                                  <div>Traffic Volume: <strong>{spot.trafficVolume}</strong></div>
                                  <div>Status: <strong style={{ color: '#ea580c' }}>Localized Emission Trapping Active</strong></div>
                                </>
                              ) : (
                                <>
                                  <div>Zone: <strong>{spot.zoneName || spot.name}</strong></div>
                                  <div>PM2.5 Plume Spike: <strong style={{ color: '#ef4444' }}>{spot.pm25} μg/m³</strong></div>
                                  <div>Thermal Anomaly: <strong style={{ color: '#ea580c' }}>{spot.thermalRadianceKelvin} K (VIIRS)</strong></div>
                                  <div>Combustion Power: <strong>{spot.fireRadiativePowerMw} MW</strong></div>
                                  <div>Plume Classification: <strong>{spot.sourceType}</strong></div>
                                </>
                              )}
                              <div style={{
                                marginTop: '6px',
                                paddingTop: '6px',
                                borderTop: '1px solid #e2e8f0',
                                color: '#0369a1',
                                fontSize: '11px',
                                fontWeight: 600
                              }}>
                                🛡️ Regulatory Action: {spot.regulatoryAction}
                              </div>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    </React.Fragment>
                  );
                })}

                {/* Station markers with permanent region names */}
                {markers.map((station, idx) => (
                  <Marker
                    key={idx}
                    position={[station.lat, station.lng]}
                    icon={station.icon}
                    eventHandlers={{
                      click: () => handleStationClick(station)
                    }}
                  >
                    <Tooltip permanent direction="top" offset={[0, -18]} className="station-name-tooltip">
                      <div className="station-tooltip-badge">
                        <span className="station-tooltip-name">{station.name}</span>
                        <span className="station-tooltip-aqi" style={{ backgroundColor: getAqiBand(station.aqi).color }}>
                          AQI {station.aqi}
                        </span>
                      </div>
                    </Tooltip>

                    <Popup>
                      <div className="map-popup">
                        <strong>{station.name}</strong>
                        <div>AQI: {station.aqi}</div>
                        <div className="map-popup__status">
                          Status: {getAqiBand(station.aqi).label}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          📍 {station.distance}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                <MapController center={currentCoords} markers={markers} />
              </MapContainer>
            ) : (
              <div className="map-loading">
                <div className="map-loading__spinner" />
                <p>Loading satellite map...</p>
              </div>
            )}

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
              <button className="map-controls__btn" title="Refresh" onClick={refetchCity}>
                <RefreshCw size={16} />
              </button>
            </div>

            {/* Heatmap overlay indicator */}
            <div className="heatmap-indicator">
              <div className="heatmap-indicator__label">
                <Gauge size={14} />
                <span>Regional AQI</span>
              </div>
              <span className="heatmap-indicator__value">{currentAqiValue}</span>
            </div>

            {/* Stubble Dispersion Telemetry Overlay */}
            {(isAdmin || showAdvancedGis) && showStubblePlumes && stubbleTelemetry && (
              <div className="stubble-telemetry-overlay">
                <div className="stubble-telemetry-header">
                  <span className="stubble-dot" />
                  <span>🛰️ NASA FIRMS & Crop Plume Telemetry</span>
                </div>
                <div className="stubble-telemetry-stats">
                  <div className="stubble-stat">
                    <span className="stubble-stat__val">{stubbleTelemetry.activeFireCount || 2840}</span>
                    <span className="stubble-stat__lbl">Active Fires</span>
                  </div>
                  <div className="stubble-stat">
                    <span className="stubble-stat__val" style={{ color: '#ef4444' }}>+{stubbleTelemetry.estimatedDelhiPM25Influx || 162} μg/m³</span>
                    <span className="stubble-stat__lbl">Delhi Influx</span>
                  </div>
                  <div className="stubble-stat">
                    <span className="stubble-stat__val" style={{ color: '#38bdf8' }}>~{stubbleTelemetry.fastestPlumeArrivalHours || 7.5}h</span>
                    <span className="stubble-stat__lbl">Drift Arrival</span>
                  </div>
                  <div className="stubble-stat">
                    <span className="stubble-stat__val" style={{ color: '#10b981' }}>78%</span>
                    <span className="stubble-stat__lbl">Plume Confidence</span>
                  </div>
                </div>
                <div className="stubble-scrubber-bar">
                  <div className="stubble-scrubber-lbl">
                    <span>Forecasted Drift: <strong>+{plumeHours}h</strong></span>
                    <button
                      type="button"
                      className={`plume-play-btn ${isPlayingPlume ? 'plume-play-btn--active' : ''}`}
                      onClick={() => setIsPlayingPlume(!isPlayingPlume)}
                      title={isPlayingPlume ? 'Pause Simulation' : 'Play 72h Plume Simulation'}
                    >
                      {isPlayingPlume ? <Pause size={12} /> : <Play size={12} />}
                      <span>{isPlayingPlume ? 'Pause' : 'Animate'}</span>
                    </button>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="72"
                    step="6"
                    value={plumeHours}
                    onChange={(e) => setPlumeHours(parseInt(e.target.value, 10))}
                    className="plume-slider"
                  />
                  <div className="plume-ticks">
                    <span>Now (0h)</span>
                    <span>+24h</span>
                    <span>+48h</span>
                    <span>+72h</span>
                  </div>
                  {plumeHours >= (stubbleTelemetry.fastestPlumeArrivalHours || 7.5) && (
                    <div className="delhi-arrival-alert">
                      <Zap size={13} color="#ef4444" />
                      <span>Smoke Inundating Delhi NCR (+{stubbleTelemetry.estimatedDelhiPM25Influx || 162} μg/m³ PM2.5 • 78% Confidence)</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Grid */}
        <div className="dashboard-grid">
          {/* Left Column */}
          <div className="dashboard-grid__main">
            {/* Selected Location Card */}
            {currentCityName && (
              <div className="location-card">
                <div className="location-card__header">
                  <div className="location-card__title">
                    <MapPin size={18} />
                    <span>{activeRecord?.locationName || activeRecord?.city || currentCityName}</span>
                    {activeRecord?.state && (
                      <span className="location-card__state">({activeRecord.state})</span>
                    )}
                  </div>
                  <span className="location-card__update">
                    <Clock size={12} />
                    Live Reading
                  </span>
                </div>
                
                {cityLoading && !activeRecord ? (
                  <Loader label={`Fetching AQI for ${currentCityName}...`} />
                ) : cityError && !activeRecord ? (
                  <ErrorState message={cityError.message} />
                ) : (
                  <div className="location-card__body">
                    <div className="location-card__gauge">
                      <AqiGauge value={activeRecord?.aqi ?? currentAqiValue} size={120} />
                    </div>
                    <div className="location-card__info">
                      <div className="location-card__primary">
                        <span className="location-card__pollutant">Dominant Pollutant</span>
                        <span className="location-card__pollutant-value">PM2.5</span>
                      </div>
                      <div className="location-card__safe">
                        <ShieldCheck size={16} />
                        <span>Surveillance Active</span>
                      </div>
                      <div className="location-card__stats">
                        <div className="location-card__stat">
                          <span>PM2.5</span>
                          <strong>{activeRecord?.pm25 ?? '--'} µg/m³</strong>
                        </div>
                        <div className="location-card__stat">
                          <span>PM10</span>
                          <strong>{activeRecord?.pm10 ?? '--'} µg/m³</strong>
                        </div>
                        <div className="location-card__stat">
                          <span>O₃</span>
                          <strong>{activeRecord?.o3 ?? '--'} ppb</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}



            {/* Nearby Monitoring Stations */}
            <div className="stations-card">
              <div className="stations-card__header">
                <Radio size={16} />
                <h3 className="stations-card__title">NEARBY MONITORING STATIONS ({currentCityName})</h3>
              </div>
              <div className="stations-card__list">
                {nearbyStations.map((station, idx) => (
                  <StationCard 
                    key={idx}
                    name={station.name}
                    distance={station.distance}
                    aqi={station.aqi}
                    onClick={() => {
                      if (mapRef.current) {
                        mapRef.current.setView([station.lat, station.lng], 14);
                      }
                    }}
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
          </div>
        </div>
      </div>

      {/* AQI Map Modal */}
      <AQIMapModal 
        isOpen={isMapModalOpen} 
        onClose={() => setIsMapModalOpen(false)} 
      />

      <style jsx>{`
        .air-quality-dashboard {
          width: 100%;
        }

        /* Top Bar */
        .top-bar {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
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
          min-width: 200px;
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

        .top-bar__actions {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }

        .map-trigger-btn {
          background: linear-gradient(135deg, rgba(0, 242, 254, 0.15), rgba(0, 230, 118, 0.08));
          border: 1px solid rgba(0, 242, 254, 0.3);
          color: #00f2fe;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .map-trigger-btn:hover {
          background: linear-gradient(135deg, rgba(0, 242, 254, 0.3), rgba(0, 230, 118, 0.15));
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 242, 254, 0.2);
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
          background: linear-gradient(135deg, #2b6cb0, #4299e1);
          color: white;
        }

        .btn--primary:hover {
          background: linear-gradient(135deg, #2c5282, #3182ce);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(43, 108, 176, 0.25);
        }

        .btn--primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
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
          flex-wrap: wrap;
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

        .map-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: white;
          border-radius: 12px 12px 0 0;
          border: 1px solid #e2e8f0;
          border-bottom: none;
          flex-wrap: wrap;
          gap: 8px;
        }

        .map-header__title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          color: #1a202c;
          margin: 0;
        }

        .map-header__title svg {
          color: #4299e1;
        }

        .map-header__controls {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .top-bar__search-box {
          flex: 1;
          min-width: 260px;
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 6px 10px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }

        .satellite-indicator-badge {
          display: inline-flex;
          align-items: center;
          background: #0f172a;
          color: #38bdf8;
          padding: 5px 12px;
          border-radius: 8px;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.2px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }

        /* Permanent Station Name Tooltip on Satellite Map */
        :global(.station-name-tooltip) {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }

        :global(.station-name-tooltip::before) {
          display: none !important;
        }

        :global(.station-tooltip-badge) {
          display: inline-flex;
          align-items: center;
          background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 6px;
          padding: 2px 7px;
          gap: 5px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
          pointer-events: none;
        }

        :global(.station-tooltip-name) {
          font-size: 11px;
          font-weight: 700;
          color: #ffffff;
          white-space: nowrap;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
        }

        :global(.station-tooltip-aqi) {
          font-size: 10px;
          font-weight: 800;
          color: #ffffff;
          padding: 1px 5px;
          border-radius: 4px;
        }

        .map-header__btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          background: #ebf8ff;
          border: 1px solid #bee3f8;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          color: #2b6cb0;
          cursor: pointer;
          transition: all 0.2s;
        }

        .map-header__btn:hover {
          background: #bee3f8;
          transform: translateY(-1px);
        }

        .map-header__btn--active {
          background: #0284c7 !important;
          color: #ffffff !important;
          border-color: #0284c7 !important;
          box-shadow: 0 2px 6px rgba(2, 132, 199, 0.35);
        }

        :global(.custom-firms-marker-container) {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        :global(.firms-halo) {
          position: absolute;
          border-radius: 50%;
          border: 2px solid #ef4444;
          animation: firms-pulse-halo 1.8s infinite ease-out;
          pointer-events: none;
        }

        @keyframes firms-pulse-halo {
          0% {
            transform: scale(0.6);
            opacity: 0.9;
          }
          100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }

        :global(.custom-wind-vector-marker) {
          background: none;
          border: none;
          cursor: pointer;
          transition: transform 0.2s;
        }

        :global(.custom-wind-vector-marker:hover) {
          transform: scale(1.25);
        }

        :global(.custom-fire-marker-wrapper) {
          background: none;
          border: none;
        }

        .map-header__update {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #718096;
        }

        .map-container {
          position: relative;
          border-radius: 0 0 12px 12px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          border-top: none;
          height: 440px;
          background: #f7fafc;
        }

        .leaflet-map {
          height: 100%;
          width: 100%;
        }

        .map-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 12px;
          color: #718096;
        }

        .map-loading__spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e2e8f0;
          border-top-color: #4299e1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
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
          font-size: 13.5px;
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

        /* Stubble Dispersion Telemetry Overlay (Desktop & Universal) */
        .stubble-telemetry-overlay {
          position: absolute;
          top: 14px;
          right: 14px;
          z-index: 1000;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #fca5a5;
          border-radius: 12px;
          padding: 12px 16px;
          backdrop-filter: blur(8px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
          max-width: 320px;
          pointer-events: auto;
        }

        .stubble-telemetry-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11.5px;
          font-weight: 700;
          color: #b91c1c;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 10px;
        }

        .stubble-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          box-shadow: 0 0 8px #ef4444;
          animation: pulse 1.5s infinite;
        }

        .stubble-telemetry-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 10px;
          text-align: center;
        }

        .stubble-stat {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 6px 4px;
        }

        .stubble-stat__val {
          display: block;
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
        }

        .stubble-stat__lbl {
          display: block;
          font-size: 10px;
          color: #64748b;
          margin-top: 2px;
        }

        .stubble-scrubber-bar {
          border-top: 1px solid #e2e8f0;
          padding-top: 8px;
        }

        .stubble-scrubber-lbl {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11.5px;
          color: #334155;
          margin-bottom: 6px;
        }

        .plume-play-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          color: #0284c7;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .plume-play-btn:hover {
          background: #e0f2fe;
          border-color: #7dd3fc;
        }

        .plume-play-btn--active {
          background: #ef4444 !important;
          border-color: #ef4444 !important;
          color: #ffffff !important;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
        }

        .plume-slider {
          width: 100%;
          accent-color: #ef4444;
          cursor: pointer;
        }

        .plume-ticks {
          display: flex;
          justify-content: space-between;
          font-size: 9.5px;
          color: #64748b;
          margin-top: 2px;
        }

        .delhi-arrival-alert {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          padding: 5px 8px;
          background: #fee2e2;
          border: 1px solid #fca5a5;
          border-radius: 6px;
          font-size: 10.5px;
          font-weight: 700;
          color: #b91c1c;
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

          .top-bar__actions {
            justify-content: stretch;
          }

          .top-bar__actions .btn,
          .top-bar__actions .map-trigger-btn {
            flex: 1;
            justify-content: center;
          }

          .aqi-layers {
            flex-wrap: wrap;
            gap: 12px;
          }

          .aqi-layers__grid {
            flex-wrap: wrap;
          }

          .map-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .map-container {
            height: 280px;
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
            height: 220px;
          }

          .map-header__btn--active {
            background: #ef4444 !important;
            color: #ffffff !important;
            box-shadow: 0 0 12px rgba(239, 68, 68, 0.4);
          }

          .stubble-telemetry-overlay {
            max-width: 260px;
            padding: 10px 12px;
            top: 8px;
            right: 8px;
          }

          .map-header__controls {
            flex-direction: column;
            align-items: flex-start;
            width: 100%;
          }

          .map-header__btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </Layout>
  );
}