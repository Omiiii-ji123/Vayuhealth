import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Stethoscope, 
  MapPin, 
  Users, 
  Wind, 
  Activity, 
  Calendar, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import CityAutocomplete from '../components/CityAutocomplete';
import AmbientWindBackground from '../components/AmbientWindBackground';
import { updateUser } from '../api/users';
import { updateHealthProfile } from '../api/auth';

export default function HealthSetup() {
  const { user, updateLocalUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Form State initialized with any existing user data
  const [city, setCity] = useState(user?.city || user?.district || 'Dombivli, Thane');
  const [persona, setPersona] = useState(user?.healthPersona || 'general');
  const [respiratory, setRespiratory] = useState(user?.respiratoryCondition || 'none');
  const [exposure, setExposure] = useState(user?.exposureHours || 'moderate');
  const [age, setAge] = useState(user?.age ? String(user.age) : '28');
  const [saving, setSaving] = useState(false);

  // Persona Options
  const personaOptions = [
    {
      id: 'general',
      title: 'General Public',
      desc: 'Standard outdoor activity & baseline health',
    },
    {
      id: 'asthma',
      title: 'Asthma Patient',
      desc: 'High sensitivity to PM2.5 and pollen spikes',
    },
    {
      id: 'senior',
      title: 'Senior Citizen',
      desc: 'Cardiopulmonary protection & gentle warnings',
    },
    {
      id: 'worker',
      title: 'Outdoor Worker',
      desc: 'Prolonged exposure & heavy exertion advice',
    },
  ];

  // Respiratory Condition Options
  const respiratoryOptions = [
    {
      id: 'none',
      title: 'None / Healthy',
      desc: 'No chronic respiratory conditions',
    },
    {
      id: 'asthma_copd',
      title: 'Asthma / COPD',
      desc: 'Airway bronchospasm & breathlessness',
    },
    {
      id: 'allergies',
      title: 'Air Allergies',
      desc: 'Rhinitis, sneezing, and ocular irritation',
    },
  ];

  // Exposure Hours Options
  const exposureOptions = [
    { id: 'low', title: 'Low (< 1 hr)' },
    { id: 'moderate', title: 'Moderate (1–3 hrs)' },
    { id: 'high', title: 'High (> 3 hrs)' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const personaObj = personaOptions.find(p => p.id === persona);
    const respObj = respiratoryOptions.find(r => r.id === respiratory);
    const expObj = exposureOptions.find(ex => ex.id === exposure);

    // Map to user health conditions for downstream risk matrix
    let conditionTag = 'none';
    if (respiratory === 'asthma_copd') conditionTag = 'asthma, COPD';
    else if (respiratory === 'allergies') conditionTag = 'dust allergy, rhinitis';

    let sensitivityTag = 'normal';
    if (persona === 'asthma' || persona === 'senior') sensitivityTag = 'sensitive';
    else if (persona === 'worker') sensitivityTag = 'high-risk';

    const setupPayload = {
      city: city.split(',')[0].trim(),
      primaryRegion: city,
      district: city.split(',')[0].trim(),
      healthPersona: personaObj?.title || 'General Public',
      healthPersonaDesc: personaObj?.desc || '',
      respiratoryCondition: respObj?.title || 'None / Healthy',
      conditions: conditionTag,
      exposureHours: expObj?.title || 'Moderate (1–3 hrs)',
      age: Number(age) || 28,
      sensitivity: sensitivityTag,
      hasCompletedSetup: true,
      setupCompletedAt: new Date().toISOString(),
    };

    try {
      // 1. Update local user state immediately
      updateLocalUser(setupPayload);

      // 2. Try syncing with backend API if user email exists
      if (user?.email) {
        try {
          await updateUser(user.email, {
            ...user,
            ...setupPayload,
          });
          await updateHealthProfile(user.id || user.email, {
            age: Number(age) || 28,
            conditions: conditionTag,
            sensitivity: sensitivityTag,
          });
        } catch (apiErr) {
          console.warn('Backend sync note:', apiErr.message);
        }
      }

      // 3. Persist locally to localStorage
      localStorage.setItem('vayu_health_setup', JSON.stringify(setupPayload));

      // 4. Launch main dashboard
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Setup error:', err);
      navigate('/', { replace: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="health-setup-page">
      <AmbientWindBackground className="health-setup-ambient">
        <div className="health-setup-card">
          {/* Header */}
          <div className="health-setup-header">
            <div className="health-setup-icon-badge">
              <Stethoscope size={26} color="#0d9488" />
            </div>
            <h1 className="health-setup-title">Personalized Health Setup</h1>
            <p className="health-setup-subtitle">
              Answer 5 quick questions to customize your live AQI dashboard and AI medical alerts.
            </p>
          </div>

          {/* Progress Bar (5 segments) */}
          <div className="health-setup-progress-bar">
            <div className="progress-segment progress-segment--active" />
            <div className="progress-segment progress-segment--active" />
            <div className="progress-segment progress-segment--active" />
            <div className="progress-segment progress-segment--active" />
            <div className="progress-segment progress-segment--active" />
          </div>

          <form onSubmit={handleSubmit} className="health-setup-form">
            {/* Question 1: Primary City / Region */}
            <div className="setup-question-block">
              <h3 className="setup-question-title">
                <span className="setup-q-icon">📍</span> 1. Select Your Primary City / Region
              </h3>
              <p className="setup-question-desc">
                We will load real-time environmental AQI, weather, and hospital beds for this area.
              </p>
              <div className="setup-input-wrapper">
                <CityAutocomplete
                  value={city}
                  onChange={(val) => setCity(val)}
                  onSelect={(item) => setCity(`${item.name}${item.state ? ', ' + item.state : ''}`)}
                  placeholder="Enter city (e.g. Dombivli, Thane, Mumbai, Delhi)"
                />
              </div>
            </div>

            {/* Question 2: Health Persona Profile */}
            <div className="setup-question-block">
              <h3 className="setup-question-title">
                <span className="setup-q-icon">👥</span> 2. Choose Your Health Persona Profile
              </h3>
              <p className="setup-question-desc">
                Helps our AI customize your daily outdoor risk sensitivity threshold.
              </p>
              <div className="setup-persona-grid">
                {personaOptions.map((opt) => (
                  <label
                    key={opt.id}
                    className={`setup-option-card ${persona === opt.id ? 'setup-option-card--selected' : ''}`}
                  >
                    <div className="setup-radio-bullet">
                      <input
                        type="radio"
                        name="healthPersona"
                        value={opt.id}
                        checked={persona === opt.id}
                        onChange={() => setPersona(opt.id)}
                      />
                      <div className="radio-dot" />
                    </div>
                    <div className="setup-option-content">
                      <div className="setup-option-title">{opt.title}</div>
                      <div className="setup-option-desc">{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Question 3: Pre-Existing Respiratory Conditions */}
            <div className="setup-question-block">
              <h3 className="setup-question-title">
                <span className="setup-q-icon">🫁</span> 3. Do You Have Any Pre-Existing Respiratory Conditions?
              </h3>
              <p className="setup-question-desc">
                Select any conditions for personalized medical remedy suggestions.
              </p>
              <div className="setup-respiratory-grid">
                {respiratoryOptions.map((opt) => (
                  <label
                    key={opt.id}
                    className={`setup-option-card ${respiratory === opt.id ? 'setup-option-card--selected' : ''}`}
                  >
                    <div className="setup-radio-bullet">
                      <input
                        type="radio"
                        name="respiratoryCondition"
                        value={opt.id}
                        checked={respiratory === opt.id}
                        onChange={() => setRespiratory(opt.id)}
                      />
                      <div className="radio-dot" />
                    </div>
                    <div className="setup-option-content">
                      <div className="setup-option-title">{opt.title}</div>
                      <div className="setup-option-desc">{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Question 4: Daily Outdoor Travel & Exposure Hours */}
            <div className="setup-question-block">
              <h3 className="setup-question-title">
                <span className="setup-q-icon">🏃</span> 4. Daily Outdoor Travel & Exposure Hours
              </h3>
              <p className="setup-question-desc">
                Used to calculate your weekly avoided pollution exposure hours.
              </p>
              <div className="setup-exposure-grid">
                {exposureOptions.map((opt) => (
                  <label
                    key={opt.id}
                    className={`setup-option-card setup-option-card--pill ${exposure === opt.id ? 'setup-option-card--selected' : ''}`}
                  >
                    <div className="setup-radio-bullet">
                      <input
                        type="radio"
                        name="exposureHours"
                        value={opt.id}
                        checked={exposure === opt.id}
                        onChange={() => setExposure(opt.id)}
                      />
                      <div className="radio-dot" />
                    </div>
                    <div className="setup-option-content">
                      <div className="setup-option-title">{opt.title}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Question 5: Age Selection */}
            <div className="setup-question-block">
              <h3 className="setup-question-title">
                <span className="setup-q-icon">🎂</span> 5. What Is Your Age?
              </h3>
              <p className="setup-question-desc">
                Helps our pediatric & geriatric health risk calculation.
              </p>
              <div className="setup-age-wrapper">
                <input
                  type="number"
                  min="1"
                  max="120"
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Enter your age (e.g. 28)"
                  className="setup-age-input"
                />
                <span className="setup-age-suffix">Years old</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className="setup-submit-btn"
            >
              {saving ? 'Configuring Your Dashboard...' : 'Complete Setup & Launch Dashboard 🚀'}
            </button>
          </form>
        </div>
      </AmbientWindBackground>

      <style>{`
        .health-setup-page {
          min-height: 100vh;
          width: 100%;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }

        .health-setup-ambient {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 36px 20px;
        }

        .health-setup-card {
          max-width: 680px;
          width: 100%;
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: 20px;
          padding: 36px 32px;
          box-shadow: 0 12px 40px rgba(15, 118, 110, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04);
          border: 1.5px solid rgba(255, 255, 255, 0.95);
        }

        .health-setup-header {
          text-align: center;
          margin-bottom: 22px;
        }

        .health-setup-icon-badge {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          background: #e6f7f5;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }

        .health-setup-title {
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 6px 0;
          letter-spacing: -0.3px;
        }

        .health-setup-subtitle {
          font-size: 13px;
          color: #475569;
          margin: 0;
          line-height: 1.4;
        }

        /* Progress Bar */
        .health-setup-progress-bar {
          display: flex;
          gap: 6px;
          margin-bottom: 28px;
        }

        .progress-segment {
          flex: 1;
          height: 4px;
          border-radius: 4px;
          background: #e2e8f0;
          transition: all 0.3s ease;
        }

        .progress-segment--active {
          background: #10b981;
        }

        /* Form */
        .health-setup-form {
          display: flex;
          flex-direction: column;
          gap: 26px;
        }

        .setup-question-block {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .setup-question-title {
          font-size: 14.5px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .setup-q-icon {
          font-size: 16px;
        }

        .setup-question-desc {
          font-size: 12px;
          color: #475569;
          margin: 0 0 6px 0;
          line-height: 1.4;
        }

        .setup-input-wrapper {
          width: 100%;
        }

        /* Option Grids */
        .setup-persona-grid,
        .setup-respiratory-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .setup-exposure-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .setup-option-card {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1.5px solid #e2e8f0;
          background: #ffffff;
          cursor: pointer;
          transition: all 0.18s ease;
          user-select: none;
        }

        .setup-option-card:hover {
          border-color: #a7f3d0;
          background: #fafafa;
        }

        .setup-option-card--selected {
          border-color: #10b981;
          background: #f0fdf4;
          box-shadow: 0 0 0 1px #10b981;
        }

        .setup-option-card--pill {
          align-items: center;
          padding: 10px 12px;
        }

        .setup-radio-bullet {
          position: relative;
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .setup-option-card--pill .setup-radio-bullet {
          margin-top: 0;
        }

        .setup-radio-bullet input[type="radio"] {
          position: absolute;
          opacity: 0;
          cursor: pointer;
          inset: 0;
          margin: 0;
        }

        .radio-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 1.5px solid #cbd5e1;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .setup-option-card--selected .radio-dot {
          border-color: #10b981;
          background: #10b981;
        }

        .setup-option-card--selected .radio-dot::after {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ffffff;
        }

        .setup-option-content {
          flex: 1;
        }

        .setup-option-title {
          font-size: 13px;
          font-weight: 700;
          color: #1e293b;
          line-height: 1.3;
        }

        .setup-option-desc {
          font-size: 11px;
          color: #64748b;
          margin-top: 2px;
          line-height: 1.3;
        }

        /* Age Input */
        .setup-age-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
          max-width: 240px;
        }

        .setup-age-input {
          padding: 10px 14px;
          border: 1.5px solid #cbd5e1;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 700;
          color: #0f172a !important;
          background: #ffffff !important;
          width: 120px;
          outline: none;
          transition: all 0.2s;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
        }

        .setup-age-input:focus {
          border-color: #10b981;
          background: #ffffff !important;
          color: #0f172a !important;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
        }

        .setup-age-suffix {
          font-size: 13px;
          font-weight: 600;
          color: #475569;
        }

        /* Submit Button */
        .setup-submit-btn {
          margin-top: 8px;
          width: 100%;
          padding: 14px 20px;
          background: #0f766e;
          color: #ffffff;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(15, 118, 110, 0.25);
        }

        .setup-submit-btn:hover {
          background: #115e59;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(15, 118, 110, 0.35);
        }

        .setup-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        @media (max-width: 640px) {
          .health-setup-card {
            padding: 24px 18px;
          }

          .setup-persona-grid,
          .setup-respiratory-grid,
          .setup-exposure-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
