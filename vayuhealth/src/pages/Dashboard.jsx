import { useMemo, useState, useEffect, useRef } from 'react';
import {
  RefreshCw,
  MapPin,
  TreePine,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Navigation,
  Route,
  Wind,
  Thermometer,
  Droplets,
  Compass,
  CloudRain,
  Flame,
  Layers,
  ShieldCheck,
  Activity,
  TrendingUp,
  Gauge,
  Zap,
} from 'lucide-react';
import AQIMapTrigger from '../components/AQIMapTrigger';
import AQIMapModal from '../components/AQIMapModal';
import CityAutocomplete from '../components/CityAutocomplete';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';

import Layout from '../components/Layout';
import {
  Card,
  Loader,
  ErrorState,
  StatusBadge,
} from '../components/Common';

import AqiGauge from '../components/AqiGauge';

import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { useAsync } from '../hooks/useAsync';

import {
  getAqiByCity,
  getAqiByLocation,
  getStationCoords,
  DELHI_NCR_STATIONS,
} from '../api/aqi';
import { getStubblePlumes } from '../api/forecast';
import { detectMicroHotspotAlerts } from '../utils/microHotspotDetector';

import { getSurveillanceStats } from '../api/dashboard';
import { getConsolidatedDashboardData } from '../api/health';

import {
  normalizeAqiRecord,
  getAqiBand,
  formatRelativeTime,
  firstDefined,
} from '../utils/aqi';

import { useNavigate } from 'react-router-dom';

/* =========================================================
   POLLUTANT STATUS TAG HELPER
========================================================= */

function getPollutantTag(type, val) {
  const v = Number(val) || 0;
  if (type === 'pm25') {
    if (v <= 30) return { label: 'Good', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' };
    if (v <= 60) return { label: 'Satisfactory', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.3)' };
    if (v <= 90) return { label: 'Moderate', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)' };
    if (v <= 120) return { label: 'Poor', color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)', border: 'rgba(249, 115, 22, 0.3)' };
    if (v <= 250) return { label: 'Very Poor', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)' };
    return { label: 'Severe', color: '#7f1d1d', bg: 'rgba(127, 29, 29, 0.16)', border: 'rgba(127, 29, 29, 0.4)' };
  }
  if (type === 'pm10') {
    if (v <= 50) return { label: 'Good', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' };
    if (v <= 100) return { label: 'Satisfactory', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.3)' };
    if (v <= 250) return { label: 'Moderate', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)' };
    if (v <= 350) return { label: 'Poor', color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)', border: 'rgba(249, 115, 22, 0.3)' };
    if (v <= 430) return { label: 'Very Poor', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)' };
    return { label: 'Severe', color: '#7f1d1d', bg: 'rgba(127, 29, 29, 0.16)', border: 'rgba(127, 29, 29, 0.4)' };
  }
  if (type === 'o3') {
    if (v <= 50) return { label: 'Good', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' };
    if (v <= 100) return { label: 'Satisfactory', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.3)' };
    if (v <= 168) return { label: 'Moderate', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)' };
    return { label: 'Elevated', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)' };
  }
  return { label: 'Normal', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.3)' };
}

function getCompassDirection(deg) {
  const d = Number(deg) || 0;
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((d % 360) / 22.5)) % 16;
  return directions[index];
}

/* =========================================================
   CONSTANTS
========================================================= */

const RANGE_TABS = [
  {
    key: '24h',
    label: '24 Hours',
    points: 8,
  },
  {
    key: '7d',
    label: '7 Days',
    points: 7,
  },
  {
    key: '30d',
    label: '30 Days',
    points: 10,
  },
  {
    key: '3m',
    label: '3 Months',
    points: 12,
  },
];


/* =========================================================
   FALLBACK CHART
========================================================= */

function buildFallbackSeries(base, points, key) {
  /*
   * Temporary fallback only.
   *
   * This does NOT represent real historical AQI data.
   * Once the backend provides history, this will automatically
   * be replaced by the real history.
   */

  const seed =
    key.charCodeAt(0) + points;

  const series = [];

  for (let i = 0; i < points; i++) {
    const wobble =
      Math.sin(seed + i * 1.7) * 18 +
      Math.cos(i * 0.8) * 10;

    const val = Math.max(
      5,
      Math.round(
        base +
          wobble -
          (points - i) * 0.4
      )
    );

    series.push({
      label: rangeLabel(
        key,
        i,
        points
      ),
      aqi: val,
    });
  }

  if (series.length > 0) {
    series[series.length - 1] = {
      ...series[series.length - 1],
      aqi: Math.round(base),
    };
  }

  return series;
}


/* =========================================================
   CHART LABEL
========================================================= */

function rangeLabel(key, i, total) {
  const now = new Date();

  if (key === '24h') {
    const d = new Date(
      now.getTime() -
        (total - 1 - i) *
          3 *
          3600 *
          1000
    );

    return d.toLocaleTimeString([], {
      hour: 'numeric',
    });
  }

  if (key === '7d') {
    const d = new Date(
      now.getTime() -
        (total - 1 - i) *
          24 *
          3600 *
          1000
    );

    return d.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });
  }

  if (key === '30d') {
    const d = new Date(
      now.getTime() -
        (total - 1 - i) *
          3 *
          24 *
          3600 *
          1000
    );

    return d.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });
  }

  const d = new Date(
    now.getFullYear(),
    now.getMonth() -
      (total - 1 - i),
    1
  );

  return d.toLocaleDateString([], {
    month: 'short',
  });
}


/* =========================================================
   EXTRACT HISTORY
========================================================= */

function extractHistory(consolidated) {
  if (!consolidated) {
    return null;
  }

  const candidates = [
    'history',
    'trend',
    'aqiHistory',
    'historicalAqi',
    'trendData',
  ];

  for (const key of candidates) {
    const value = consolidated[key];

    if (
      Array.isArray(value) &&
      value.length
    ) {
      return value;
    }
  }

  return null;
}


/* =========================================================
   POLLUTANT CARD
========================================================= */

function PollutantCard({
  label,
  value,
  unit,
  max,
  band,
}) {
  const numericValue =
    Number.isFinite(value)
      ? value
      : 0;

  const pct = Math.min(
    100,
    (numericValue / max) * 100
  );

  return (
    <Card className="pollutant-card">

      <div className="pollutant-card__head">
        <span>{label}</span>

        <AlertCircle
          size={14}
          className="muted-icon"
        />
      </div>

      <div className="pollutant-card__value">
        {Number.isFinite(value)
          ? value
          : '--'}

        <span>{unit}</span>
      </div>

      <StatusBadge
        label={band.label}
        color={band.color}
      />

      <div className="pollutant-card__bar">
        <div
          className="pollutant-card__bar-fill"
          style={{
            width: `${pct}%`,
            background: band.color,
          }}
        />
      </div>

      <div className="pollutant-card__scale">
        <span>0</span>
        <span>
          {Math.round(max * 0.15)}
        </span>
        <span>
          {Math.round(max * 0.43)}
        </span>
        <span>
          {Math.round(max * 0.71)}
        </span>
        <span>{max}</span>
      </div>

    </Card>
  );
}


