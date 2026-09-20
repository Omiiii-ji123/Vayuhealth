import { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Activity, 
  Wind, 
  Home, 
  Sparkles, 
  Droplets, 
  HeartHandshake,
  CheckCircle2
} from 'lucide-react';
import { Card } from './Common';
import { useLanguage } from '../context/LanguageContext';

export default function PersonalizedPrecautionsCard({ record, user, vertical = false, className = '' }) {
  const { language, t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const aqi = record?.aqi ?? 0;
  const pm25 = record?.pm25 ?? 0;
  const o3 = record?.o3 ?? 0;

  // Determine precautions based on AQI and pollutants
  const precautions = useMemo(() => {
    const isGood = aqi <= 50;
    const isModerate = aqi > 50 && aqi <= 100;
    const isPoor = aqi > 100 && aqi <= 200;
    const isSevere = aqi > 200;

    const items = {
      outdoor: isGood
        ? {
            title: t('precautions.outdoor', 'Outdoor Activity Guidance'),
            text: 'Safe for all outdoor activities, jogging, sports, and open-air workouts.',
            hiText: 'सभी बाहरी गतिविधियों, दौड़ने और व्यायाम के लिए पूरी तरह सुरक्षित है।',
            status: 'safe',
            icon: Wind
          }
        : isModerate
        ? {
            title: t('precautions.outdoor', 'Outdoor Activity Guidance'),
            text: 'Acceptable for normal routines. Sensitive individuals should reduce prolonged heavy exertion.',
            hiText: 'सामान्य दिनचर्या हेतु ठीक है। संवेदनशील व्यक्ति लंबे समय तक भारी व्यायाम से बचें।',
            status: 'moderate',
            icon: Wind
          }
        : isPoor
        ? {
            title: t('precautions.outdoor', 'Outdoor Activity Guidance'),
            text: 'Limit morning and evening jogs during peak traffic hours. Exercise indoors if possible.',
            hiText: 'ट्रैफिक के समय सुबह और शाम की सैर सीमित करें। संभव हो तो घर के अंदर व्यायाम करें।',
            status: 'warning',
            icon: Wind
          }
        : {
            title: t('precautions.outdoor', 'Outdoor Activity Guidance'),
            text: 'Avoid all unnecessary outdoor exposure and strenuous physical activity.',
            hiText: 'बाहर जाने से पूरी तरह बचें। बाहर किसी भी प्रकार का भारी काम न करें।',
            status: 'danger',
            icon: Wind
          },

      protection: pm25 > 35 || aqi > 100
        ? {
            title: t('precautions.protection', 'Protection & Mask Guidance'),
            text: 'Wear a well-fitted N95 / FFP2 respirator mask when stepping outdoors.',
            hiText: 'घर से बाहर निकलते समय N95 या FFP2 मास्क अवश्य पहनें।',
            status: 'danger',
            icon: ShieldCheck
          }
        : {
            title: t('precautions.protection', 'Protection & Mask Guidance'),
            text: 'Standard cloth or surgical mask is sufficient for dust protection.',
            hiText: 'धूल से बचाव के लिए सामान्य सूती या सर्जिकल मास्क पर्याप्त है।',
            status: 'safe',
            icon: ShieldCheck
          },

      indoor: aqi > 120
        ? {
            title: t('precautions.indoor', 'Indoor Air & Ventilation'),
            text: 'Keep windows and doors closed during peak traffic hours. Run HEPA air purifier if available.',
            hiText: 'प्रदूषण के समय खिड़कियां-दरवाजे बंद रखें। संभव हो तो HEPA एयर प्यूरीफायर चलाएं।',
            status: 'warning',
            icon: Home
          }
        : {
            title: t('precautions.indoor', 'Indoor Air & Ventilation'),
            text: 'Ventilate home during afternoon hours when particulate concentration is lowest.',
            hiText: 'दोपहर के समय जब प्रदूषण कम हो, घर में ताज़ी हवा आने के लिए खिड़कियां खोलें।',
            status: 'safe',
            icon: Home
          },

      ayurvedic: {
        title: t('precautions.ayurvedic', 'Ayurvedic & Home Remedies'),
        text: 'Drink warm water with Tulsi & Ginger. Practice steam inhalation with eucalyptus oil & take Sitopaladi Churna.',
        hiText: 'तुलसी-अदरक का गर्म काढ़ा पिएं, नीलगिरी के तेल से भाप लें और शीतोपलादि चूर्ण का सेवन करें।',
        status: 'ayurveda',
        icon: Sparkles
      },

      hydration: {
        title: t('precautions.hydration', 'Hydration & Nutrition'),
        text: 'Drink 2.5–3L warm fluids daily. Consume jaggery (gur) & Vitamin C rich amla/citrus fruits to detoxify lungs.',
        hiText: 'प्रतिदिन 2.5-3 लीटर गर्म पानी/तरल पदार्थ पिएं। गुड़ और आंवला जैसे विटामिन सी युक्त फल खाएं।',
        status: 'hydration',
        icon: Droplets
      }
    };

    return items;
  }, [aqi, pm25, t]);

  const userConditions = Array.isArray(user?.conditions)
    ? user.conditions
    : (typeof user?.conditions === 'string' && user.conditions.trim() ? [user.conditions] : []);
  const hasVulnerability = userConditions.length > 0 || (user?.age && Number(user.age) > 60);

  return (
    <Card className={`precautions-card ${vertical ? 'precautions-card--vertical' : ''} ${className}`}>
      <div className="precautions-card__head">
        <div className="precautions-card__title-group">
          <div className="precautions-card__icon-badge">
            <HeartHandshake size={18} className="text-teal" />
          </div>
          <div>
            <h3 className="precautions-card__title">
              {t('precautions.title', 'Daily Personalized Precautions')}
            </h3>
            <p className="precautions-card__subtitle">
              {t('precautions.subtitle', 'Tailored preventive directives for today')}
            </p>
          </div>
        </div>

        {hasVulnerability && (
          <div className="precautions-profile-alert">
            <AlertTriangle size={12} />
            <span>Sensitive</span>
          </div>
        )}
      </div>

      <div className={`precautions-container ${vertical ? 'precautions-vertical-list' : 'precautions-grid'}`}>
        {/* Outdoor Guidance */}
        <div className={`precaution-item precaution-item--${precautions.outdoor.status}`}>
          <div className="precaution-item__icon">
            <precautions.outdoor.icon size={16} />
          </div>
          <div className="precaution-item__content">
            <h4 className="precaution-item__title">{precautions.outdoor.title}</h4>
            <p className="precaution-item__desc">
              {language === 'hi' ? precautions.outdoor.hiText : precautions.outdoor.text}
            </p>
          </div>
        </div>

        {/* Protection & Mask */}
        <div className={`precaution-item precaution-item--${precautions.protection.status}`}>
          <div className="precaution-item__icon">
            <precautions.protection.icon size={16} />
          </div>
          <div className="precaution-item__content">
            <h4 className="precaution-item__title">{precautions.protection.title}</h4>
            <p className="precaution-item__desc">
              {language === 'hi' ? precautions.protection.hiText : precautions.protection.text}
            </p>
          </div>
        </div>

        {/* Indoor Air */}
        <div className={`precaution-item precaution-item--${precautions.indoor.status}`}>
          <div className="precaution-item__icon">
            <precautions.indoor.icon size={16} />
          </div>
          <div className="precaution-item__content">
            <h4 className="precaution-item__title">{precautions.indoor.title}</h4>
            <p className="precaution-item__desc">
              {language === 'hi' ? precautions.indoor.hiText : precautions.indoor.text}
            </p>
          </div>
        </div>

        {/* Ayurvedic & Hydration (Always in full grid, toggleable in vertical mode) */}
        {(!vertical || expanded) && (
          <>
            <div className="precaution-item precaution-item--ayurveda">
              <div className="precaution-item__icon">
                <precautions.ayurvedic.icon size={16} />
              </div>
              <div className="precaution-item__content">
                <h4 className="precaution-item__title">{precautions.ayurvedic.title}</h4>
                <p className="precaution-item__desc">
                  {language === 'hi' ? precautions.ayurvedic.hiText : precautions.ayurvedic.text}
                </p>
              </div>
            </div>

            <div className="precaution-item precaution-item--hydration">
              <div className="precaution-item__icon">
                <precautions.hydration.icon size={16} />
              </div>
              <div className="precaution-item__content">
                <h4 className="precaution-item__title">{precautions.hydration.title}</h4>
                <p className="precaution-item__desc">
                  {language === 'hi' ? precautions.hydration.hiText : precautions.hydration.text}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {vertical && (
        <button 
          type="button" 
          className="precautions-expand-btn"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? '▲ Show Less' : '▼ View Ayurvedic & Hydration Directives (+2)'}
        </button>
      )}

      <style>{`
        .precautions-card {
          margin-bottom: 24px;
          border: 1px solid var(--color-border, #e2e8f0);
          background: var(--color-bg-primary, #ffffff);
          border-radius: 14px;
          padding: 20px;
        }

        .precautions-card__head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .precautions-card__title-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .precautions-card__icon-badge {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(13, 148, 136, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0d9488;
        }

        .precautions-card__title {
          font-size: 16px;
          font-weight: 700;
          margin: 0;
          color: var(--color-text-primary, #1e293b);
        }

        .precautions-card__subtitle {
          font-size: 12px;
          color: var(--color-text-secondary, #64748b);
          margin: 2px 0 0 0;
        }

        .precautions-profile-alert {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #d97706;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        .precautions-card--vertical {
          margin-bottom: 0;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .precautions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 14px;
        }

        .precautions-vertical-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }

        .precautions-vertical-list .precaution-item {
          padding: 10px 12px;
        }

        .precautions-vertical-list .precaution-item__desc {
          font-size: 11.5px;
          margin-top: 2px;
          line-height: 1.4;
        }

        .precautions-vertical-list .precaution-item__title {
          font-size: 12px;
        }

        .precautions-expand-btn {
          margin-top: 8px;
          background: #f8fafc;
          border: 1px dashed #cbd5e1;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
          text-align: center;
        }

        .precautions-expand-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
          border-color: #94a3b8;
        }

        .precaution-item {
          display: flex;
          gap: 12px;
          padding: 14px;
          border-radius: 10px;
          border: 1px solid transparent;
          transition: all 0.2s ease;
        }

        .precaution-item:hover {
          transform: translateY(-2px);
        }

        .precaution-item--safe {
          background: rgba(16, 185, 129, 0.06);
          border-color: rgba(16, 185, 129, 0.2);
        }
        .precaution-item--safe .precaution-item__icon {
          color: #10b981;
          background: rgba(16, 185, 129, 0.15);
        }

        .precaution-item--moderate {
          background: rgba(245, 158, 11, 0.06);
          border-color: rgba(245, 158, 11, 0.2);
        }
        .precaution-item--moderate .precaution-item__icon {
          color: #f59e0b;
          background: rgba(245, 158, 11, 0.15);
        }

        .precaution-item--warning,
        .precaution-item--danger {
          background: rgba(239, 68, 68, 0.06);
          border-color: rgba(239, 68, 68, 0.2);
        }
        .precaution-item--warning .precaution-item__icon,
        .precaution-item--danger .precaution-item__icon {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.15);
        }

        .precaution-item--ayurveda {
          background: rgba(139, 92, 246, 0.06);
          border-color: rgba(139, 92, 246, 0.2);
        }
        .precaution-item--ayurveda .precaution-item__icon {
          color: #8b5cf6;
          background: rgba(139, 92, 246, 0.15);
        }

        .precaution-item--hydration {
          background: rgba(14, 165, 233, 0.06);
          border-color: rgba(14, 165, 233, 0.2);
        }
        .precaution-item--hydration .precaution-item__icon {
          color: #0ea5e9;
          background: rgba(14, 165, 233, 0.15);
        }

        .precaution-item__icon {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .precaution-item__content {
          flex: 1;
        }

        .precaution-item__title {
          font-size: 13px;
          font-weight: 600;
          margin: 0 0 4px 0;
          color: var(--color-text-primary, #1e293b);
        }

        .precaution-item__desc {
          font-size: 12px;
          line-height: 1.45;
          color: var(--color-text-secondary, #475569);
          margin: 0;
        }
      `}</style>
    </Card>
  );
}
