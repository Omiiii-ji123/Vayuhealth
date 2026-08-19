import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pill, Activity, ShieldAlert, Video } from 'lucide-react';
import Layout from '../components/Layout';
import { Card, Loader, ErrorState } from '../components/Common';
import { useAsync } from '../hooks/useAsync';
import { getDiseaseByIdOrName, getDiseaseRemedies } from '../api/diseases';
import { normalizeDisease, toArray } from '../utils/disease';
import DiseaseVideoModal from '../components/DiseaseVideoModal';

export default function DiseaseDetail() {
  const { idOrName } = useParams();
  const navigate = useNavigate();
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const { data: raw, error, loading } = useAsync(() => getDiseaseByIdOrName(idOrName), [idOrName]);
  const disease = raw ? normalizeDisease(raw) : null;

  const {
    data: remediesRaw,
    error: remediesError,
    loading: remediesLoading,
  } = useAsync(() => getDiseaseRemedies(disease?.name || idOrName), [disease?.name, idOrName], { skip: !idOrName });

  const remedies = toArray(remediesRaw?.remedies || remediesRaw?.remedy || remediesRaw);
  const symptoms = toArray(disease?.symptoms);

  // Safely get disease name as string
  const getDiseaseName = () => {
    if (!disease) return idOrName || 'Unknown Disease';
    
    // If name is a string, use it
    if (typeof disease.name === 'string') {
      return disease.name;
    }
    
    // If name is an object with title/name properties
    if (disease.name && typeof disease.name === 'object') {
      return disease.name.title || disease.name.name || 'Unknown Disease';
    }
    
    return idOrName || 'Unknown Disease';
  };

  const diseaseName = getDiseaseName();

  return (
    <Layout title="Disease Detail" subtitle="Condition overview, symptoms, and recommended remedies.">
      <div className="detail-actions">
        <button className="btn btn--ghost btn--sm" onClick={() => navigate('/diseases')}>
          <ArrowLeft size={14} /> Back to diseases
        </button>
        
        {/* Video Assistant Button */}
        <button 
          className="btn btn--video btn--sm"
          onClick={() => setIsVideoModalOpen(true)}
        >
          <Video size={14} /> Watch Future Impact Video
        </button>
      </div>

      {loading ? (
        <Card className="section-card"><Loader label="Loading condition..." /></Card>
      ) : error ? (
        <Card className="section-card"><ErrorState message={error.message} /></Card>
      ) : (
        <>
          <Card className="section-card">
            <div className="card-head">
              <h2 className="section-title" style={{ fontSize: 20 }}>
                {typeof disease?.name === 'string' ? disease.name : disease?.name?.title || disease?.name?.name || idOrName}
              </h2>
            </div>
            <div className="disease-row__meta" style={{ marginBottom: 14 }}>
              <span className="tag">{disease?.category || 'Unknown'}</span>
              <span className="tag tag--muted">{disease?.transmission || 'Unknown'}</span>
              {disease?.severity && <span className="tag tag--warning">{disease.severity}</span>}
            </div>
            {disease?.description && <p className="muted-text" style={{ lineHeight: 1.6 }}>{disease.description}</p>}
          </Card>

          <div className="grid-2col">
            <Card className="section-card">
              <div className="card-head">
                <h3 className="section-title"><Activity size={16} /> Symptoms</h3>
              </div>
              {symptoms && symptoms.length ? (
                <ul className="bullet-list">
                  {symptoms.map((s, i) => <li key={i}>{typeof s === 'string' ? s : JSON.stringify(s)}</li>)}
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
              ) : remedies && remedies.length ? (
                <ul className="bullet-list">
                  {remedies.map((r, i) => <li key={i}>{typeof r === 'string' ? r : JSON.stringify(r)}</li>)}
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

      {/* Video Modal - Pass the disease name as string */}
      <DiseaseVideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        diseaseName={diseaseName}
      />

      <style jsx>{`
        .detail-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          gap: 12px;
          flex-wrap: wrap;
        }

        .btn--video {
          background: linear-gradient(135deg, rgba(0, 242, 254, 0.18), rgba(179, 136, 255, 0.25));
          border: 1px solid #00f2fe;
          color: #fff;
          padding: 6px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .btn--video:hover {
          background: linear-gradient(135deg, #00f2fe, #b388ff);
          color: #000;
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 242, 254, 0.3);
        }

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
        }

        .btn--ghost {
          background: transparent;
          color: var(--color-text-secondary);
          border: 1px solid var(--color-border);
        }

        .btn--ghost:hover {
          background: var(--color-bg-hover);
        }

        .btn--sm {
          padding: 6px 12px;
          font-size: 12px;
        }

        .section-card {
          background: white;
          padding: 20px 24px;
          border-radius: 12px;
          border: 1px solid var(--color-border);
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          margin-bottom: 20px;
        }

        .card-head {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .section-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          color: var(--color-text-primary);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .grid-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .bullet-list {
          margin: 0;
          padding-left: 20px;
        }

        .bullet-list li {
          font-size: 14px;
          color: var(--color-text-secondary);
          line-height: 1.6;
          margin-bottom: 4px;
        }

        .notice-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          background: #fffbeb;
          border-color: #f6c23e;
        }

        .notice-card svg {
          color: #f6c23e;
          flex-shrink: 0;
        }

        .notice-card p {
          margin: 0;
          font-size: 14px;
          color: #975a16;
        }

        .tag {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          background: #ebf8ff;
          color: #2b6cb0;
        }

        .tag--muted {
          background: #edf2f7;
          color: #4a5568;
        }

        .tag--warning {
          background: #fefcbf;
          color: #975a16;
        }

        .muted-text {
          color: var(--color-text-secondary);
          font-size: 14px;
          margin: 0;
        }

        @media (max-width: 768px) {
          .grid-2col {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .detail-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .btn--video {
            justify-content: center;
          }
        }
      `}</style>
    </Layout>
  );
}