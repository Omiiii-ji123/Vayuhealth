import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wind, Loader2, CheckCircle2, Mail, Lock, User, MapPin, Building2, Leaf, Sparkles, Shield, Activity, Brain } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Import images
import forestBg from '../assets/forest.jpg';

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    district: '', 
    city: '', 
    state: '' 
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
              <Leaf size={24} strokeWidth={2.5} />
            </div>
            <div>
              <div className="register-brand-name">VayuHealth</div>
              <div className="register-brand-sub">Environmental Health</div>
            </div>
          </div>

          {/* Hero Section */}
          <div className="register-hero">
            <h1 className="register-hero-title">
              Environmental Health <br />
              <span className="register-hero-highlight">Intelligence Platform</span>
            </h1>
            <p className="register-hero-subtitle">
              Track air quality, get AI insights, and monitor disease risk in your area.
            </p>
          </div>

          {/* Register Form */}
          <div className="register-form-wrapper">
            <div className="register-form-header">
              <h2>Create your account</h2>
              <p>Join Vayu Health and start monitoring your environment</p>
            </div>

            {success ? (
              <div className="register-success">
                <CheckCircle2 size={24} />
                <span>Account created successfully!</span>
                <p>Redirecting to sign in...</p>
              </div>
            ) : (
              <form onSubmit={submit} className="register-form">
                <div className="register-form-group">
                  <label className="register-label">
                    <User size={16} />
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={update('name')}
                    placeholder="Alex Johnson"
                    className="register-input"
                  />
                </div>

                <div className="register-form-group">
                  <label className="register-label">
                    <Mail size={16} />
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={update('email')}
                    placeholder="you@example.com"
                    className="register-input"
                  />
                </div>

                <div className="register-form-group">
                  <label className="register-label">
                    <Lock size={16} />
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

                <div className="register-form-row">
                  <div className="register-form-group register-form-group--half">
                    <label className="register-label">
                      <MapPin size={16} />
                      City
                    </label>
                    <input
                      value={form.city}
                      onChange={update('city')}
                      placeholder="Mumbai"
                      className="register-input"
                    />
                  </div>
                  <div className="register-form-group register-form-group--half">
                    <label className="register-label">
                      <Building2 size={16} />
                      State
                    </label>
                    <input
                      value={form.state}
                      onChange={update('state')}
                      placeholder="Maharashtra"
                      className="register-input"
                    />
                  </div>
                </div>

                <div className="register-form-group">
                  <label className="register-label">
                    <MapPin size={16} />
                    District
                  </label>
                  <input
                    value={form.district}
                    onChange={update('district')}
                    placeholder="District name (for health surveillance data)"
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

      {/* Right Side - Forest Background */}
      <div className="register-right">
        <div className="register-right-overlay">
          <div className="register-right-content">
            <div className="register-right-brand">
              <div className="register-right-brand-icon">
                <Leaf size={28} strokeWidth={2} />
              </div>
              <span>VayuHealth</span>
            </div>
            <div className="register-right-quote">
              <p>"Clean air is not a luxury—it's a right."</p>
              <span>Environmental Health Platform</span>
            </div>
            <div className="register-right-stats">
              <div className="register-right-stat">
                <span className="register-right-stat-value">99.2%</span>
                <span className="register-right-stat-label">Air Quality Accuracy</span>
              </div>
              <div className="register-right-stat">
                <span className="register-right-stat-value">50+</span>
                <span className="register-right-stat-label">Cities Monitored</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .register-container {
          display: flex;
          min-height: 100vh;
          background: #f0f4f8;
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
          max-width: 500px;
          width: 100%;
        }

        /* Brand */
        .register-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 32px;
        }

        .register-brand-icon {
          width: 40px;
          height: 40px;
          background: #2f855a;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .register-brand-name {
          font-size: 18px;
          font-weight: 700;
          color: #1a202c;
          line-height: 1.2;
        }

        .register-brand-sub {
          font-size: 11px;
          color: #718096;
        }

        /* Hero */
        .register-hero {
          margin-bottom: 24px;
        }

        .register-hero-title {
          font-size: 28px;
          font-weight: 700;
          color: #1a202c;
          line-height: 1.2;
          margin: 0 0 10px 0;
        }

        .register-hero-highlight {
          background: linear-gradient(135deg, #2b6cb0, #2f855a);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .register-hero-subtitle {
          font-size: 14px;
          color: #4a5568;
          line-height: 1.6;
          margin: 0;
        }

        /* Form Wrapper */
        .register-form-wrapper {
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 28px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        }

        .register-form-header {
          margin-bottom: 24px;
        }

        .register-form-header h2 {
          font-size: 22px;
          font-weight: 700;
          color: #1a202c;
          margin: 0 0 4px 0;
        }

        .register-form-header p {
          font-size: 13px;
          color: #718096;
          margin: 0;
        }

        /* Form */
        .register-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .register-form-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .register-form-group--half {
          flex: 1;
        }

        .register-form-row {
          display: flex;
          gap: 12px;
        }

        .register-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #2d3748;
        }

        .register-label svg {
          color: #718096;
        }

        .register-input {
          padding: 9px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 13px;
          color: #2d3748;
          transition: all 0.2s;
          background: #f7fafc;
          width: 100%;
        }

        .register-input:focus {
          outline: none;
          border-color: #4299e1;
          box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
          background: white;
        }

        .register-input::placeholder {
          color: #a0aec0;
          font-size: 13px;
        }

        /* Success */
        .register-success {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 20px;
          text-align: center;
        }

        .register-success svg {
          color: #48bb78;
          margin-bottom: 12px;
        }

        .register-success span {
          font-size: 18px;
          font-weight: 600;
          color: #2d3748;
        }

        .register-success p {
          font-size: 14px;
          color: #718096;
          margin-top: 4px;
        }

        /* Error */
        .register-error {
          padding: 8px 12px;
          background: #fed7d7;
          color: #9b2c2c;
          border-radius: 6px;
          font-size: 12px;
          border-left: 3px solid #e53e3e;
        }

        /* Buttons */
        .register-submit-btn {
          padding: 10px 20px;
          background: #2f855a;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 4px;
        }

        .register-submit-btn:hover:not(:disabled) {
          background: #276749;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(47, 133, 90, 0.25);
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
          color: #a0aec0;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .register-login-btn {
          padding: 10px 20px;
          background: transparent;
          color: #2f855a;
          border: 2px solid #2f855a;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          text-align: center;
          text-decoration: none;
          display: inline-block;
        }

        .register-login-btn:hover {
          background: #2f855a;
          color: white;
          transform: translateY(-1px);
        }

        /* Features Footer */
        .register-features-footer {
          display: flex;
          justify-content: center;
          gap: 14px;
          margin-top: 20px;
          flex-wrap: wrap;
        }

        .register-feature-tag {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 600;
          color: #2d3748;
          letter-spacing: 0.3px;
        }

        .register-feature-tag svg {
          color: #48bb78;
          width: 12px;
          height: 12px;
        }

        /* Right Side - Forest Background */
        .register-right {
          flex: 1;
          position: relative;
          background: url(${forestBg}) center/cover no-repeat;
          background-color: #1a202c;
          min-height: 100vh;
          display: none;
        }

        /* Gradient overlay */
        .register-right::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(26, 32, 44, 0.5) 0%,
            rgba(26, 32, 44, 0.7) 50%,
            rgba(26, 32, 44, 0.9) 100%
          );
          z-index: 1;
        }

        .register-right-overlay {
          position: absolute;
          inset: 0;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
        }

        .register-right-content {
          max-width: 380px;
          color: white;
          text-align: center;
        }

        .register-right-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 36px;
        }

        .register-right-brand-icon {
          width: 40px;
          height: 40px;
          background: rgba(72, 187, 120, 0.2);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .register-right-brand-icon svg {
          color: #48bb78;
        }

        .register-right-quote {
          margin-bottom: 40px;
        }

        .register-right-quote p {
          font-size: 24px;
          font-weight: 300;
          line-height: 1.4;
          margin: 0 0 6px 0;
          font-style: italic;
        }

        .register-right-quote span {
          font-size: 12px;
          opacity: 0.7;
          letter-spacing: 1px;
        }

        .register-right-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          padding-top: 28px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .register-right-stat {
          display: flex;
          flex-direction: column;
        }

        .register-right-stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #48bb78;
        }

        .register-right-stat-label {
          font-size: 11px;
          opacity: 0.7;
          margin-top: 4px;
        }

        /* Animations */
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        /* Responsive */
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
            flex-direction: column;
            gap: 16px;
          }

          .register-features-footer {
            flex-direction: column;
            align-items: center;
            gap: 6px;
          }
        }

        @media (max-width: 480px) {
          .register-hero-title {
            font-size: 20px;
          }

          .register-form-header h2 {
            font-size: 20px;
          }

          .register-input {
            font-size: 14px;
            padding: 10px 12px;
          }
        }
      `}</style>
    </div>
  );
}