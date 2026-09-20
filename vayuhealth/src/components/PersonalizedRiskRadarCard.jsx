import { useMemo, useState } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Heart, 
  Eye, 
  Wind, 
  AlertTriangle, 
  UserCheck, 
  CheckCircle2, 
  Info,
  Layers,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell
} from 'recharts';
import { Card } from './Common';
import { useLanguage } from '../context/LanguageContext';

export default function PersonalizedRiskRadarCard({ record, user }) {
  const { t } = useLanguage();
  const [chartType, setChartType] = useState('radar'); // 'radar' | 'bar'

  const aqi = record?.aqi ?? 65;
  const pm25 = record?.pm25 ?? 20;
  const pm10 = record?.pm10 ?? 45;
  const o3 = record?.o3 ?? 30;
  const no2 = record?.no2 ?? 25;

  // Extract user health characteristics safely
  const age = Number(user?.age) || 30;
  const conditions = (Array.isArray(user?.conditions) 
    ? user.conditions.join(' ') 
    : typeof user?.conditions === 'string' 
      ? user.conditions 
      : typeof user?.healthConditions === 'string' 
        ? user.healthConditions 
        : '').toLowerCase();

  const allergies = (Array.isArray(user?.allergies) 
    ? user.allergies.join(' ') 
    : typeof user?.allergies === 'string' 
      ? user.allergies 
      : '').toLowerCase();

  const sensitivity = (typeof user?.sensitivity === 'string' ? user.sensitivity : 'normal').toLowerCase();

  // Multipliers based on personal health profile
  const hasRespiratoryIssue = conditions.includes('asthma') || conditions.includes('bronchitis') || conditions.includes('copd') || conditions.includes('respiratory');
  const hasCardiacIssue = conditions.includes('heart') || conditions.includes('hypertension') || conditions.includes('blood pressure') || conditions.includes('cardiac');
  const hasDustAllergy = allergies.includes('dust') || allergies.includes('pollen') || allergies.includes('smoke') || allergies.includes('air');
  const isSeniorOrChild = age >= 60 || age <= 12;
  const isHighSensitivity = sensitivity.includes('high') || sensitivity.includes('severe');

  // Calculate customized 6-dimensional risk scores (0 to 100)
  const riskMetrics = useMemo(() => {
    // 1. Respiratory Strain
    let respBase = Math.min(100, Math.round((pm25 / 120) * 60 + (aqi / 300) * 40));
    if (hasRespiratoryIssue) respBase = Math.min(100, Math.round(respBase * 1.45 + 15));
    else if (isHighSensitivity) respBase = Math.min(100, Math.round(respBase * 1.25 + 8));

    // 2. Cardiovascular Stress
    let cardioBase = Math.min(100, Math.round((no2 / 80) * 40 + (pm25 / 150) * 40 + (aqi / 400) * 20));
    if (hasCardiacIssue) cardioBase = Math.min(100, Math.round(cardioBase * 1.5 + 18));
    if (isSeniorOrChild) cardioBase = Math.min(100, Math.round(cardioBase * 1.25));

    // 3. Eye & Airway Irritation
    let irritBase = Math.min(100, Math.round((o3 / 100) * 55 + (no2 / 90) * 35 + (pm10 / 200) * 10));
    if (isHighSensitivity || hasDustAllergy) irritBase = Math.min(100, Math.round(irritBase * 1.35 + 10));

    // 4. Allergy & Bronchial Reactivity
    let allergyBase = Math.min(100, Math.round((pm10 / 180) * 65 + (pm25 / 100) * 35));
    if (hasDustAllergy) allergyBase = Math.min(100, Math.round(allergyBase * 1.5 + 20));

    // 5. Alveolar Deep Deposition (PM2.5 penetration)
    let depositBase = Math.min(100, Math.round((pm25 / 90) * 85 + (aqi / 300) * 15));
    if (age < 15 || age > 65) depositBase = Math.min(100, Math.round(depositBase * 1.2));

    // 6. Cumulative Health Vulnerability
    const vulnerabilityScore = Math.min(100, Math.round(
      (respBase * 0.25) + 
      (cardioBase * 0.22) + 
      (irritBase * 0.18) + 
      (allergyBase * 0.18) + 
      (depositBase * 0.17)
    ));

    return [
      { 
        subject: 'Respiratory Strain', 
        score: respBase, 
        fullMark: 100, 
        icon: Wind, 
        color: respBase > 65 ? '#ef4444' : respBase > 40 ? '#f59e0b' : '#10b981',
        trigger: 'Driven by PM2.5 & airway sensitivity'
      },
      { 
        subject: 'Cardiovascular Load', 
        score: cardioBase, 
        fullMark: 100, 
        icon: Heart, 
        color: cardioBase > 65 ? '#ef4444' : cardioBase > 40 ? '#f59e0b' : '#10b981',
        trigger: 'Driven by NO₂ & systemic oxygen load'
      },
      { 
        subject: 'Ocular & Throat Irritation', 
        score: irritBase, 
        fullMark: 100, 
        icon: Eye, 
        color: irritBase > 65 ? '#ef4444' : irritBase > 40 ? '#f59e0b' : '#10b981',
        trigger: 'Driven by ground-level Ozone (O₃)'
      },
      { 
        subject: 'Bronchial & Allergy Reactivity', 
        score: allergyBase, 
        fullMark: 100, 
        icon: Activity, 
        color: allergyBase > 65 ? '#ef4444' : allergyBase > 40 ? '#f59e0b' : '#10b981',
        trigger: 'Driven by PM10 coarse particulates'
      },
      { 
        subject: 'Alveolar Deposition Rate', 
        score: depositBase, 
        fullMark: 100, 
        icon: Layers, 
        color: depositBase > 65 ? '#ef4444' : depositBase > 40 ? '#f59e0b' : '#10b981',
        trigger: 'Fine PM2.5 deep alveolar penetration'
      },
      { 
        subject: 'Cumulative Vulnerability', 
        score: vulnerabilityScore, 
        fullMark: 100, 
        icon: ShieldAlert, 
        color: vulnerabilityScore > 65 ? '#ef4444' : vulnerabilityScore > 40 ? '#f59e0b' : '#10b981',
        trigger: 'Personal profile composite rating'
      },
    ];
  }, [aqi, pm25, pm10, o3, no2, age, hasRespiratoryIssue, hasCardiacIssue, hasDustAllergy, isSeniorOrChild, isHighSensitivity]);

  const compositeScore = riskMetrics[5].score;
  const severityLabel = compositeScore >= 70 ? 'High Risk' : compositeScore >= 40 ? 'Moderate Risk' : 'Low / Safe';
  const severityColor = compositeScore >= 70 ? '#ef4444' : compositeScore >= 40 ? '#f59e0b' : '#10b981';

  return (
    <Card className="risk-radar-card">
      <div className="risk-radar-card__head">
        <div className="risk-radar-card__title-group">
          <div className="risk-radar-card__icon-badge">
            <Activity size={20} />
          </div>
          <div>
            <h3 className="risk-radar-card__title">
              {t('radar.title', 'Personalized Environmental Health Risk Matrix')}
            </h3>
            <p className="risk-radar-card__sub">
              {t('radar.sub', 'Dynamic multidimensional vulnerability computed for your biological profile & real-time air toxicity')}
            </p>
          </div>
        </div>

        <div className="risk-radar-card__actions">
          {/* Profile Tags */}
          <div className="risk-radar-card__profile-tag">
            <UserCheck size={14} />
            <span>Profile: <strong>{user?.name?.split(' ')[0] || 'User'}</strong> ({age} yrs, {sensitivity} sensitivity)</span>
          </div>

          <div className="chart-switch-group">
            <button 
              type="button" 
              className={`chart-switch-btn ${chartType === 'radar' ? 'chart-switch-btn--active' : ''}`}
              onClick={() => setChartType('radar')}
            >
              Radar Chart
            </button>
            <button 
              type="button" 
              className={`chart-switch-btn ${chartType === 'bar' ? 'chart-switch-btn--active' : ''}`}
              onClick={() => setChartType('bar')}
            >
              Bar Breakdown
            </button>
          </div>
        </div>
      </div>

      <div className="risk-radar-card__body">
        {/* Left: Interactive Visual Chart */}
        <div className="risk-radar-card__chart-col">
          <div className="chart-wrapper">
            {chartType === 'radar' ? (
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={riskMetrics}>
                  <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: '#475569', fontSize: 11.5, fontWeight: 600 }} 
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 100]} 
                    tick={{ fill: '#94a3b8', fontSize: 10 }} 
                  />
                  <Radar 
                    name="Personal Risk Score" 
                    dataKey="score" 
                    stroke={severityColor} 
                    fill={severityColor} 
                    fillOpacity={0.4} 
                  />
                  <Tooltip 
                    content={({ payload }) => {
                      if (!payload || !payload.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="radar-tooltip">
                          <div className="radar-tooltip__title">{d.subject}</div>
                          <div className="radar-tooltip__score" style={{ color: d.color }}>
                            Risk Score: <strong>{d.score}%</strong>
                          </div>
                          <div className="radar-tooltip__trigger">{d.trigger}</div>
                        </div>
                      );
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={riskMetrics} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis type="category" dataKey="subject" width={140} tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} />
                  <Tooltip 
                    content={({ payload }) => {
                      if (!payload || !payload.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="radar-tooltip">
                          <div className="radar-tooltip__title">{d.subject}</div>
                          <div className="radar-tooltip__score" style={{ color: d.color }}>
                            Risk Score: <strong>{d.score}%</strong>
                          </div>
                          <div className="radar-tooltip__trigger">{d.trigger}</div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                    {riskMetrics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="risk-radar-card__summary-banner" style={{ borderColor: severityColor }}>
            <div className="summary-banner__left">
              <span className="summary-banner__badge" style={{ background: severityColor, color: '#fff' }}>
                {severityLabel} ({compositeScore}%)
              </span>
              <p className="summary-banner__text">
                {hasRespiratoryIssue
                  ? '⚠️ Elevated respiratory sensitivity detected in your profile. PM2.5 triggers higher inflammation.'
                  : hasCardiacIssue
                  ? '⚠️ Cardiovascular sensitivity active. Maintain hydration and avoid strenuous outdoor exercise.'
                  : compositeScore > 60
                  ? 'Current environmental pollutants pose moderate physiological stress. Wear protective masks.'
                  : 'Your personal biological resistance is optimal for today’s ambient pollutant load.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Detailed Metric Bars & Specific Triggers */}
        <div className="risk-radar-card__metrics-col">
          <h4 className="metrics-col__title">
            <Sparkles size={15} color="#3b82f6" />
            Vulnerability Breakdown by Organ System
          </h4>

          <div className="metrics-list">
            {riskMetrics.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="metric-row">
                  <div className="metric-row__header">
                    <div className="metric-row__label">
                      <Icon size={14} style={{ color: item.color }} />
                      <span>{item.subject}</span>
                    </div>
                    <span className="metric-row__val" style={{ color: item.color }}>
                      {item.score}%
                    </span>
                  </div>

                  <div className="metric-row__bar-bg">
                    <div 
                      className="metric-row__bar-fill"
                      style={{ width: `${item.score}%`, background: item.color }}
                    />
                  </div>

                  <span className="metric-row__trigger">{item.trigger}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        .risk-radar-card {
          background: var(--color-bg-primary, #ffffff);
          border: 1px solid var(--color-border, #e2e8f0);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        }

        .risk-radar-card__head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 1.25rem;
          flex-wrap: wrap;
          border-bottom: 1px solid var(--color-border, #f1f5f9);
          padding-bottom: 1rem;
        }

        .risk-radar-card__title-group {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .risk-radar-card__icon-badge {
          width: 42px;
          height: 42px;
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .risk-radar-card__title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--color-text-primary, #0f172a);
          margin: 0;
        }

        .risk-radar-card__sub {
          font-size: 0.82rem;
          color: var(--color-text-secondary, #64748b);
          margin: 2px 0 0 0;
        }

        .risk-radar-card__actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .risk-radar-card__profile-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: var(--color-bg-secondary, #f8fafc);
          border: 1px solid var(--color-border, #e2e8f0);
          border-radius: 20px;
          font-size: 12px;
          color: var(--color-text-secondary, #475569);
        }

        .chart-switch-group {
          display: flex;
          background: #f1f5f9;
          padding: 3px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          gap: 2px;
        }

        .chart-switch-btn {
          border: none;
          background: transparent;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11.5px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.15s;
        }

        .chart-switch-btn--active {
          background: white;
          color: #0f172a;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .risk-radar-card__body {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 24px;
          align-items: start;
        }

        .chart-wrapper {
          background: var(--color-bg-secondary, #fafafa);
          border: 1px solid var(--color-border, #f1f5f9);
          border-radius: 14px;
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .risk-radar-card__summary-banner {
          margin-top: 14px;
          padding: 12px 14px;
          background: var(--color-bg-secondary, #f8fafc);
          border-radius: 12px;
          border-left: 4px solid;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .summary-banner__badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          margin-bottom: 4px;
        }

        .summary-banner__text {
          font-size: 12.5px;
          color: var(--color-text-primary, #334155);
          margin: 0;
          line-height: 1.45;
        }

        .metrics-col__title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--color-text-primary, #0f172a);
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .metrics-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .metric-row {
          background: var(--color-bg-secondary, #f8fafc);
          border: 1px solid var(--color-border, #e2e8f0);
          border-radius: 10px;
          padding: 10px 12px;
        }

        .metric-row__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .metric-row__label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 600;
          color: var(--color-text-primary, #1e293b);
        }

        .metric-row__val {
          font-size: 13px;
          font-weight: 700;
        }

        .metric-row__bar-bg {
          width: 100%;
          height: 6px;
          background: #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 4px;
        }

        .metric-row__bar-fill {
          height: 100%;
          border-radius: 10px;
          transition: width 0.4s ease;
        }

        .metric-row__trigger {
          font-size: 11px;
          color: var(--color-text-secondary, #64748b);
        }

        .radar-tooltip {
          background: #0f172a;
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          box-shadow: 0 8px 20px rgba(0,0,0,0.25);
          font-size: 12px;
        }

        .radar-tooltip__title {
          font-weight: 700;
          margin-bottom: 2px;
        }

        .radar-tooltip__score {
          font-size: 13px;
          margin-bottom: 2px;
        }

        .radar-tooltip__trigger {
          font-size: 11px;
          color: #94a3b8;
        }

        @media (max-width: 900px) {
          .risk-radar-card__body {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Card>
  );
}
