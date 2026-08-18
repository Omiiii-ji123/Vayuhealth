import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pill, Activity, ShieldAlert } from 'lucide-react';
import Layout from '../components/Layout';
import { Card, Loader, ErrorState } from '../components/Common';
import { useAsync } from '../hooks/useAsync';
import { getDiseaseByIdOrName, getDiseaseRemedies } from '../api/diseases';
import { normalizeDisease, toArray } from '../utils/disease';

export default function DiseaseDetail() {
  const { idOrName } = useParams();
  const navigate = useNavigate();

  const { data: raw, error, loading } = useAsync(() => getDiseaseByIdOrName(idOrName), [idOrName]);
  const disease = raw ? normalizeDisease(raw) : null;

  const {
    data: remediesRaw,
    error: remediesError,
    loading: remediesLoading,
  } = useAsync(() => getDiseaseRemedies(disease?.name || idOrName), [disease?.name, idOrName], { skip: !idOrName });

  const remedies = toArray(remediesRaw?.remedies || remediesRaw?.remedy || remediesRaw);
  const symptoms = toArray(disease?.symptoms);

  return (
    <Layout title="Disease Detail" subtitle="Condition overview, symptoms, and recommended remedies.">
      <button className="btn btn--ghost btn--sm" onClick={() => navigate('/diseases')}>
        <ArrowLeft size={14} /> Back to diseases
      </button>

      {loading ? (
        <Card className="section-card"><Loader label="Loading condition..." /></Card>
      ) : error ? (
        <Card className="section-card"><ErrorState message={error.message} /></Card>
      ) : (
        <>
          <Card className="section-card">
            <div className="card-head">
              <h2 className="section-title" style={{ fontSize: 20 }}>{disease.name}</h2>
            </div>
            <div className="disease-row__meta" style={{ marginBottom: 14 }}>
              <span className="tag">{disease.category}</span>
              <span className="tag tag--muted">{disease.transmission}</span>
              {disease.severity && <span className="tag tag--warning">{disease.severity}</span>}
            </div>
            {disease.description && <p className="muted-text" style={{ lineHeight: 1.6 }}>{disease.description}</p>}
          </Card>

          <div className="grid-2col">
            <Card className="section-card">
              <div className="card-head">
                <h3 className="section-title"><Activity size={16} /> Symptoms</h3>
              </div>
              {symptoms.length ? (
                <ul className="bullet-list">
                  {symptoms.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              ) : (
                <p className="muted-text">No symptom data available for this condition.</p>
              )}
            </Card>

            <Card className="section-card">
              <div className="card-head">
                <h3 className="section-title"><Pill size={16} /> Remedies</h3>
              </div>
              {remediesLoading ? (
                <Loader label="Fetching remedies..." />
              ) : remediesError ? (
                <ErrorState message={remediesError.message} />
              ) : remedies.length ? (
                <ul className="bullet-list">
                  {remedies.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              ) : (
                <p className="muted-text">No remedy data available for this condition.</p>
              )}
            </Card>
          </div>

          <Card className="section-card notice-card">
            <ShieldAlert size={16} />
            <p>This information is for general awareness only and is not a substitute for professional medical advice.</p>
          </Card>
        </>
      )}
    </Layout>
  );
}
