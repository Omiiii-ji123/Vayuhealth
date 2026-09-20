import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Wind, 
  Loader2, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  Shield, 
  Activity, 
  Leaf,
  Sparkles,
  MapPin,
  Stethoscope,
  Globe2,
  TrendingUp,
  Radio
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AmbientWindBackground from '../components/AmbientWindBackground';

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: 'admin@vayuhealth.gov.in', password: 'admin123' });
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await login(form.email, form.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed. Check your credentials.');
    }
  };

  const handleQuickAdminDemo = async () => {
    setError(null);
    try {
      await login('admin@vayuhealth.gov.in', 'admin123');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError('Regulatory demo login failed.');
    }
  };

  // Features list for footer
  const features = [
    { icon: TrendingUp, text: '72H COUPLED FORECAST' },
    { icon: Activity, text: 'CAQM SECTION 12 ORDERS' },
    { icon: Shield, text: 'NASA FIRMS TELEMETRY' },
  ];

  return (
    <div className="login-container">
      {/* Left Side - Login Form */}
      <div className="login-left">
        <div className="login-content">
          {/* Brand - Logo */}
          <div className="login-brand">
            <div className="login-brand-icon">
              <Leaf size={22} strokeWidth={2.5} />
            </div>
            <div>
              <div className="login-brand-name">VayuHealth CPCB</div>
              <div className="login-brand-sub">Ministry of Environment, Forest & Climate Change</div>
            </div>
          </div>

          {/* Hero Section */}
          <div className="login-hero">
            <div className="cpcb-authority-tag" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: '#38bdf8',
              fontSize: '11px',
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: '20px',
              marginBottom: '10px',
              letterSpacing: '0.6px',
              textTransform: 'uppercase'
            }}>
              <span>🏛️ Air Quality Regulatory Authority (CPCB / CAQM / MoEFCC)</span>
            </div>
            <h1 className="login-hero-title">
              72-Hour Coupled <br />
              <span className="login-hero-highlight">Atmospheric Command System</span>
            </h1>
            <p className="login-hero-subtitle">
              Continuous CAAQMS telemetry, two-way chemistry-weather coupling, and statutory Section 12 GRAP enforcement portal (SIH PS-82).
            </p>
          </div>

          {/* Login Form Card */}
          <div className="login-form-wrapper">
            <div className="login-form-header">
              <h2>Official Regulatory Access</h2>
              <p>Sign in using your authorized CPCB / CAQM ministerial credentials</p>
            </div>

            <form onSubmit={submit} className="login-form">
              {/* Email */}
              <div className="login-form-group">
                <label className="login-label">
                  <Mail size={15} />
                  Authorized Regulatory Officer Email
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={update('email')}
                  placeholder="admin@vayuhealth.gov.in"
                  className="login-input"
                />
              </div>

              {/* Password */}
              <div className="login-form-group">
                <label className="login-label">
                  <Lock size={15} />
                  Regulatory Access Passkey
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={update('password')}
                    placeholder="••••••••"
                    className="login-input"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="login-options">
                <label className="login-checkbox">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Keep session authenticated</span>
                </label>
              </div>

              {error && <div className="login-error">{error}</div>}

              <button className="login-submit-btn" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    Authenticating Authority Access...
                  </>
                ) : (
                  'Authorize Regulatory Access →'
                )}
              </button>

              {/* Quick 1-Click Demo Button */}
              <div className="quick-demo-buttons-wrap">
                <button
                  type="button"
                  className="quick-demo-btn quick-demo-btn--admin"
                  onClick={handleQuickAdminDemo}
                >
                  ⚡ 1-Click Access: CPCB Central Air Command
                </button>
              </div>
            </form>

            {/* Features footer */}
            <div className="login-features-footer">
              {features.map((feature, idx) => (
                <div key={idx} className="login-feature-tag">
                  <feature.icon size={12} />
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Dynamic Light-Theme Wind/Breeze Showcase */}
      <div className="login-right">
        <AmbientWindBackground>
          <div className="login-showcase-container">
            {/* Live Indicator Badge */}
            <div className="login-live-pill">
              <span className="login-live-dot" />
              <span>Real-Time Environmental Intelligence Active</span>
            </div>

            <h2 className="login-showcase-title">
              Precision Air Quality & Clinical Health Protection
            </h2>
            <p className="login-showcase-desc">
              High-resolution spatial air surveillance, AI-powered disease forecasting, and safest clean air navigation.
            </p>

            {/* Dynamic Interactive Cards */}
            <div className="login-feature-cards">
              <div className="login-feature-card">
                <div className="login-feature-card__icon" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                  <Activity size={20} />
                </div>
                <div className="login-feature-card__text">
                  <div className="login-card-head">
                    <h4>Live Satellite AQI Surveillance</h4>
                    <span className="login-chip login-chip--green">Active Feed</span>
                  </div>
                  <p>Real-time spatial air quality tracking across 50+ Indian regions</p>
                </div>
              </div>

              <div className="login-feature-card">
                <div className="login-feature-card__icon" style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                  <Shield size={20} />
                </div>
                <div className="login-feature-card__text">
                  <div className="login-card-head">
                    <h4>Predictive Disease Surveillance</h4>
                    <span className="login-chip login-chip--blue">6D Matrix</span>
                  </div>
                  <p>Airborne health risk matrix & personalized clinical directives</p>
                </div>
              </div>

              <div className="login-feature-card">
                <div className="login-feature-card__icon" style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>
                  <Wind size={20} />
                </div>
                <div className="login-feature-card__text">
                  <div className="login-card-head">
                    <h4>Clean Air Safe Route Navigation</h4>
                    <span className="login-chip login-chip--amber">AI Routing</span>
                  </div>
                  <p>AI-guided pathfinding avoiding high AQI and pollution spikes</p>
                </div>
              </div>
            </div>

            {/* Live Stats */}
            <div className="login-showcase-stats">
              <div className="login-showcase-stat">
                <span className="login-showcase-stat__val">99.4%</span>
                <span className="login-showcase-stat__lbl">Data Accuracy</span>
              </div>
              <div className="login-showcase-stat">
                <span className="login-showcase-stat__val">50+</span>
                <span className="login-showcase-stat__lbl">Cities Tracked</span>
              </div>
              <div className="login-showcase-stat">
                <span className="login-showcase-stat__val">24/7</span>
                <span className="login-showcase-stat__lbl">AI Surveillance</span>
              </div>
            </div>

            <div className="login-showcase-quote-wrapper">
              <p className="login-showcase-quote">
                "Your health changes with the environment. Stay informed."
              </p>
            </div>
          </div>
        </AmbientWindBackground>
      </div>

      <style>{`
        .login-container {
          display: flex;
          min-height: 100vh;
          background: #f8fafc;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* Left Side */
        .login-left {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 48px;
          background: white;
          overflow-y: auto;
        }

        .login-content {
          max-width: 480px;
          width: 100%;
        }

        /* Brand */
        .login-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
        }

        .login-brand-icon {
          width: 38px;
          height: 38px;
          background: #0f766e;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .login-brand-name {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.2;
        }

        .login-brand-sub {
          font-size: 11.5px;
          color: #64748b;
        }

        /* Hero */
        .login-hero {
          margin-bottom: 24px;
        }

        .login-hero-title {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.25;
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
        }

        .login-hero-highlight {
          color: #0d9488;
        }

        .login-hero-subtitle {
          font-size: 13px;
          color: #64748b;
          line-height: 1.5;
          margin: 0;
        }

        /* Form Wrapper */
        .login-mode-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 10px;
        }

        .login-mode-tab {
          flex: 1;
          padding: 8px 12px;
          border: none;
          background: none;
          color: #64748b;
          font-size: 12.5px;
          font-weight: 700;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .login-mode-tab--active {
          background: white;
          color: #0f172a;
          box-shadow: 0 2px 6px rgba(0,0,0,0.06);
        }

        .login-mode-tab--admin-active {
          background: #ef4444;
          color: white;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.35);
        }

        .quick-demo-buttons-wrap {
          margin-top: 10px;
        }

        .quick-demo-btn {
          width: 100%;
          padding: 9px 12px;
          border: 1px dashed rgba(239, 68, 68, 0.6);
          background: rgba(239, 68, 68, 0.08);
          color: #dc2626;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .quick-demo-btn:hover {
          background: rgba(239, 68, 68, 0.16);
          border-color: #ef4444;
        }

        .login-form-wrapper {
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 24px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
        }

        .login-form-header {
          margin-bottom: 18px;
        }

        .login-form-header h2 {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px 0;
        }

        .login-form-header p {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .login-form-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .login-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #334155;
        }

        .login-label svg {
          color: #64748b;
        }

        .login-input {
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 13.5px;
          color: #0f172a;
          transition: all 0.2s;
          background: #f8fafc;
          width: 100%;
          box-sizing: border-box;
        }

        .login-input:focus {
          outline: none;
          border-color: #0d9488;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.15);
          background: white;
        }

        .login-password-wrapper {
          position: relative;
          width: 100%;
        }

        .login-input-password {
          padding-right: 40px;
        }

        .login-password-toggle {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
        }

        .login-password-toggle:hover {
          color: #475569;
        }

        .login-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 2px 0;
        }

        .login-checkbox {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #475569;
          cursor: pointer;
        }

        .login-checkbox input {
          accent-color: #0d9488;
        }

        .login-forgot {
          font-size: 12px;
          color: #0d9488;
          font-weight: 600;
          text-decoration: none;
        }

        .login-forgot:hover {
          text-decoration: underline;
        }

        .login-error {
          padding: 10px 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          border-radius: 8px;
          font-size: 12px;
        }

        .login-submit-btn {
          padding: 11px 20px;
          background: #0f766e;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(15, 118, 110, 0.25);
        }

        .login-submit-btn:hover {
          background: #115e59;
          transform: translateY(-1px);
        }

        .login-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-divider {
          display: flex;
          align-items: center;
          gap: 14px;
          margin: 2px 0;
        }

        .login-divider::before,
        .login-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e2e8f0;
        }

        .login-divider span {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 600;
          text-transform: uppercase;
        }

        .login-register-btn {
          padding: 10px 20px;
          background: transparent;
          color: #0f766e;
          border: 1.5px solid #0f766e;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          text-decoration: none;
          display: inline-block;
        }

        .login-register-btn:hover {
          background: #f0fdfa;
        }

        .login-features-footer {
          display: flex;
          justify-content: center;
          gap: 14px;
          margin-top: 18px;
          flex-wrap: wrap;
        }

        .login-feature-tag {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 700;
          color: #475569;
          letter-spacing: 0.3px;
        }

        .login-feature-tag svg {
          color: #0d9488;
        }

        /* Right Side - Dynamic Showcase */
        .login-right {
          flex: 1.15;
          position: relative;
          min-height: 100vh;
          display: none;
        }

        .login-showcase-container {
          max-width: 480px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .login-live-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.9);
          border: 1.5px solid #a7f3d0;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.15);
          backdrop-filter: blur(12px);
          padding: 7px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 800;
          color: #065f46;
          width: fit-content;
        }

        .login-live-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 12px #10b981;
          animation: pulseDot 2s infinite ease-in-out;
        }

        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }

        .login-showcase-title {
          font-size: 28px;
          font-weight: 800;
          line-height: 1.25;
          margin: 0;
          letter-spacing: -0.6px;
          color: #064e3b;
        }

        .login-showcase-desc {
          font-size: 13.5px;
          color: #334155;
          line-height: 1.5;
          margin: 0;
        }

        .login-feature-cards {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .login-feature-card {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 15px 18px;
          background: rgba(255, 255, 255, 0.92);
          border: 1.5px solid rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(16px);
          border-radius: 16px;
          box-shadow: 0 6px 20px rgba(15, 118, 110, 0.07), 0 1px 3px rgba(0, 0, 0, 0.03);
          transition: all 0.25s ease;
        }

        .login-feature-card:hover {
          background: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(15, 118, 110, 0.14);
          border-color: #a7f3d0;
        }

        .login-feature-card__icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .login-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .login-feature-card__text {
          flex: 1;
        }

        .login-feature-card__text h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
        }

        .login-chip {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 12px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .login-chip--green {
          background: #dcfce7;
          color: #15803d;
        }

        .login-chip--blue {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .login-chip--amber {
          background: #fef3c7;
          color: #b45309;
        }

        .login-feature-card__text p {
          margin: 4px 0 0 0;
          font-size: 12px;
          color: #475569;
          line-height: 1.35;
        }

        .login-showcase-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding-top: 16px;
          border-top: 1.5px solid rgba(16, 185, 129, 0.25);
        }

        .login-showcase-stat {
          display: flex;
          flex-direction: column;
          background: rgba(255, 255, 255, 0.85);
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 2px 8px rgba(15, 118, 110, 0.05);
        }

        .login-showcase-stat__val {
          font-size: 23px;
          font-weight: 800;
          color: #0f766e;
          line-height: 1;
        }

        .login-showcase-stat__lbl {
          font-size: 11px;
          color: #475569;
          margin-top: 4px;
          font-weight: 700;
        }

        .login-showcase-quote-wrapper {
          background: rgba(255, 255, 255, 0.8);
          border-radius: 10px;
          padding: 10px 14px;
          border-left: 3.5px solid #10b981;
          box-shadow: 0 2px 6px rgba(0,0,0,0.02);
        }

        .login-showcase-quote {
          font-size: 12.5px;
          font-style: italic;
          color: #065f46;
          margin: 0;
          font-weight: 600;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @media (min-width: 1024px) {
          .login-right {
            display: block;
          }
        }

        @media (max-width: 1024px) {
          .login-left {
            padding: 32px 24px;
          }

          .login-content {
            max-width: 100%;
          }

          .login-form-wrapper {
            padding: 20px;
          }

          .login-hero-title {
            font-size: 24px;
          }
        }

        @media (max-width: 768px) {
          .login-container {
            flex-direction: column;
          }

          .login-left {
            padding: 20px 16px;
            min-height: 100vh;
          }

          .login-right {
            display: none;
          }

          .login-hero-title {
            font-size: 22px;
          }

          .login-form-wrapper {
            padding: 16px;
          }

          .login-options {
            flex-direction: column;
            gap: 6px;
            align-items: flex-start;
          }

          .login-features-footer {
            flex-direction: column;
            align-items: center;
            gap: 6px;
          }
        }
      `}</style>
    </div>
  );
}
