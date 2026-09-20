import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Wind, 
  Loader2, 
  CheckCircle2, 
  Mail, 
  Lock, 
  User, 
  MapPin, 
  Building2, 
  Leaf, 
  Sparkles, 
  Shield, 
  Activity, 
  Brain 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AmbientWindBackground from '../components/AmbientWindBackground';

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    district: 'East Delhi', 
    city: 'Anand Vihar, Delhi', 
    state: 'Delhi' 
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await register(form);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message || 'Registration failed. Confirm the API is running on port 8081.');
    }
  };

  // Features list for footer
  const features = [
    { icon: Shield, text: 'REAL-TIME AQI DATA' },
    { icon: Activity, text: 'HEALTH SURVEILLANCE' },
    { icon: Brain, text: 'SECURE ACCESS' },
  ];

  return (
    <div className="register-container">
      {/* Left Side - Register Form */}
      <div className="register-left">
        <div className="register-content">
          {/* Brand - Logo */}
          <div className="register-brand">
            <div className="register-brand-icon">
              <Leaf size={22} strokeWidth={2.5} />
            </div>
            <div>
              <div className="register-brand-name">VayuHealth</div>
              <div className="register-brand-sub">Environmental Health Intelligence</div>
            </div>
          </div>

          {/* Hero Section */}
          <div className="register-hero">
            <h1 className="register-hero-title">
              Join VayuHealth <br />
              <span className="register-hero-highlight">Environmental Platform</span>
            </h1>
            <p className="register-hero-subtitle">
              Create an account to monitor your local air quality and receive real-time predictive health directives.
            </p>
          </div>

          {/* Register Form Card */}
          <div className="register-form-wrapper">
            <div className="register-form-header">
              <h2>Create Account</h2>
              <p>Get started with environmental health intelligence</p>
            </div>

            {success ? (
              <div className="register-success-card">
                <CheckCircle2 size={48} color="#10b981" />
                <h3>Account Created Successfully!</h3>
                <p>Redirecting you to sign in...</p>
              </div>
            ) : (
              <form onSubmit={submit} className="register-form">
                {/* Full Name */}
                <div className="register-form-group">
                  <label className="register-label">
                    <User size={15} />
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={update('name')}
                    placeholder="Dr. Jane Smith / John Doe"
                    className="register-input"
                  />
                </div>

                {/* Email */}
                <div className="register-form-group">
                  <label className="register-label">
                    <Mail size={15} />
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={update('email')}
                    placeholder="name@example.com"
                    className="register-input"
                  />
                </div>

                {/* Password */}
                <div className="register-form-group">
                  <label className="register-label">
                    <Lock size={15} />
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={update('password')}
                    placeholder="••••••••"
                    className="register-input"
                  />
                </div>

                {/* City and State in 2 cols */}
                <div className="register-form-row">
                  <div className="register-form-group">
                    <label className="register-label">
                      <Building2 size={15} />
                      City
                    </label>
                    <input
                      type="text"
                      required
                      value={form.city}
                      onChange={update('city')}
                      placeholder="e.g. Anand Vihar, Delhi"
                      className="register-input"
                    />
                  </div>
                  <div className="register-form-group">
                    <label className="register-label">
                      <MapPin size={15} />
                      State
                    </label>
                    <input
                      type="text"
                      required
                      value={form.state}
                      onChange={update('state')}
                      placeholder="e.g. Delhi"
                      className="register-input"
                    />
                  </div>
                </div>

                {/* District */}
                <div className="register-form-group">
                  <label className="register-label">
                    <MapPin size={15} />
                    District
                  </label>
                  <input
                    type="text"
                    value={form.district}
                    onChange={update('district')}
                    placeholder="District name (e.g. East Delhi)"
                    className="register-input"
                  />
                </div>

                {error && <div className="register-error">{error}</div>}

                <button className="register-submit-btn" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 size={18} className="spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account →'
                  )}
                </button>

                <div className="register-divider">
                  <span>OR</span>
                </div>

                <Link to="/login" className="register-login-btn">
                  Already have an account? Sign in
                </Link>
              </form>
            )}

            {/* Features footer */}
            <div className="register-features-footer">
              {features.map((feature, idx) => (
                <div key={idx} className="register-feature-tag">
                  <feature.icon size={12} />
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Dynamic Light-Theme Wind/Breeze Showcase */}
      <div className="register-right">
        <AmbientWindBackground>
          <div className="register-showcase-container">
            {/* Live Indicator */}
            <div className="register-live-pill">
              <span className="register-live-dot" />
              <span>Real-Time Environmental Intelligence Active</span>
            </div>

            <h2 className="register-showcase-title">
              Precision Air Quality & Clinical Health Protection
            </h2>
            <p className="register-showcase-desc">
              High-resolution spatial air quality tracking, disease surveillance, and AI-guided safe pathfinding.
            </p>

            {/* Dynamic Interactive Cards */}
            <div className="register-feature-cards">
              <div className="register-feature-card">
                <div className="register-feature-card__icon" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                  <Activity size={20} />
                </div>
                <div className="register-feature-card__text">
                  <div className="register-card-head">
                    <h4>Live Satellite AQI Surveillance</h4>
                    <span className="register-chip register-chip--green">Active Feed</span>
                  </div>
                  <p>Real-time spatial air quality tracking across 50+ Indian regions</p>
                </div>
              </div>

              <div className="register-feature-card">
                <div className="register-feature-card__icon" style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                  <Shield size={20} />
                </div>
                <div className="register-feature-card__text">
                  <div className="register-card-head">
                    <h4>Predictive Disease Surveillance</h4>
                    <span className="register-chip register-chip--blue">6D Matrix</span>
                  </div>
                  <p>Airborne health risk matrix & personalized clinical directives</p>
                </div>
              </div>

              <div className="register-feature-card">
                <div className="register-feature-card__icon" style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>
                  <Wind size={20} />
                </div>
                <div className="register-feature-card__text">
                  <div className="register-card-head">
                    <h4>Clean Air Safe Route Navigation</h4>
                    <span className="register-chip register-chip--amber">AI Routing</span>
                  </div>
                  <p>AI-guided pathfinding avoiding high AQI and pollution spikes</p>
                </div>
              </div>
            </div>

            {/* Live Stats */}
            <div className="register-showcase-stats">
              <div className="register-showcase-stat">
                <span className="register-showcase-stat__val">99.4%</span>
                <span className="register-showcase-stat__lbl">Data Accuracy</span>
              </div>
              <div className="register-showcase-stat">
                <span className="register-showcase-stat__val">50+</span>
                <span className="register-showcase-stat__lbl">Cities Tracked</span>
              </div>
              <div className="register-showcase-stat">
                <span className="register-showcase-stat__val">24/7</span>
                <span className="register-showcase-stat__lbl">AI Surveillance</span>
              </div>
            </div>

            <div className="register-showcase-quote-wrapper">
              <p className="register-showcase-quote">
                "Your health changes with the environment. Stay informed."
              </p>
            </div>
          </div>
        </AmbientWindBackground>
      </div>

      <style>{`
        .register-container {
          display: flex;
          min-height: 100vh;
          background: #f8fafc;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* Left Side */
        .register-left {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 48px;
          background: white;
          overflow-y: auto;
        }

        .register-content {
          max-width: 480px;
          width: 100%;
        }

        /* Brand */
        .register-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
        }

        .register-brand-icon {
          width: 38px;
          height: 38px;
          background: #0f766e;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .register-brand-name {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.2;
        }

        .register-brand-sub {
          font-size: 11.5px;
          color: #64748b;
        }

        /* Hero */
        .register-hero {
          margin-bottom: 24px;
        }

        .register-hero-title {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.25;
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
        }

        .register-hero-highlight {
          color: #0d9488;
        }

        .register-hero-subtitle {
          font-size: 13px;
          color: #64748b;
          line-height: 1.5;
          margin: 0;
        }

        /* Form Wrapper */
        .register-form-wrapper {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          padding: 24px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
        }

        .register-form-header {
          margin-bottom: 18px;
        }

        .register-form-header h2 {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px 0;
        }

        .register-form-header p {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        .register-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .register-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .register-form-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .register-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #334155;
        }

        .register-label svg {
          color: #64748b;
        }

        .register-input {
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

        .register-input:focus {
          outline: none;
          border-color: #0d9488;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.15);
          background: white;
        }

        .register-error {
          padding: 10px 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          border-radius: 8px;
          font-size: 12px;
        }

        .register-success-card {
          text-align: center;
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .register-success-card h3 {
          margin: 0;
          color: #065f46;
          font-size: 18px;
        }

        .register-success-card p {
          margin: 0;
          color: #64748b;
          font-size: 13px;
        }

        .register-submit-btn {
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

        .register-submit-btn:hover {
          background: #115e59;
          transform: translateY(-1px);
        }

        .register-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .register-divider {
          display: flex;
          align-items: center;
          gap: 14px;
          margin: 2px 0;
        }

        .register-divider::before,
        .register-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e2e8f0;
        }

        .register-divider span {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 600;
          text-transform: uppercase;
        }

        .register-login-btn {
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

        .register-login-btn:hover {
          background: #f0fdfa;
        }

        .register-features-footer {
          display: flex;
          justify-content: center;
          gap: 14px;
          margin-top: 18px;
          flex-wrap: wrap;
        }

        .register-feature-tag {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 700;
          color: #475569;
          letter-spacing: 0.3px;
        }

        .register-feature-tag svg {
          color: #0d9488;
        }

        /* Right Side - Dynamic Showcase */
        .register-right {
          flex: 1.15;
          position: relative;
          min-height: 100vh;
          display: none;
        }

        .register-showcase-container {
          max-width: 480px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .register-live-pill {
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

        .register-live-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 12px #10b981;
          animation: pulseDot 2s infinite ease-in-out;
        }

        .register-showcase-title {
          font-size: 28px;
          font-weight: 800;
          line-height: 1.25;
          margin: 0;
          letter-spacing: -0.6px;
          color: #064e3b;
        }

        .register-showcase-desc {
          font-size: 13.5px;
          color: #334155;
          line-height: 1.5;
          margin: 0;
        }

        .register-feature-cards {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .register-feature-card {
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

        .register-feature-card:hover {
          background: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(15, 118, 110, 0.14);
          border-color: #a7f3d0;
        }

        .register-feature-card__icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .register-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .register-feature-card__text {
          flex: 1;
        }

        .register-feature-card__text h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
        }

        .register-chip {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 12px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .register-chip--green {
          background: #dcfce7;
          color: #15803d;
        }

        .register-chip--blue {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .register-chip--amber {
          background: #fef3c7;
          color: #b45309;
        }

        .register-feature-card__text p {
          margin: 4px 0 0 0;
          font-size: 12px;
          color: #475569;
          line-height: 1.35;
        }

        .register-showcase-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding-top: 16px;
          border-top: 1.5px solid rgba(16, 185, 129, 0.25);
        }

        .register-showcase-stat {
          display: flex;
          flex-direction: column;
          background: rgba(255, 255, 255, 0.85);
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 2px 8px rgba(15, 118, 110, 0.05);
        }

        .register-showcase-stat__val {
          font-size: 23px;
          font-weight: 800;
          color: #0f766e;
          line-height: 1;
        }

        .register-showcase-stat__lbl {
          font-size: 11px;
          color: #475569;
          margin-top: 4px;
          font-weight: 700;
        }

        .register-showcase-quote-wrapper {
          background: rgba(255, 255, 255, 0.8);
          border-radius: 10px;
          padding: 10px 14px;
          border-left: 3.5px solid #10b981;
          box-shadow: 0 2px 6px rgba(0,0,0,0.02);
        }

        .register-showcase-quote {
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
          .register-right {
            display: block;
          }
        }

        @media (max-width: 1024px) {
          .register-left {
            padding: 32px 24px;
          }

          .register-content {
            max-width: 100%;
          }

          .register-form-wrapper {
            padding: 20px;
          }

          .register-hero-title {
            font-size: 24px;
          }
        }

        @media (max-width: 768px) {
          .register-container {
            flex-direction: column;
          }

          .register-left {
            padding: 20px 16px;
            min-height: 100vh;
          }

          .register-right {
            display: none;
          }

          .register-hero-title {
            font-size: 22px;
          }

          .register-form-wrapper {
            padding: 16px;
          }

          .register-form-row {
            grid-template-columns: 1fr;
          }

          .register-features-footer {
            flex-direction: column;
            align-items: center;
            gap: 6px;
          }
        }
      `}</style>
    </div>
  );
}
