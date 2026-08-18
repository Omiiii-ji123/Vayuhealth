import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Search, Filter, ChevronRight } from 'lucide-react';
import Layout from '../components/Layout';
import { Card, Loader, ErrorState, EmptyState } from '../components/Common';
import { useAsync } from '../hooks/useAsync';
import { getAllDiseases, getDiseasesByCategory, getDiseasesByTransmission } from '../api/diseases';
import { normalizeDiseaseList } from '../utils/disease';

export default function Diseases() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [transmission, setTransmission] = useState('all');

  const { data: allRaw, error: allError, loading: allLoading } = useAsync(() => getAllDiseases(), []);
  const allDiseases = useMemo(() => normalizeDiseaseList(allRaw), [allRaw]);

  const skipCategory = category === 'all';
  const { data: catRaw, loading: catLoading } = useAsync(
    () => getDiseasesByCategory(category),
    [category],
    { skip: skipCategory }
  );

  const skipTransmission = transmission === 'all';
  const { data: transRaw, loading: transLoading } = useAsync(
    () => getDiseasesByTransmission(transmission),
    [transmission],
    { skip: skipTransmission }
  );

  const categories = useMemo(
    () => Array.from(new Set(allDiseases.map((d) => d.category).filter(Boolean))),
    [allDiseases]
  );
  const transmissions = useMemo(
    () => Array.from(new Set(allDiseases.map((d) => d.transmission).filter(Boolean))),
    [allDiseases]
  );

  const activeList = useMemo(() => {
    let base = allDiseases;
    if (!skipCategory) base = normalizeDiseaseList(catRaw);
    if (!skipTransmission) {
      const transList = normalizeDiseaseList(transRaw);
      const names = new Set(transList.map((d) => d.name));
      base = base.filter((d) => names.has(d.name));
      if (skipCategory) base = transList;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      base = base.filter((d) => d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q));
    }
    return base;
  }, [allDiseases, catRaw, transRaw, skipCategory, skipTransmission, search]);

  const loading = allLoading || (!skipCategory && catLoading) || (!skipTransmission && transLoading);

  return (
    <Layout title="Diseases" subtitle="Explore environmentally-linked diseases, transmission types, and remedies.">
      <Card className="section-card">
        <div className="map-toolbar">
          <div className="city-search city-search--wide">
            <Search size={15} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search diseases..." />
          </div>
          <div className="select-group">
            <Filter size={14} />
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="select-group">
            <Filter size={14} />
            <select value={transmission} onChange={(e) => setTransmission(e.target.value)}>
              <option value="all">All transmission types</option>
              {transmissions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card className="section-card">
        <div className="card-head">
          <h3 className="section-title"><Stethoscope size={16} /> Conditions ({activeList.length})</h3>
        </div>
        {loading ? (
          <Loader label="Loading diseases..." />
        ) : allError ? (
          <ErrorState message={allError.message} />
        ) : activeList.length === 0 ? (
          <EmptyState message="No diseases match your filters." />
        ) : (
          <div className="disease-list">
            {activeList.map((d) => (
              <button key={d.id || d.name} className="disease-row" onClick={() => navigate(`/diseases/${encodeURIComponent(d.id || d.name)}`)}>
                <div>
                  <div className="disease-row__name">{d.name}</div>
                  <div className="disease-row__meta">
                    <span className="tag">{d.category}</span>
                    <span className="tag tag--muted">{d.transmission}</span>
                  </div>
                  {d.description && <p className="disease-row__desc">{d.description}</p>}
                </div>
                <ChevronRight size={18} />
              </button>
            ))}
          </div>
        )}
      </Card>
    </Layout>
  );
}
