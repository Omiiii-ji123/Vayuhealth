import { useState } from 'react';
import { Activity, Building2, Globe2, MapPinned, Search } from 'lucide-react';
import Layout from '../components/Layout';
import { Card, Loader, ErrorState, EmptyState } from '../components/Common';
import { useAsync } from '../hooks/useAsync';
import { getSurveillanceStats, getSurveillanceByCity, getSurveillanceByState } from '../api/dashboard';
import { getHealthStatsByDistrict } from '../api/health';
import { useAuth } from '../context/AuthContext';

function StatGrid({ obj }) {
  if (!obj || typeof obj !== 'object') return <EmptyState message="No statistics returned for this query." />;
  const entries = Object.entries(obj).filter(([k, v]) => v !== null && typeof v !== 'object');
  if (!entries.length) return <EmptyState message="No statistics returned for this query." />;
  return (
    <div className="stat-grid">
      {entries.map(([k, v]) => (
        <div key={k} className="stat-tile">
          <span className="stat-tile__label">{k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}</span>
          <span className="stat-tile__value">{String(v)}</span>
        </div>
      ))}
    </div>
  );
}

export default function Surveillance() {
  const { user } = useAuth();
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState(user?.district || '');
  const [cityQuery, setCityQuery] = useState(null);
  const [stateQuery, setStateQuery] = useState(null);
  const [districtQuery, setDistrictQuery] = useState(user?.district || null);

  const { data: overall, error: overallErr, loading: overallLoading } = useAsync(() => getSurveillanceStats(), []);

  const { data: cityData, error: cityErr, loading: cityLoading } = useAsync(
    () => getSurveillanceByCity(cityQuery),
    [cityQuery],
    { skip: !cityQuery }
  );

  const { data: stateData, error: stateErr, loading: stateLoading } = useAsync(
    () => getSurveillanceByState(stateQuery),
    [stateQuery],
    { skip: !stateQuery }
  );

  const { data: districtData, error: districtErr, loading: districtLoading } = useAsync(
    () => getHealthStatsByDistrict(districtQuery),
    [districtQuery],
    { skip: !districtQuery }
  );

  return (
    <Layout title="Health Surveillance" subtitle="Population-level environmental health statistics.">
      <Card className="section-card">
        <div className="card-head">
          <h3 className="section-title"><Globe2 size={16} /> Overall Surveillance</h3>
        </div>
        {overallLoading ? <Loader label="Loading national statistics..." /> : overallErr ? <ErrorState message={overallErr.message} /> : <StatGrid obj={overall} />}
      </Card>

      <div className="grid-2col">
        <Card className="section-card">
          <div className="card-head">
            <h3 className="section-title"><Building2 size={16} /> By City</h3>
          </div>
          <form
            className="city-search"
            onSubmit={(e) => { e.preventDefault(); setCityQuery(city.trim()); }}
          >
            <Search size={15} />
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. San Francisco" />
            <button type="submit" className="btn btn--ghost btn--sm">Search</button>
          </form>
          {cityLoading ? <Loader label="Loading..." /> : cityErr ? <ErrorState message={cityErr.message} /> : cityQuery ? <StatGrid obj={cityData} /> : <EmptyState message="Search a city to see its statistics." />}
        </Card>

        <Card className="section-card">
          <div className="card-head">
            <h3 className="section-title"><MapPinned size={16} /> By State</h3>
          </div>
          <form
            className="city-search"
            onSubmit={(e) => { e.preventDefault(); setStateQuery(state.trim()); }}
          >
            <Search size={15} />
            <input value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g. California" />
            <button type="submit" className="btn btn--ghost btn--sm">Search</button>
          </form>
          {stateLoading ? <Loader label="Loading..." /> : stateErr ? <ErrorState message={stateErr.message} /> : stateQuery ? <StatGrid obj={stateData} /> : <EmptyState message="Search a state to see its statistics." />}
        </Card>
      </div>

      <Card className="section-card">
        <div className="card-head">
          <h3 className="section-title"><Activity size={16} /> Health Stats by District</h3>
        </div>
        <form
          className="city-search"
          onSubmit={(e) => { e.preventDefault(); setDistrictQuery(district.trim()); }}
        >
          <Search size={15} />
          <input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Enter district name" />
          <button type="submit" className="btn btn--ghost btn--sm">Search</button>
        </form>
        {districtLoading ? <Loader label="Loading district stats..." /> : districtErr ? <ErrorState message={districtErr.message} /> : districtQuery ? <StatGrid obj={districtData} /> : <EmptyState message="Enter a district to view health statistics." />}
      </Card>
    </Layout>
  );
}
