import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  PlayCircle, 
  ArrowRight, 
  AlertCircle, 
  Flame, 
  Wind, 
  Sparkles,
  Stethoscope
} from 'lucide-react';
import { Card } from './Common';
import { useLanguage } from '../context/LanguageContext';
import { predictOutbreaks } from '../utils/predictionEngine';

export default function LikelyDiseasesCard({ record, onOpenVideoModal }) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const predictionResult = useMemo(() => {
    if (!record) return null;
    const env = {
      aqi: record.aqi || 50,
      pm25: record.pm25 || 15,
      pm10: record.pm10 || 30,
      no2: record.no2 || 20,
      so2: record.so2 || 10,
      co: record.co || 1,
      o3: record.o3 || 15,
      temperature: 28,
      humidity: 60,
    };
    return predictOutbreaks(env);
  }, [record]);

  const topDiseases = useMemo(() => {
    if (!predictionResult || !predictionResult.predictions) {
      return [
        {
          diseaseName: 'Asthma & COPD Exacerbation',
          riskScore: 68,
          level: 'High',
          color: '#ff3d00',
          targetOrgan: 'Lungs & Airways',
          triggers: ['PM2.5', 'AQI > 100'],
        },
        {
          diseaseName: 'Allergic Rhinitis & Sinusitis',
          riskScore: 54,
          level: 'Moderate',
          color: '#ff9100',
          targetOrgan: 'Nasal Passages',
          triggers: ['PM10', 'Ozone'],
        },
        {
          diseaseName: 'Acute Bronchitis',
          riskScore: 48,
          level: 'Moderate',
          color: '#eab308',
          targetOrgan: 'Bronchial Mucosa',
          triggers: ['NO2', 'Particulate Matter'],
        }
      ];
    }

    return predictionResult.predictions.slice(0, 3).map((p) => ({
      diseaseId: p.diseaseId,
      diseaseName: p.diseaseName,
      riskScore: Math.round(p.riskScore),
      level: p.level || (p.riskScore > 65 ? 'High' : p.riskScore > 35 ? 'Moderate' : 'Low'),
      color: p.color || (p.riskScore > 65 ? '#ef4444' : p.riskScore > 35 ? '#f59e0b' : '#10b981'),
      targetOrgan: p.targetOrgan || 'Respiratory System',
      triggers: p.topTriggers?.length ? p.topTriggers : ['PM2.5', 'Air Pollution'],
    }));
  }, [predictionResult]);

  return (
    <Card className="risk-radar-card">
      <div className="risk-radar-card__head">
        <div className="risk-radar-card__title-group">
          <div className="risk-radar-card__icon-badge">
            <Stethoscope size={20} className="text-red" />
          </div>
          <div>
            <h3 className="risk-radar-card__title">
              {t('risks.title', 'Likely Conditions & Environmental Risk Radar')}
            </h3>
            <p className="risk-radar-card__subtitle">
              {t('risks.subtitle', 'Conditions triggered or exacerbated by current pollutants and weather')}
            </p>
          </div>
        </div>

        <button 
          className="risk-radar-card__view-all"
          onClick={() => navigate('/diseases')}
        >
          <span>{t('nav.diseases', 'All Diseases')}</span>
          <ArrowRight size={14} />
        </button>
      </div>

      <div className="risk-radar-grid">
        {topDiseases.map((disease, idx) => (
          <div key={idx} className="disease-risk-box">
            <div className="disease-risk-box__header">
              <div>
                <h4 className="disease-risk-box__name">{disease.diseaseName}</h4>
                <span className="disease-risk-box__organ">🫁 {disease.targetOrgan}</span>
              </div>
              <span 
                className="disease-risk-box__badge"
                style={{ 
                  backgroundColor: `${disease.color}18`, 
                  color: disease.color,
                  borderColor: `${disease.color}40`
                }}
              >
                {disease.level} Risk
              </span>
            </div>

            {/* Risk Gauge Bar */}
            <div className="disease-risk-box__score-row">
              <div className="disease-risk-box__score-label">
                <span>{t('risks.riskScore', 'Risk Score')}</span>
                <strong style={{ color: disease.color }}>{disease.riskScore}%</strong>
              </div>
              <div className="disease-risk-box__bar-track">
                <div 
                  className="disease-risk-box__bar-fill" 
                  style={{ width: `${disease.riskScore}%`, backgroundColor: disease.color }}
                />
              </div>
            </div>

            {/* Triggers */}
            <div className="disease-risk-box__triggers">
              <span className="disease-risk-box__triggers-label">{t('risks.triggers', 'Triggers')}:</span>
              {disease.triggers.map((trig, tIdx) => (
                <span key={tIdx} className="disease-risk-box__trigger-pill">
                  {trig}
                </span>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="disease-risk-box__actions">
              <button 
                className="disease-action-btn disease-action-btn--video"
                onClick={() => onOpenVideoModal && onOpenVideoModal(disease.diseaseName)}
                title={t('risks.watchVideo', 'Watch Impact Video')}
              >
                <PlayCircle size={15} />
                <span>{t('risks.watchVideo', 'Watch Impact Video')}</span>
              </button>

              <button 
                className="disease-action-btn disease-action-btn--details"
                onClick={() => navigate(`/diseases/${disease.diseaseId || disease.diseaseName}`)}
                title={t('risks.viewDetails', 'View Details')}
              >
                <span>{t('risks.viewDetails', 'View Details')}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .risk-radar-card {
          margin-bottom: 24px;
          border: 1px solid var(--color-border, #e2e8f0);
          background: var(--color-bg-primary, #ffffff);
          border-radius: 14px;
          padding: 20px;
        }

        .risk-radar-card__head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .risk-radar-card__title-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .risk-radar-card__icon-badge {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(239, 68, 68, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ef4444;
        }

        .risk-radar-card__title {
          font-size: 16px;
          font-weight: 700;
          margin: 0;
          color: var(--color-text-primary, #1e293b);
        }

        .risk-radar-card__subtitle {
          font-size: 12px;
          color: var(--color-text-secondary, #64748b);
          margin: 2px 0 0 0;
        }

        .risk-radar-card__view-all {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: var(--color-primary, #3b82f6);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: gap 0.2s;
        }

        .risk-radar-card__view-all:hover {
          gap: 9px;
        }

        .risk-radar-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
        }

        .disease-risk-box {
          border: 1px solid var(--color-border, #e2e8f0);
          border-radius: 12px;
          padding: 16px;
          background: var(--color-bg-secondary, #f8fafc);
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .disease-risk-box:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);
        }

        .disease-risk-box__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
        }

        .disease-risk-box__name {
          font-size: 14px;
          font-weight: 700;
          margin: 0 0 2px 0;
          color: var(--color-text-primary, #1e293b);
        }

        .disease-risk-box__organ {
          font-size: 11px;
          color: var(--color-text-secondary, #64748b);
        }

        .disease-risk-box__badge {
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          border: 1px solid transparent;
          white-space: nowrap;
        }

        .disease-risk-box__score-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .disease-risk-box__score-label {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--color-text-secondary, #64748b);
        }

        .disease-risk-box__bar-track {
          height: 6px;
          background: var(--color-border, #e2e8f0);
          border-radius: 3px;
          overflow: hidden;
        }

        .disease-risk-box__bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.4s ease;
        }

        .disease-risk-box__triggers {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .disease-risk-box__triggers-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--color-text-secondary, #64748b);
        }

        .disease-risk-box__trigger-pill {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 4px;
          background: var(--color-bg-primary, #ffffff);
          border: 1px solid var(--color-border, #e2e8f0);
          color: var(--color-text-primary, #334155);
        }

        .disease-risk-box__actions {
          display: flex;
          gap: 8px;
          margin-top: 4px;
        }

        .disease-action-btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 7px 10px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .disease-action-btn--video {
          background: linear-gradient(135deg, #0ea5e9, #0284c7);
          color: #ffffff;
          border: none;
          box-shadow: 0 2px 6px rgba(14, 165, 233, 0.3);
        }

        .disease-action-btn--video:hover {
          background: linear-gradient(135deg, #0284c7, #0369a1);
          transform: translateY(-1px);
        }

        .disease-action-btn--details {
          background: var(--color-bg-primary, #ffffff);
          color: var(--color-text-primary, #334155);
          border: 1px solid var(--color-border, #e2e8f0);
        }

        .disease-action-btn--details:hover {
          background: var(--color-bg-hover, #f1f5f9);
        }
      `}</style>
    </Card>
  );
}