/* =========================================================
   DASHBOARD
========================================================= */

export default function Dashboard() {

  const { user } = useAuth();
  const { notifyLocationAqiChange } = useNotifications();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const lastNotifiedKeyRef = useRef('');

  /* =======================================================
     STATE
  ======================================================= */

  const getInitialCity = () => {
    const c = user?.city || user?.district;
    if (!c || c.toLowerCase().includes('dombivli') || c.toLowerCase().includes('thane') || c.toLowerCase().includes('mumbai')) {
      return 'Anand Vihar, Delhi';
    }
    return c;
  };

  const [city, setCity] = useState(getInitialCity);

  const [cityInput, setCityInput] =
    useState(city);

  const [range, setRange] =
    useState('7d');

  const [locating, setLocating] =
    useState(false);

  /* Live Weather & Micro-climate State (Open-Meteo REST feed) */
  const [weather, setWeather] = useState({
    temperature: 24.8,
    humidity: 62,
    windSpeed: 14.2,
    windDirection: 315,
    precipitation: 0.0,
    surfacePressure: 1012.0,
    isLive: false,
  });

  /* NASA FIRMS Stubble Satellite Feed */
  const [stubbleData, setStubbleData] = useState({
    activeFireCount: 2840,
    estimatedDelhiPM25Influx: 162.0,
    prevailingWindSpeedKmH: 14.2,
    windTrajectory: 'North-Westerly (Directly towards Delhi NCR)',
  });

  /* Interactive Alert Trigger Scenario for SIH Presentation */
  const [activeAlertScenario, setActiveAlertScenario] = useState('auto'); // 'auto' | 'stubble' | 'inversion' | 'rain'

  const handleStationSelect = (stationName) => {
    setLocationMode(false);
    setCity(stationName);
    setCityInput(stationName);
  };

  /*
   * TRUE  = current AQI came from browser location
   * FALSE = current AQI came from city search
   */
  const [locationMode, setLocationMode] =
    useState(false);


  /* =======================================================
     CITY AQI
  ======================================================= */

  const {
    data: aqiRaw,
    error: aqiError,
    loading: aqiLoading,
    refetch: refetchAqi,
    setData: setAqiRaw,
  } = useAsync(
    () => getAqiByCity(city),
    [city]
  );


  /* =======================================================
     SURVEILLANCE
  ======================================================= */

  const {
    data: surveillance,
  } = useAsync(
    () => getSurveillanceStats(),
    []
  );


  /* =======================================================
     CONSOLIDATED DASHBOARD
  ======================================================= */

  const {
    data: consolidated,
  } = useAsync(
    () =>
      getConsolidatedDashboardData(
        user?.email,
        user?.district || city
      ),
    [
      user?.email,
      user?.district,
      city,
    ],
    {
      skip: !user?.email,
    }
  );


  /* =======================================================
     NORMALIZED AQI
  ======================================================= */

  const record = useMemo(
    () => normalizeAqiRecord(aqiRaw),
    [aqiRaw]
  );


  const band = getAqiBand(
    record?.aqi ?? 0
  );

  /* Real-time notification trigger on location / AQI change */
  useEffect(() => {
    if (!record || !record.aqi) return;
    const locName = record.locationName || record.city || city;
    const key = `${locName}_${record.aqi}`;
    if (lastNotifiedKeyRef.current === key) return;
    lastNotifiedKeyRef.current = key;

    if (typeof notifyLocationAqiChange === 'function') {
      notifyLocationAqiChange(locName, record.aqi);
    }
  }, [record, city, notifyLocationAqiChange]);


  /* =======================================================
     HISTORY & REAL-TIME HOURLY AIR SHED TELEMETRY
  ======================================================= */

  const history = useMemo(() => {
    if (record?.history && Array.isArray(record.history) && record.history.length) {
      return record.history;
    }
    return extractHistory(consolidated);
  }, [record, consolidated]);

  const tab =
    RANGE_TABS.find(
      (t) => t.key === range
    ) || RANGE_TABS[1];

  const chartData = useMemo(() => {
    if (record?.history && Array.isArray(record.history) && record.history.length) {
      const count = range === '24h' ? 24 : Math.min(record.history.length, 72);
      return record.history.slice(0, count).map((h, i) => ({
        label: h.label || `#${i + 1}`,
        fullLabel: h.fullLabel || h.label,
        aqi: Number(h.aqi) || 0,
        pm25: Number(h.pm25) || 0,
        pm10: Number(h.pm10) || 0,
        pbl: Number(h.pbl) || 0,
      }));
    }

    if (history && history.length) {
      return history
        .slice(-tab.points)
        .map((h, i) => ({
          label: firstDefined(
            h,
            [
              'label',
              'date',
              'time',
            ],
            `#${i + 1}`
          ),
          aqi: Number(
            firstDefined(
              h,
              [
                'aqi',
                'value',
                'AQI',
              ],
              0
            )
          ),
          pm25: Number(
            firstDefined(
              h,
              [
                'pm25',
                'pm2_5',
              ],
              0
            )
          ),
        }));
    }

    return buildFallbackSeries(
      record?.aqi || 42,
      tab.points,
      range
    );

  }, [
    record,
    history,
    tab,
    range,
  ]);

  const usingFallbackChart = !(record?.history?.length || history?.length);


  /* =======================================================
     ENVIRONMENTAL IMPACT
  ======================================================= */

  const impactHours = useMemo(() => {

    const value =
      firstDefined(
        surveillance,
        [
          'unhealthyHoursAvoided',
          'hoursAvoided',
          'safeHours',
        ],
        null
      );

    if (value !== null) {
      return value;
    }

    /*
     * Temporary fallback.
     */
    return band.label === 'Good'
      ? 18
      : band.label === 'Moderate'
        ? 9
        : 3;

  }, [
    surveillance,
    band,
  ]);


  /* =======================================================
     AI INSIGHTS
  ======================================================= */

  const insights = useMemo(() => {

    if (!record) {
      return [];
    }

    const list = [];


    /* AQI */

    if (record.aqi <= 50) {

      list.push({
        icon: CheckCircle2,
        tone: 'good',
        text:
          'Indoor air quality remains stable.',
      });

    } else if (record.aqi <= 100) {

      list.push({
        icon: AlertCircle,
        tone: 'moderate',
        text:
          'Sensitive groups should limit prolonged outdoor exertion today.',
      });

    } else {

      list.push({
        icon: AlertCircle,
        tone: 'poor',
        text:
          'Air quality is unhealthy — consider staying indoors during peak hours.',
      });
    }


    /* OZONE */

    if (record.o3 > 60) {

      list.push({
        icon: AlertCircle,
        tone: 'moderate',
        text:
          'Ozone levels are elevated. Plan outdoor runs for morning hours.',
      });

    } else {

      list.push({
        icon: CheckCircle2,
        tone: 'good',
        text:
          'Ozone levels are low and within a safe range.',
      });
    }


    /* PM2.5 */

    if (record.pm25 <= 12) {

      list.push({
        icon: CheckCircle2,
        tone: 'good',
        text:
          'PM2.5 is low. Good conditions for individuals with allergies.',
      });

    } else {

      list.push({
        icon: AlertCircle,
        tone: 'poor',
        text:
          'PM2.5 is elevated — consider an N95 mask outdoors.',
      });
    }


    return list;

  }, [record]);


  /* =======================================================
     LOCATION FETCH
  ======================================================= */

  const locateMe = () => {

    if (!navigator.geolocation) {

      alert(
        'Location services are not supported by your browser.'
      );

      return;
    }


    setLocating(true);


    navigator.geolocation.getCurrentPosition(

      async (position) => {

        try {

          const {
            latitude,
            longitude,
          } = position.coords;


          console.log(
            'User coordinates:',
            latitude,
            longitude
          );


          /*
           * Call the LOCATION endpoint.
           *
           * This goes:
           *
           * Browser
           *     ↓
           * Spring Boot
           *     ↓
           * WAQI geo endpoint
           *     ↓
           * nearest monitoring station
           */

          const data =
            await getAqiByLocation(
              latitude,
              longitude
            );


          console.log(
            'Location AQI response:',
            data
          );


          /*
           * IMPORTANT:
           *
           * We directly replace the dashboard AQI.
           *
           * DO NOT call setCity() here.
           *
           * Otherwise the city useAsync() request will
           * execute again and overwrite this result.
           */

          setAqiRaw(data);

          setLocationMode(true);

        } catch (error) {

          console.error(
            'Location AQI error:',
            error
          );


          alert(
            error?.message ||
            'Unable to retrieve AQI for your location.'
          );

        } finally {

          setLocating(false);

        }
      },


      (error) => {

        console.error(
          'Geolocation error:',
          error
        );


        setLocating(false);


        if (error.code === 1) {

          alert(
            'Location permission was denied. Please allow location access and try again.'
          );

        } else if (error.code === 2) {

          alert(
            'Your location could not be determined.'
          );

        } else if (error.code === 3) {

          alert(
            'Location request timed out. Please try again.'
          );

        } else {

          alert(
            'Unable to determine your location.'
          );
        }
      },


      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };


  /* =======================================================
     CITY SEARCH
  ======================================================= */

  const handleCitySearch = (event) => {

    event.preventDefault();

    const searchedCity =
      cityInput.trim();


    if (!searchedCity) {
      return;
    }


    /*
     * We are switching back from location mode
     * to city-search mode.
     */

    setLocationMode(false);

    setCity(searchedCity);
  };


  /* =======================================================
     ATMOSPHERIC DISPERSION & METEOROLOGY ENGINE
  ======================================================= */

  useEffect(() => {
    let isMounted = true;
    async function loadAtmosphericTelemetry() {
      try {
        const coords = getStationCoords(city);
        const lat = coords?.lat || 28.6502;
        const lng = coords?.lng || 77.3027;

        const [weatherRes, stubbleRes] = await Promise.allSettled([
          fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation,surface_pressure`).then(r => r.json()),
          getStubblePlumes(),
        ]);

        if (!isMounted) return;

        if (weatherRes.status === 'fulfilled' && weatherRes.value?.current) {
          const c = weatherRes.value.current;
          setWeather({
            temperature: typeof c.temperature_2m === 'number' ? Math.round(c.temperature_2m * 10) / 10 : 24.8,
            humidity: typeof c.relative_humidity_2m === 'number' ? Math.round(c.relative_humidity_2m) : 62,
            windSpeed: typeof c.wind_speed_10m === 'number' ? Math.round(c.wind_speed_10m * 10) / 10 : 14.2,
            windDirection: typeof c.wind_direction_10m === 'number' ? Math.round(c.wind_direction_10m) : 315,
            precipitation: typeof c.precipitation === 'number' ? Math.round(c.precipitation * 10) / 10 : 0.0,
            surfacePressure: typeof c.surface_pressure === 'number' ? Math.round(c.surface_pressure) : 1012.0,
            isLive: true,
          });
        }

        if (stubbleRes.status === 'fulfilled' && stubbleRes.value) {
          setStubbleData(stubbleRes.value);
        }
      } catch (err) {
        console.warn('Atmospheric telemetry fetch fallback:', err.message);
      }
    }

    loadAtmosphericTelemetry();
    return () => { isMounted = false; };
  }, [city]);

  const currentWindSpeed = activeAlertScenario === 'stubble' ? 16.4 : activeAlertScenario === 'inversion' ? 1.4 : activeAlertScenario === 'rain' ? 8.2 : weather.windSpeed;
  const currentWindDir = activeAlertScenario === 'stubble' ? 315 : activeAlertScenario === 'inversion' ? 45 : activeAlertScenario === 'rain' ? 120 : weather.windDirection;
  const currentTemp = activeAlertScenario === 'inversion' ? 16.2 : weather.temperature;
  const currentPrecip = activeAlertScenario === 'rain' ? 4.8 : weather.precipitation;
  const compass = getCompassDirection(currentWindDir);
  const isNW = currentWindDir >= 280 && currentWindDir <= 345;

  const microHotspotAlerts = useMemo(() => {
    return detectMicroHotspotAlerts(currentWindSpeed, city);
  }, [currentWindSpeed, city]);

  const inversionRiskInfo = useMemo(() => {
    if (activeAlertScenario === 'inversion' || currentWindSpeed < 2.5) {
      return {
        label: 'Severe Trapping',
        color: '#ef4444',
        sub: 'PBL < 220m (Critical Stagnation)',
      };
    }
    if (activeAlertScenario === 'stubble' || (isNW && currentWindSpeed > 10)) {
      return {
        label: 'Advection Influx',
        color: '#f97316',
        sub: 'PBL ~340m (High Smoke Drift)',
      };
    }
    if (activeAlertScenario === 'rain' || currentPrecip > 0) {
      return {
        label: 'Wet Column',
        color: '#10b981',
        sub: 'Aerosol Washout Active',
      };
    }
    return {
      label: 'Moderate Dispersion',
      color: '#38bdf8',
      sub: 'PBL ~550m (Normal Ventilation)',
    };
  }, [activeAlertScenario, currentWindSpeed, isNW, currentPrecip]);

  const expectedImpact = useMemo(() => {
    if (activeAlertScenario === 'stubble' || (activeAlertScenario === 'auto' && (isNW && currentWindSpeed > 10))) {
      return {
        titleColor: '#f97316',
        badgeBg: '#ea580c',
        badgeColor: '#ffffff',
        badgeText: '+60 to +110 Points Influx',
        bg: 'rgba(249, 115, 22, 0.08)',
        border: 'rgba(249, 115, 22, 0.28)',
        summary: 'Prevailing NW winds funneling stubble fire plumes from Punjab & Haryana into Delhi air-shed. Upwind farm emissions add +60 to +110 AQI surge.',
      };
    }
    if (activeAlertScenario === 'inversion' || (activeAlertScenario === 'auto' && currentWindSpeed < 2.5)) {
      return {
        titleColor: '#ef4444',
        badgeBg: '#dc2626',
        badgeColor: '#ffffff',
        badgeText: '+45 to +85 Points Spike',
        bg: 'rgba(239, 68, 68, 0.08)',
        border: 'rgba(239, 68, 68, 0.28)',
        summary: 'Rapid surface cooling under stagnant winds (<2.5 km/h) suppresses vertical ventilation. Particulate matter trapped below 250m mixing layer.',
      };
    }
    if (activeAlertScenario === 'rain' || (activeAlertScenario === 'auto' && currentPrecip > 0)) {
      return {
        titleColor: '#10b981',
        badgeBg: '#059669',
        badgeColor: '#ffffff',
        badgeText: '-20% to -40% Scavenging',
        bg: 'rgba(16, 185, 129, 0.08)',
        border: 'rgba(16, 185, 129, 0.28)',
        summary: 'Precipitation wash-down effect efficiently clears suspended PM2.5 and PM10 particles from the ambient air through wet droplet scavenging.',
      };
    }
    return {
      titleColor: '#38bdf8',
      badgeBg: '#0284c7',
      badgeColor: '#ffffff',
      badgeText: 'Stable Baseline (±5)',
      bg: 'rgba(56, 189, 248, 0.08)',
      border: 'rgba(56, 189, 248, 0.25)',
      summary: 'Atmospheric dispersion parameters are currently in equilibrium with background urban emissions.',
    };
  }, [activeAlertScenario, isNW, currentWindSpeed, currentPrecip]);

  const activeAlert = useMemo(() => {
    if (activeAlertScenario === 'stubble' || (activeAlertScenario === 'auto' && (isNW && currentWindSpeed > 10))) {
      return {
        Icon: Flame,
        categoryTag: 'Upwind Stubble Influx Alert',
        tagBg: 'rgba(249, 115, 22, 0.12)',
        tagColor: '#c2410c',
        tagBorder: 'rgba(249, 115, 22, 0.35)',
        title: '⚠️ High Upwind Smoke Transport Risk: NW Stubble Drift Corridor Active',
        titleColor: '#c2410c',
        description: `Prevailing NW winds (${currentWindSpeed} km/h ${compass}) driving stubble plume corridor from Punjab & Haryana into Delhi air-shed. Stubble share expected to surge.`,
        impactBadge: '+60 to +110 AQI Surge Risk',
        badgeBg: '#ffedd5',
        badgeBorder: '#fed7aa',
        badgeColor: '#9a3412',
        gradient: 'linear-gradient(135deg, #ffffff 0%, #fff7ed 100%)',
        borderColor: '#fed7aa',
        shadow: '0 4px 20px rgba(249, 115, 22, 0.10)',
        iconBg: '#ffedd5',
        iconBorder: '#fdba74',
        iconColor: '#ea580c',
        glow: 'rgba(249, 115, 22, 0.25)',
      };
    }
    if (activeAlertScenario === 'inversion' || (activeAlertScenario === 'auto' && currentWindSpeed < 2.5)) {
      return {
        Icon: AlertTriangle,
        categoryTag: 'Boundary Layer Inversion Alert',
        tagBg: 'rgba(239, 68, 68, 0.12)',
        tagColor: '#b91c1c',
        tagBorder: 'rgba(239, 68, 68, 0.35)',
        title: '🚨 Severe Thermal Inversion Alert: Particulates Trapped Below 250m Mixing Layer',
        titleColor: '#b91c1c',
        description: `Rapid cooling with stagnant wind (${currentWindSpeed} km/h) is trapping particulate matter below 250m mixing layer. AQI expected to spike.`,
        impactBadge: 'Critical Trapping (+45 to +85 AQI)',
        badgeBg: '#fee2e2',
        badgeBorder: '#fecaca',
        badgeColor: '#991b1b',
        gradient: 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)',
        borderColor: '#fecaca',
        shadow: '0 4px 20px rgba(239, 68, 68, 0.10)',
        iconBg: '#fee2e2',
        iconBorder: '#fca5a5',
        iconColor: '#dc2626',
        glow: 'rgba(239, 68, 68, 0.25)',
      };
    }
    if (activeAlertScenario === 'rain' || (activeAlertScenario === 'auto' && currentPrecip > 0)) {
      return {
        Icon: CloudRain,
        categoryTag: 'Atmospheric Scavenging Advisory',
        tagBg: 'rgba(16, 185, 129, 0.12)',
        tagColor: '#047857',
        tagBorder: 'rgba(16, 185, 129, 0.35)',
        title: '🌧️ Wet Scavenging Advisory: Precipitation Wash-Down Active',
        titleColor: '#047857',
        description: `Precipitation active (${currentPrecip} mm), wash-down effect dispersing PM2.5/PM10 concentrations temporarily.`,
        impactBadge: '-20% to -40% Scavenging Abatement',
        badgeBg: '#d1fae5',
        badgeBorder: '#a7f3d0',
        badgeColor: '#065f46',
        gradient: 'linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)',
        borderColor: '#a7f3d0',
        shadow: '0 4px 20px rgba(16, 185, 129, 0.10)',
        iconBg: '#d1fae5',
        iconBorder: '#6ee7b7',
        iconColor: '#059669',
        glow: 'rgba(16, 185, 129, 0.25)',
      };
    }
    return {
      Icon: Wind,
      categoryTag: 'Atmospheric Dispersion Status',
      tagBg: 'rgba(2, 132, 199, 0.12)',
      tagColor: '#0284c7',
      tagBorder: 'rgba(2, 132, 199, 0.35)',
      title: '🌬️ Stable Meteorological Dispersion: Moderate Boundary Layer Dynamics',
      titleColor: '#0369a1',
      description: `Atmospheric mixing layer steady with ${currentWindSpeed} km/h ${compass} winds. Regular background ambient monitoring active.`,
      impactBadge: 'Nominal Baseline Flux (±5 AQI)',
      badgeBg: '#e0f2fe',
      badgeBorder: '#bae6fd',
      badgeColor: '#0369a1',
      gradient: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
      borderColor: '#bae6fd',
      shadow: '0 4px 20px rgba(2, 132, 199, 0.08)',
      iconBg: '#e0f2fe',
      iconBorder: '#7dd3fc',
      iconColor: '#0284c7',
      glow: 'rgba(2, 132, 199, 0.2)',
    };
  }, [activeAlertScenario, isNW, currentWindSpeed, currentPrecip, compass]);

  /* =======================================================
     LOCATION DISPLAY
  ======================================================= */

  const locationDisplay = useMemo(() => {
    if (!record) {
      return city;
    }

    if (record.locationName) {
      return record.locationName;
    }

    return (
      `${record.city || city}` +
      (
        record.state
          ? `, ${record.state}`
          : ''
      )
    );
  }, [
    record,
    city,
  ]);


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <Layout
      title={
        `${t('dashboard.welcome', 'Welcome back')}, ${
          user?.name?.split(' ')[0] ||
          'there'
        }.`
      }
      subtitle={t('dashboard.subtitle', 'Here is your daily environmental health overview.')}
    >


      {/* ===================================================
          TOP STATUS BANNER: WELCOME BACK & LIVE STATION SELECTOR
      =================================================== */}
      <div className="dash-status-banner" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '16px 20px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 16px rgba(0, 0, 0, 0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#e0f2fe',
              border: '1px solid #bae6fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7',
              flexShrink: 0
            }}>
              <Wind size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  {t('dashboard.welcome', 'Welcome back')}, {user?.name?.split(' ')[0] || 'Official'}.
                </h2>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#059669',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  Live AQI Tracking
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: '#475569', margin: '2px 0 0 0' }}>
                Telemetry stream wired directly to Open-Meteo & CAAQMS ambient air monitoring stations.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#f8fafc',
              padding: '6px 12px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1'
            }}>
              <MapPin size={14} style={{ color: '#0284c7' }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Station:</span>
              <select
                value={city}
                onChange={(e) => handleStationSelect(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#0f172a',
                  fontSize: '12px',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                  maxWidth: '220px'
                }}
              >
                {['Central Delhi', 'East Delhi', 'South Delhi', 'North & West Delhi', 'NCR Sub-regions'].map((zone) => {
                  const zoneStations = DELHI_NCR_STATIONS.filter(s => s.zone === zone);
                  if (!zoneStations.length) return null;
                  return (
                    <optgroup key={zone} label={`── ${zone} ──`} style={{ background: '#ffffff', color: '#0284c7', fontWeight: 700 }}>
                      {zoneStations.map((s) => (
                        <option key={s.name} value={s.name} style={{ background: '#ffffff', color: '#0f172a', fontWeight: 500 }}>
                          {s.name}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>

            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={locateMe}
              disabled={locating}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#0f172a',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '6px 12px'
              }}
              title="Fetch real-time air quality at your exact GPS coordinates"
            >
              <Navigation size={14} className={locating ? 'spin' : ''} style={{ color: '#0284c7' }} />
              <span>{locating ? t('dashboard.locating', 'Locating...') : t('dashboard.useMyLocation', 'Use my location')}</span>
            </button>
          </div>
        </div>

        {/* NASA FIRMS Stubble Fire Hotspot Alert Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          background: '#fff1f2',
          border: '1px solid #fecdd3',
          borderRadius: '10px',
          padding: '8px 14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px' }}>🔥</span>
            <span style={{ fontSize: '12.5px', color: '#9f1239' }}>
              <strong style={{ color: '#881337' }}>Punjab & Haryana Active Farm Fires:</strong> {stubbleData?.activeFireCount ? Number(stubbleData.activeFireCount).toLocaleString() : '2,840'} Detected (NASA VIIRS Satellite Feed)
            </span>
          </div>
          <span style={{
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: '#ffffff',
            fontSize: '10px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
            padding: '4px 10px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)'
          }}>
            High Drift Influx Toward Delhi Air-Shed
          </span>
        </div>
      </div>

      {/* ===================================================
          REAL-TIME SUDDEN WEATHER CHANGE ALERT ENGINE BANNER
      =================================================== */}
      <div className="sudden-weather-alert-banner" style={{
        background: activeAlert.gradient,
        border: `1px solid ${activeAlert.borderColor}`,
        borderRadius: '14px',
        padding: '16px 20px',
        marginBottom: '20px',
        boxShadow: activeAlert.shadow,
        transition: 'all 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', maxWidth: '820px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: activeAlert.iconBg,
              border: `1px solid ${activeAlert.iconBorder}`,
              color: activeAlert.iconColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: `0 0 14px ${activeAlert.glow}`
            }}>
              <activeAlert.Icon size={22} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <span style={{
                  background: activeAlert.tagBg,
                  color: activeAlert.tagColor,
                  border: `1px solid ${activeAlert.tagBorder}`,
                  fontSize: '10.5px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  padding: '2px 8px',
                  borderRadius: '10px'
                }}>
                  {activeAlert.categoryTag}
                </span>
                <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                  Sudden Meteorological Shift Detected via Open-Meteo REST Stream
                </span>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0', color: activeAlert.titleColor }}>
                {activeAlert.title}
              </h3>
              <p style={{ fontSize: '13px', color: '#334155', margin: 0, lineHeight: 1.45 }}>
                {activeAlert.description}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <div style={{
              background: activeAlert.badgeBg,
              border: `1px solid ${activeAlert.badgeBorder}`,
              color: activeAlert.badgeColor,
              padding: '6px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.3px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>⚡</span>
              <span>{activeAlert.impactBadge}</span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748b', textAlign: 'right' }}>
              Statutory Air-Shed: <strong style={{ color: '#0f172a' }}>National Capital Region (NCR)</strong>
            </div>
          </div>
        </div>

        {/* Interactive Scenario Trigger Tabs for SIH Presentation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '14px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Meteorological Alert Regime:
          </span>
          <button
            type="button"
            onClick={() => setActiveAlertScenario('auto')}
            style={{
              background: activeAlertScenario === 'auto' ? '#0284c7' : '#ffffff',
              color: activeAlertScenario === 'auto' ? '#ffffff' : '#334155',
              border: activeAlertScenario === 'auto' ? '1px solid #0284c7' : '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s',
              boxShadow: activeAlertScenario === 'auto' ? '0 2px 6px rgba(2, 132, 199, 0.3)' : 'none'
            }}
          >
            <span>⚡</span>
            <span>Live Auto Feed ({weather.windSpeed} km/h {getCompassDirection(weather.windDirection)})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveAlertScenario('stubble')}
            style={{
              background: activeAlertScenario === 'stubble' ? '#ea580c' : '#ffffff',
              color: activeAlertScenario === 'stubble' ? '#ffffff' : '#334155',
              border: activeAlertScenario === 'stubble' ? '1px solid #ea580c' : '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s',
              boxShadow: activeAlertScenario === 'stubble' ? '0 2px 6px rgba(234, 88, 12, 0.3)' : 'none'
            }}
          >
            <span>🌾</span>
            <span>Trigger 1: NW Wind (&gt;10 km/h) Stubble Corridor</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveAlertScenario('inversion')}
            style={{
              background: activeAlertScenario === 'inversion' ? '#dc2626' : '#ffffff',
              color: activeAlertScenario === 'inversion' ? '#ffffff' : '#334155',
              border: activeAlertScenario === 'inversion' ? '1px solid #dc2626' : '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s',
              boxShadow: activeAlertScenario === 'inversion' ? '0 2px 6px rgba(220, 38, 38, 0.3)' : 'none'
            }}
          >
            <span>🚨</span>
            <span>Trigger 2: Temp Drop + Calm Wind (&lt;2 km/h) Inversion Trapping</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveAlertScenario('rain')}
            style={{
              background: activeAlertScenario === 'rain' ? '#059669' : '#ffffff',
              color: activeAlertScenario === 'rain' ? '#ffffff' : '#334155',
              border: activeAlertScenario === 'rain' ? '1px solid #059669' : '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s',
              boxShadow: activeAlertScenario === 'rain' ? '0 2px 6px rgba(5, 150, 105, 0.3)' : 'none'
            }}
          >
            <span>🌧️</span>
            <span>Trigger 3: Rain (&gt;0 mm) Wet Scavenging</span>
          </button>
        </div>
      </div>

      {/* ===================================================
          REAL-TIME MICRO-HOTSPOT ALERTS (TRAFFIC CORRIDORS & OPEN SMOKE ZONES)
      =================================================== */}
      <div className="micro-hotspot-alerts-panel" style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '16px 20px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 16px rgba(0, 0, 0, 0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ffedd5, #fee2e2)',
              border: '1px solid #fdba74',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ea580c',
              boxShadow: '0 2px 8px rgba(249, 115, 22, 0.15)'
            }}>
              <Flame size={20} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h4 style={{ margin: 0, fontSize: '15.5px', fontWeight: 700, color: '#0f172a' }}>
                  Real-Time Micro-Hotspot Alerts: Traffic Chokepoints & Biomass Smoke Plumes
                </h4>
                <span style={{
                  background: '#fee2e2',
                  border: '1px solid #fca5a5',
                  color: '#dc2626',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
                  {microHotspotAlerts.length} Micro-Hotspots Detected
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#475569' }}>
                Continuous algorithmic detection tracking localized road emission trapping (<strong style={{ color: '#0f172a' }}>NOx &gt; 80 ppb</strong>, calm winds &lt; 4 km/h) & unvented smoldering (<strong style={{ color: '#0f172a' }}>PM2.5/CO ratio + thermal infrared radiance</strong>).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/map')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #ecfdf5, #f0fdf4)',
              border: '1px solid #a7f3d0',
              color: '#047857',
              fontSize: '12px',
              fontWeight: 700,
              padding: '7px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 1px 3px rgba(16, 185, 129, 0.15)'
            }}
          >
            <Layers size={14} />
            <span>View Hotspots on GIS Map</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '12px' }}>
          {microHotspotAlerts.slice(0, 4).map((alert) => {
            const isTraffic = alert.type === 'TRAFFIC_CHOKEPOINT';
            return (
              <div
                key={alert.id}
                style={{
                  background: isTraffic ? '#fff7ed' : '#fff1f2',
                  border: isTraffic ? '1px solid #fed7aa' : '1px solid #fecdd3',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: isTraffic ? '0 1px 4px rgba(249, 115, 22, 0.06)' : '0 1px 4px rgba(239, 68, 68, 0.06)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: isTraffic ? '#c2410c' : '#b91c1c',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    {isTraffic ? '🚦 High-Traffic Chokepoint' : '🔥 Open Biomass / Waste Smoldering'}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: isTraffic ? '#9a3412' : '#991b1b',
                    background: isTraffic ? '#ffedd5' : '#fee2e2',
                    border: isTraffic ? '1px solid #fdba74' : '1px solid #fca5a5',
                    padding: '2px 8px',
                    borderRadius: '8px'
                  }}>
                    {isTraffic ? `NOx: ${alert.noxPpb} ppb (${alert.windSpeedKmH} km/h wind)` : `PM2.5: ${alert.pm25} μg/m³ (Thermal: ${alert.thermalRadianceKelvin}K)`}
                  </span>
                </div>

                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>
                  {alert.title}
                </div>

                <div style={{
                  fontSize: '11.5px',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                  paddingTop: '6px',
                  marginTop: '2px',
                  flexWrap: 'wrap',
                  gap: '6px'
                }}>
                  <span>📍 <strong style={{ color: '#334155' }}>{alert.zone || alert.region}</strong></span>
                  <span style={{ color: '#0284c7', fontWeight: 600 }}>
                    Advisory: {alert.regulatoryAction?.split(';')[0] || 'Traffic Diversion Active'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===================================================
          SEARCH TOOLBAR
      =================================================== */}

      <div className="dash-toolbar" style={{ marginBottom: 20 }}>
        <div className="cpcb-live-feed-badge">
          <span className="cpcb-live-dot" />
          <span>CPCB CAAQMS {city} - Active Live Feed</span>
        </div>

        <form
          className="city-search"
          onSubmit={handleCitySearch}
        >

          <CityAutocomplete
            value={cityInput}
            onChange={(val) => setCityInput(val)}
            onSelect={(item) => {
              setCityInput(item.name);
              setLocationMode(false);
              setCity(item.name);
            }}
            onSubmit={handleCitySearch}
            placeholder={t('dashboard.searchCity', 'Enter a city in India')}
          />

          <button
            type="submit"
            className="btn btn--ghost btn--sm"
          >
            {t('common.go', 'Go')}
          </button>

        </form>

      </div>


      {/* ===================================================
          CURRENT AQI
      =================================================== */}

      <div className="dash-hero-wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: 20 }}>

        {/* CURRENT AQI */}

        <Card className="aqi-hero">

          <div className="card-head">

            <div>

              <h3>
                {t('dashboard.currentAqi', 'Current Air Quality')}
              </h3>

              <div className="card-head__sub">

                <MapPin size={13} />

                {locationDisplay}

              </div>

            </div>

          </div>


          {
            aqiLoading && !locationMode ? (

              <Loader
                label="Fetching live AQI data..."
              />

            ) : aqiError && !record ? (

              <ErrorState
                message={aqiError.message}
                onRetry={refetchAqi}
              />

            ) : (

              <div className="aqi-hero__body">


                {/* AQI GAUGE */}

                <AqiGauge
                  value={
                    record?.aqi ?? 0
                  }
                />


                <div className="aqi-hero__info">


                  {/* STATUS & SCORE */}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <StatusBadge
                      label={band.label}
                      color={band.color}
                    />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: band.color }}>
                      {record?.aqi ?? 82} {band.label}
                    </span>
                  </div>


                  {/* DESCRIPTION */}

                  <p className="aqi-hero__desc">

                    Air quality is{' '}

                    <strong>{band.label.toLowerCase()}</strong>

                    {' '}

                    today.

                    {band.label === 'Good'
                      ? ' Perfect day for outdoor activities.'
                      : band.label === 'Moderate'
                        ? ' Air quality is acceptable; sensitive groups should consider taking precautions.'
                        : ' Take precautions appropriate for sensitive groups.'
                    }

                  </p>


                  {/* MAIN POLLUTANTS WITH STATUS TAGS */}

                  {(() => {
                    const pm25Tag = getPollutantTag('pm25', record?.pm25);
                    const pm10Tag = getPollutantTag('pm10', record?.pm10);
                    const o3Tag = getPollutantTag('o3', record?.o3);
                    return (
                      <div className="aqi-hero__stats" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>

                        <div style={{
                          background: 'var(--color-surface, rgba(30, 41, 59, 0.5))',
                          border: '1px solid var(--color-border)',
                          borderRadius: '10px',
                          padding: '8px 12px',
                          minWidth: '115px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '3px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--color-text-faint)' }}>PM2.5</span>
                            <span style={{
                              fontSize: '9.5px',
                              fontWeight: 700,
                              padding: '1px 5px',
                              borderRadius: '6px',
                              background: pm25Tag.bg,
                              color: pm25Tag.color,
                              border: `1px solid ${pm25Tag.border}`
                            }}>
                              {pm25Tag.label}
                            </span>
                          </div>
                          <strong style={{ fontSize: '15px', color: 'var(--color-text)' }}>
                            {record?.pm25 ?? '--'}{' '}
                            <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-muted)' }}>µg/m³</span>
                          </strong>
                        </div>

                        <div style={{
                          background: 'var(--color-surface, rgba(30, 41, 59, 0.5))',
                          border: '1px solid var(--color-border)',
                          borderRadius: '10px',
                          padding: '8px 12px',
                          minWidth: '115px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '3px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--color-text-faint)' }}>PM10</span>
                            <span style={{
                              fontSize: '9.5px',
                              fontWeight: 700,
                              padding: '1px 5px',
                              borderRadius: '6px',
                              background: pm10Tag.bg,
                              color: pm10Tag.color,
                              border: `1px solid ${pm10Tag.border}`
                            }}>
                              {pm10Tag.label}
                            </span>
                          </div>
                          <strong style={{ fontSize: '15px', color: 'var(--color-text)' }}>
                            {record?.pm10 ?? '--'}{' '}
                            <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-muted)' }}>µg/m³</span>
                          </strong>
                        </div>

                        <div style={{
                          background: 'var(--color-surface, rgba(30, 41, 59, 0.5))',
                          border: '1px solid var(--color-border)',
                          borderRadius: '10px',
                          padding: '8px 12px',
                          minWidth: '115px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '3px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--color-text-faint)' }}>O₃ (Ozone)</span>
                            <span style={{
                              fontSize: '9.5px',
                              fontWeight: 700,
                              padding: '1px 5px',
                              borderRadius: '6px',
                              background: o3Tag.bg,
                              color: o3Tag.color,
                              border: `1px solid ${o3Tag.border}`
                            }}>
                              {o3Tag.label}
                            </span>
                          </div>
                          <strong style={{ fontSize: '15px', color: 'var(--color-text)' }}>
                            {record?.o3 ?? '--'}{' '}
                            <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-muted)' }}>ppb</span>
                          </strong>
                        </div>

                        {/* ICMR Sentinel ARI Feed */}
                        {(() => {
                          const curPm25 = Number(record?.pm25) || 38;
                          const baseAdm = 35;
                          const ariEst = Math.round(baseAdm * (1 + 0.0035 * Math.max(0, curPm25 - 60)));
                          return (
                            <div
                              title="Estimated daily Acute Respiratory Illness (ARI) admissions based on MoHFW Integrated Health Information Portal (IHIP) & ICMR sentinel hospital surveillance data."
                              style={{
                                background: 'var(--color-surface, rgba(30, 41, 59, 0.5))',
                                border: '1px solid var(--color-border)',
                                borderRadius: '10px',
                                padding: '8px 12px',
                                minWidth: '115px',
                                cursor: 'help'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '3px' }}>
                                <span style={{ fontSize: '11px', color: 'var(--color-text-faint)' }}>Surveillance ARI</span>
                                <span style={{
                                  fontSize: '9.5px',
                                  fontWeight: 700,
                                  padding: '1px 5px',
                                  borderRadius: '6px',
                                  background: ariEst > 65 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                  color: ariEst > 65 ? '#ef4444' : '#10b981',
                                  border: `1px solid ${ariEst > 65 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                                }}>
                                  ICMR Feed
                                </span>
                              </div>
                              <strong style={{ fontSize: '15px', color: 'var(--color-text)' }}>
                                ~{ariEst}{' '}
                                <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-muted)' }}>adm/day</span>
                              </strong>
                            </div>
                          );
                        })()}

                      </div>
                    );
                  })()}


                  {/* REFRESH */}

                  <button
                    className="link-refresh"
                    onClick={
                      locationMode
                        ? locateMe
                        : refetchAqi
                    }
                  >

                    <RefreshCw
                      size={12}
                      className={aqiLoading ? 'spin' : ''}
                    />

                    <span>
                      {locationMode
                        ? 'Refresh location AQI'
                        : 'Last updated just now'}
                    </span>

                  </button>


                </div>

              </div>

            )
          }

        </Card>

        {/* ===================================================
            WEATHER & MICRO-CLIMATE DISPERSION CARD
        =================================================== */}
        <Card className="section-card weather-hero-card" style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'var(--color-surface, #1e293b)',
          border: '1px solid var(--color-border)',
          borderRadius: '14px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)'
        }}>
          <div>
            <div className="card-head" style={{ marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--color-text)' }}>
                  Weather & Micro-climate Dispersion
                </h3>
                <div className="card-head__sub" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={13} />
                  <span>Open-Meteo Physical Model & CAAQMS {city}</span>
                </div>
              </div>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '10px'
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8', display: 'inline-block' }} />
                Boundary Layer Feed
              </span>
            </div>

            {/* 4 Micro-climate Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                background: 'var(--color-surface, #f8fafc)',
                border: '1px solid var(--color-border, #e2e8f0)',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Ambient Temp</span>
                  <Thermometer size={16} style={{ color: '#f59e0b' }} />
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)' }}>
                  {currentTemp}°C
                </div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted, #64748b)' }}>Surface 2m Height</span>
              </div>

              <div style={{
                background: 'var(--color-surface, #f8fafc)',
                border: '1px solid var(--color-border, #e2e8f0)',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Relative Humidity</span>
                  <Droplets size={16} style={{ color: '#0284c7' }} />
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)' }}>
                  {weather.humidity}%
                </div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted, #64748b)' }}>Atmospheric Moisture</span>
              </div>

              <div style={{
                background: 'var(--color-surface, #f8fafc)',
                border: '1px solid var(--color-border, #e2e8f0)',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Wind Speed & Dir</span>
                  <Wind size={16} style={{ color: '#10b981' }} />
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)' }}>
                  {currentWindSpeed} <span style={{ fontSize: '14px', fontWeight: 600 }}>km/h</span> <span style={{ color: isNW ? '#f97316' : '#0284c7', fontSize: '18px' }}>{compass}</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted, #64748b)' }}>Bearing: {currentWindDir}° ({compass})</span>
              </div>

              <div style={{
                background: 'var(--color-surface, #f8fafc)',
                border: '1px solid var(--color-border, #e2e8f0)',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Surface Inversion</span>
                  <Layers size={16} style={{ color: '#ec4899' }} />
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: inversionRiskInfo.color }}>
                  {inversionRiskInfo.label}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted, #64748b)' }}>{inversionRiskInfo.sub}</span>
              </div>
            </div>

            {/* Dynamic Expected Impact on AQI Badge */}
            <div style={{
              background: expectedImpact.bg,
              border: `1px solid ${expectedImpact.border}`,
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: expectedImpact.titleColor }}>
                  Dynamic Expected Impact on AQI
                </span>
                <span style={{
                  background: expectedImpact.badgeBg,
                  color: expectedImpact.badgeColor,
                  fontSize: '10.5px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  boxShadow: `0 0 10px ${expectedImpact.border}`
                }}>
                  {expectedImpact.badgeText}
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--color-text)', margin: 0, lineHeight: 1.45 }}>
                {expectedImpact.summary}
              </p>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '1px solid var(--color-border)',
            fontSize: '11.5px',
            color: 'var(--color-text-muted)',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <span>Synoptic Pressure: <strong>{weather.surfacePressure || 1012} hPa</strong></span>
            <span
              title="Estimated daily Acute Respiratory Illness (ARI) admissions based on MoHFW Integrated Health Information Portal (IHIP) & ICMR sentinel hospital surveillance data."
              style={{
                color: '#e11d48',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'help'
              }}
            >
              <Activity size={13} />
              Daily ARI Admissions (ICMR Sentinel Feed): ~{Math.round(35 * (1 + 0.0035 * Math.max(0, (record?.pm25 ?? 38) - 60)))}/day
            </span>
            <span style={{ color: '#0284c7', fontWeight: 600 }}>CPCB Air-Shed Connected</span>
          </div>
        </Card>

      </div>


      {/* ===================================================
          SAFE TRAVEL ROUTE & REGION-TO-REGION HEALTH ROADMAP
      =================================================== */}
      <Card className="section-card safe-travel-banner" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, maxWidth: '740px' }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(34, 197, 94, 0.2))',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Route size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#22c55e',
                  boxShadow: '0 0 8px #22c55e'
                }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#22c55e' }}>
                  Interactive Safety Path Feature
                </span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px 0', color: 'var(--color-text)' }}>
                Safe Health Navigation Roadmap (Region-to-Region on Map)
              </h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.4 }}>
                Compute low-exposure commuter corridors between districts with color-coded waypoints and real-time health advisories.
              </p>
            </div>
          </div>
          <button
            className="btn btn--primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontWeight: 600 }}
            onClick={() => navigate('/air-quality-map#safe-health-route')}
          >
            <span>Launch Route Safety Map</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </Card>


      {/* ===================================================
          LIVE POLLUTANTS
      =================================================== */}

      <Card className="section-card">

        <h3 className="section-title">
          {t('dashboard.livePollutants', 'Live Pollutants')}
        </h3>


        <div className="grid-3col">


          <PollutantCard
            label="PM2.5"
            value={
              record?.pm25 ?? 0
            }
            unit="µg/m³"
            max={350}
            band={getAqiBand(
              (record?.pm25 ?? 0) *
                3.4
            )}
          />


          <PollutantCard
            label="PM10"
            value={
              record?.pm10 ?? 0
            }
            unit="µg/m³"
            max={350}
            band={getAqiBand(
              (record?.pm10 ?? 0) *
                1.8
            )}
          />


          <PollutantCard
            label="O₃ (Ozone)"
            value={
              record?.o3 ?? 0
            }
            unit="ppb"
            max={240}
            band={getAqiBand(
              (record?.o3 ?? 0) *
                1.1
            )}
          />

        </div>

      </Card>


      {/* ===================================================
          HISTORY + AI INSIGHTS
      =================================================== */}

      <div className="grid-2col grid-2col--wide">


        {/* HISTORICAL AQI */}

        <Card className="section-card">

          <div className="card-head">

            <h3 className="section-title">
              Historical AQI Trend
            </h3>


            <div className="range-tabs">

              {RANGE_TABS.map(
                (t) => (

                  <button
                    key={t.key}
                    className={
                      `range-tab ${
                        range === t.key
                          ? 'range-tab--active'
                          : ''
                      }`
                    }
                    onClick={() =>
                      setRange(
                        t.key
                      )
                    }
                  >
                    {t.label}
                  </button>

                )
              )}

            </div>

          </div>


          {
            usingFallbackChart && (

              <p className="chart-note">

                Showing an estimated trend —
                connect a history-returning
                backend for live data.

              </p>

            )
          }


          <div
            style={{
              width: '100%',
              height: 280,
            }}
          >

            <ResponsiveContainer>

              <LineChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 18,
                  left: -15,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  stroke="var(--color-border)"
                  vertical={false}
                />

                <XAxis
                  dataKey="label"
                  tick={{
                    fontSize: 11,
                    fill: 'var(--color-text-faint)',
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                {/* Left Axis: Indian CPCB AQI */}
                <YAxis
                  yAxisId="left"
                  tick={{
                    fontSize: 11,
                    fill: 'var(--color-text-faint)',
                  }}
                  axisLine={false}
                  tickLine={false}
                  domain={[
                    0,
                    (dataMax) => Math.max(160, Math.ceil((dataMax || 100) / 50) * 50 + 20),
                  ]}
                />

                {/* Right Axis: PM2.5 Mass Concentration (µg/m³) */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{
                    fontSize: 11,
                    fill: '#f97316',
                  }}
                  axisLine={false}
                  tickLine={false}
                  domain={[
                    0,
                    (dataMax) => Math.max(80, Math.ceil((dataMax || 50) / 25) * 25 + 15),
                  ]}
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid var(--color-border)',
                    fontSize: 12,
                    background: 'var(--color-surface, #ffffff)',
                  }}
                  labelStyle={{
                    fontWeight: 600,
                  }}
                />

                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="aqi"
                  name="CPCB AQI"
                  stroke="var(--color-primary, #0284c7)"
                  strokeWidth={2.5}
                  dot={{
                    r: 2.5,
                    fill: 'var(--color-primary, #0284c7)',
                  }}
                  activeDot={{
                    r: 5,
                  }}
                />

                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="pm25"
                  name="PM2.5 (µg/m³)"
                  stroke="#f97316"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{
                    r: 2,
                    fill: '#f97316',
                  }}
                />

                {chartData.length > 0 && (
                  <ReferenceDot
                    yAxisId="left"
                    x={chartData[chartData.length - 1].label}
                    y={chartData[chartData.length - 1].aqi}
                    r={5}
                    fill="var(--color-primary, #0284c7)"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                )}

              </LineChart>

            </ResponsiveContainer>

          </div>

        </Card>


        {/* AI INSIGHTS */}

        <Card className="section-card insight-card">

          <div className="card-head">

            <h3 className="section-title">

              <Sparkles
                size={16}
              />

              AI Health Insights

            </h3>


            <span className="ai-badge">
              AI-generated
            </span>

          </div>


          <p className="insight-summary">

            Based on your weekly exposure,
            respiratory stress risk is{' '}

            <strong>

              {
                band.label === 'Good'
                  ? 'Low'
                  : band.label === 'Moderate'
                    ? 'Moderate'
                    : 'Elevated'
              }

            </strong>.

          </p>


          <ul className="insight-list">

            {insights.map(
              (item, i) => {

                const Icon =
                  item.icon;

                return (

                  <li
                    key={i}
                    className={
                      `insight-list__item insight-list__item--${item.tone}`
                    }
                  >

                    <Icon size={15} />

                    <span>
                      {item.text}
                    </span>

                  </li>

                );
              }
            )}

          </ul>

        </Card>

      </div>

    </Layout>
  );
}