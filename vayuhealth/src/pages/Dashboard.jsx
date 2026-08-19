import { useMemo, useState } from 'react';
import {
  RefreshCw,
  MapPin,
  TreePine,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Navigation,
} from 'lucide-react';
import AQIMapTrigger from '../components/AQIMapTrigger';
import AQIMapModal from '../components/AQIMapModal';
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
import { useAsync } from '../hooks/useAsync';

import {
  getAqiByCity,
  getAqiByLocation,
} from '../api/aqi';

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

  const navigate = useNavigate();


  /* =======================================================
     STATE
  ======================================================= */

  const [city, setCity] = useState(
    user?.city ||
      user?.district ||
      'Mumbai'
  );

  const [cityInput, setCityInput] =
    useState(city);

  const [range, setRange] =
    useState('7d');

  const [locating, setLocating] =
    useState(false);

  /*
   * TRUE  = current AQI came from browser location
   * FALSE = current AQI came from city search
   *
   * This is important because otherwise changing the city
   * state after a location request causes the city API
   * request to overwrite the location result.
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


  /* =======================================================
     HISTORY
  ======================================================= */

  const history = useMemo(
    () =>
      extractHistory(
        consolidated
      ),
    [consolidated]
  );


  const tab =
    RANGE_TABS.find(
      (t) => t.key === range
    ) || RANGE_TABS[1];


  const chartData = useMemo(() => {

    if (
      history &&
      history.length
    ) {

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
        }));
    }

    return buildFallbackSeries(
      record?.aqi || 42,
      tab.points,
      range
    );

  }, [
    history,
    tab,
    record,
    range,
  ]);


  const usingFallbackChart =
    !(
      history &&
      history.length
    );


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
     LOCATION DISPLAY
  ======================================================= */

  const locationDisplay = useMemo(() => {

    if (!record) {
      return city;
    }


    if (locationMode) {

      return (
        record.locationName ||
        record.city ||
        'Nearest monitoring station'
      );
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
    locationMode,
  ]);


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <Layout
      title={
        `Welcome back, ${
          user?.name?.split(' ')[0] ||
          'there'
        }.`
      }
      subtitle="Here is your daily environmental health overview."
    >


      {/* ===================================================
          SEARCH TOOLBAR
      =================================================== */}

      <div className="dash-toolbar">

        <form
          className="city-search"
          onSubmit={handleCitySearch}
        >

          <MapPin size={15} />

          <input
            value={cityInput}
            onChange={(e) =>
              setCityInput(
                e.target.value
              )
            }
            placeholder="Enter a city"
          />

          <button
            type="submit"
            className="btn btn--ghost btn--sm"
          >
            Go
          </button>

        </form>


        <button
          className="btn btn--ghost btn--sm"
          onClick={locateMe}
          disabled={locating}
        >

          <Navigation
            size={14}
            className={
              locating
                ? 'spin'
                : ''
            }
          />

          {
            locating
              ? 'Locating...'
              : 'Use my location'
          }

        </button>

      </div>


      {/* ===================================================
          CURRENT AQI + IMPACT
      =================================================== */}

      <div className="grid-2col">


        {/* CURRENT AQI */}

        <Card className="aqi-hero">

          <div className="card-head">

            <div>

              <h3>
                Current Air Quality
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


                  {/* STATUS */}

                  <StatusBadge
                    label={band.label}
                    color={band.color}
                  />


                  {/* DESCRIPTION */}

                  <p className="aqi-hero__desc">

                    Air quality is{' '}

                    {band.label.toLowerCase()}

                    {' '}

                    today.

                    {band.label === 'Good'
                      ? ' Perfect day for outdoor activities.'
                      : ' Take precautions appropriate for sensitive groups.'
                    }

                  </p>


                  {/* MAIN POLLUTANTS */}

                  <div className="aqi-hero__stats">


                    <div>

                      <span>
                        PM2.5
                      </span>

                      <strong>
                        {record?.pm25 ??
                          '--'}{' '}
                        µg/m³
                      </strong>

                    </div>


                    <div>

                      <span>
                        PM10
                      </span>

                      <strong>
                        {record?.pm10 ??
                          '--'}{' '}
                        µg/m³
                      </strong>

                    </div>


                    <div>

                      <span>
                        O₃ (Ozone)
                      </span>

                      <strong>
                        {record?.o3 ??
                          '--'}{' '}
                        ppb
                      </strong>

                    </div>

                  </div>


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
                    />

                    {
                      locationMode
                        ? 'Refresh location AQI'
                        : `Last updated ${
                            formatRelativeTime(
                              record?.updatedAt
                            )
                          }`
                    }

                  </button>


                </div>

              </div>

            )
          }

        </Card>


        {/* ENVIRONMENTAL IMPACT */}

        <Card className="impact-card">

          <div className="card-head">

            <h3>

              <TreePine
                size={16}
              />

              Environmental Impact

            </h3>

          </div>


          <div className="impact-card__hours">

            {impactHours} hours

          </div>


          <p>
            of unhealthy air exposure avoided this week.
          </p>


          <p className="impact-card__note">
            By adjusting route recommendations during peak pollution hours.
          </p>

        </Card>

      </div>


      {/* ===================================================
          LIVE POLLUTANTS
      =================================================== */}

      <Card className="section-card">

        <h3 className="section-title">
          Live Pollutants
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
                  right: 12,
                  left: -20,
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

                <YAxis
                  tick={{
                    fontSize: 11,
                    fill: 'var(--color-text-faint)',
                  }}
                  axisLine={false}
                  tickLine={false}
                  domain={[
                    0,
                    200,
                  ]}
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border:
                      '1px solid var(--color-border)',
                    fontSize: 12,
                  }}
                  labelStyle={{
                    fontWeight: 600,
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="aqi"
                  name="AQI (Air Quality Index)"
                  stroke="var(--color-primary)"
                  strokeWidth={2.5}
                  dot={{
                    r: 3,
                    fill:
                      'var(--color-primary)',
                  }}
                  activeDot={{
                    r: 5,
                  }}
                />

                {
                  chartData.length > 0 && (

                    <ReferenceDot
                      x={
                        chartData[
                          chartData.length - 1
                        ].label
                      }
                      y={
                        chartData[
                          chartData.length - 1
                        ].aqi
                      }
                      r={5}
                      fill="var(--color-primary)"
                      stroke="#fff"
                      strokeWidth={2}
                    />

                  )
                }

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


          <button
            className="btn btn--outline btn--block"
            onClick={() =>
              navigate(
                '/ai-assistant'
              )
            }
          >

            View Detailed Report

            <ArrowRight
              size={14}
            />

          </button>

        </Card>
        

      </div>

    </Layout>
  );
}