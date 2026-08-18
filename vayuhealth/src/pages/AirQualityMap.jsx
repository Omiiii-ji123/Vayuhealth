import { useMemo, useState } from 'react';
import { MapPin, Navigation, Search, Wind } from 'lucide-react';
import Layout from '../components/Layout';
import { Card, Loader, ErrorState, StatusBadge, EmptyState } from '../components/Common';
import AqiGauge from '../components/AqiGauge';
import { useAsync } from '../hooks/useAsync';
import { getAllAqi, getAqiByCity, getAqiByCoords } from '../api/aqi';
import { normalizeAqiList, normalizeAqiRecord, getAqiBand, formatRelativeTime } from '../utils/aqi';

export default function AirQualityMap() {
  const [query, setQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState(null);

  const { data: allRaw, error: allError, loading: allLoading, refetch: refetchAll } = useAsync(() => getAllAqi(), []);
  const cities = useMemo(() => normalizeAqiList(allRaw), [allRaw]);

  const {
    data: selectedRaw,
    error: selectedError,
    loading: selectedLoading,
  } = useAsync(() => getAqiByCity(selectedCity), [selectedCity], { skip: !selectedCity });
  const selectedRecord = useMemo(() => normalizeAqiRecord(selectedRaw), [selectedRaw]);
  const selectedBand = getAqiBand(selectedRecord?.aqi ?? 0);

  const filtered = useMemo(() => {
    if (!query.trim()) return cities;
    const q = query.toLowerCase();
    return cities.filter((c) => c.city?.toLowerCase().includes(q) || c.state?.toLowerCase().includes(q));
  }, [cities, query]);

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

  return (
    <Layout title="Air Quality Map" subtitle="Browse live AQI readings across every tracked location.">
      <Card className="section-card">
        <div className="map-toolbar">
          <div className="city-search city-search--wide">
            <Search size={15} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter tracked cities or states..."
            />
          </div>
          <form
            className="city-search"
            onSubmit={(e) => {
              e.preventDefault();
              setSelectedCity(query.trim());
            }}
          >
            <MapPin size={15} />
            <input placeholder="Look up a specific city" onChange={(e) => setQuery(e.target.value)} value={query} />
            <button type="submit" className="btn btn--ghost btn--sm">Lookup</button>
          </form>
          <button className="btn btn--ghost btn--sm" onClick={locateMe} disabled={locating}>
            <Navigation size={14} className={locating ? 'spin' : ''} /> {locating ? 'Locating...' : 'Use my location'}
          </button>
        </div>
        {locateError && <p className="form-error">{locateError}</p>}
      </Card>

      {selectedCity && (
        <Card className="section-card">
          <h3 className="section-title">Selected Location</h3>
          {selectedLoading ? (
            <Loader label={`Fetching AQI for ${selectedCity}...`} />
          ) : selectedError ? (
            <ErrorState message={selectedError.message} />
          ) : (
            <div className="aqi-hero__body">
              <AqiGauge value={selectedRecord?.aqi ?? 0} size={140} />
              <div className="aqi-hero__info">
                <div className="card-head__sub"><MapPin size={13} /> {selectedRecord?.city}{selectedRecord?.state ? `, ${selectedRecord.state}` : ''}</div>
                <StatusBadge label={selectedBand.label} color={selectedBand.color} />
                <div className="aqi-hero__stats">
                  <div><span>PM2.5</span><strong>{selectedRecord?.pm25 ?? '--'} µg/m³</strong></div>
                  <div><span>PM10</span><strong>{selectedRecord?.pm10 ?? '--'} µg/m³</strong></div>
                  <div><span>O₃</span><strong>{selectedRecord?.o3 ?? '--'} ppb</strong></div>
                </div>
                <span className="muted-text">Updated {formatRelativeTime(selectedRecord?.updatedAt)}</span>
              </div>
            </div>
          )}
        </Card>
      )}

      <Card className="section-card">
        <div className="card-head">
          <h3 className="section-title"><Wind size={16} /> All Tracked Locations</h3>
        </div>
        {allLoading ? (
          <Loader label="Loading AQI records..." />
        ) : allError ? (
          <ErrorState message={allError.message} onRetry={refetchAll} />
        ) : filtered.length === 0 ? (
          <EmptyState message="No locations match your search." />
        ) : (
          <div className="city-grid">
            {filtered.map((c, i) => {
              const b = getAqiBand(c.aqi);
              return (
                <button key={i} className="city-tile" onClick={() => setSelectedCity(c.city)}>
                  <div className="city-tile__head">
                    <span className="city-tile__name">{c.city}</span>
                    {c.state && <span className="city-tile__state">{c.state}</span>}
                  </div>
                  <div className="city-tile__aqi" style={{ color: b.color }}>{c.aqi || '--'}</div>
                  <StatusBadge label={b.label} color={b.color} />
                </button>
              );
            })}
          </div>
        )}
      </Card>
    </Layout>
  );
}
