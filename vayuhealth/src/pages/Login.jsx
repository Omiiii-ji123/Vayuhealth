import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Wind, Loader2, Mail, Lock, Eye, EyeOff, CheckCircle, Shield, Activity, Brain, Sparkles, Leaf } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Import images
import forestBg from '../assets/forest.jpg';

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await login(form.email, form.password);
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials and that the API is running on port 8081.');
    }
  };

  // Features list for footer
  const features = [
    { icon: CheckCircle, text: 'REAL-TIME AQI DATA' },
    { icon: Activity, text: 'HEALTH SURVEILLANCE' },
    { icon: Shield, text: 'SECURE ACCESS' },
  ];

  return (
    <div className="login-container">
      {/* Left Side - Login Form */}
      <div className="login-left">
        <div className="login-content">
          {/* Brand - Logo */}
          <div className="login-brand">
            <div className="login-brand-icon">
              <Leaf size={24} strokeWidth={2.5} />
            </div>
            <div>
              <div className="login-brand-name">VayuHealth</div>
              <div className="login-brand-sub">Environmental Health</div>
            </div>
          </div>

          {/* Hero Section */}
          <div className="login-hero">
            <h1 className="login-hero-title">
              Environmental Health <br />
              <span className="login-hero-highlight">Intelligence Platform</span>
            </h1>
            <p className="login-hero-subtitle">
              Monitor air quality, track disease risks, and receive AI-powered 
              health recommendations in real time.
            </p>
          </div>


          {/* Login Form */}
          <div className="login-form-wrapper">
            <div className="login-form-header">
              <h2>Welcome Back</h2>
              <p>Sign in to continue to Vayu Health</p>
            </div>

            <form onSubmit={submit} className="login-form">
              <div className="login-form-group">
                <label className="login-label">
                  <Mail size={16} />
                  Corporate Email
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={update('email')}
                  placeholder="dr.smith@hospital.org"
                  className="login-input"
                />
              </div>

              <div className="login-form-group">
                <label className="login-label">
                  <Lock size={16} />
                  Password
                </label>
                <div className="login-password-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={update('password')}
                    placeholder="●●●●●●"
                    className="login-input login-input-password"
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="login-options">
                <label className="login-checkbox">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className="login-forgot">
                  Forgot Password?
                </Link>
              </div>

              {error && <div className="login-error">{error}</div>}

              <button className="login-submit-btn" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In →'
                )}
              </button>

              <div className="login-divider">
                <span>OR</span>
              </div>

              <Link to="/register" className="login-register-btn">
                Create New Account
              </Link>
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

      {/* Right Side - Forest Background */}
      <div className="login-right">
        <div className="login-right-overlay">
          <div className="login-right-content">
            <div className="login-right-brand">
              <div className="login-right-brand-icon">
                <Leaf size={28} strokeWidth={2} />
              </div>
              <span>VayuHealth</span>
            </div>
            <div className="login-right-quote">
              <p>"Clean air is not a luxury—it's a right."</p>
              <span>Environmental Health Platform</span>
            </div>
            <div className="login-right-stats">
              <div className="login-right-stat">
                <span className="login-right-stat-value">99.2%</span>
                <span className="login-right-stat-label">Air Quality Accuracy</span>
              </div>
              <div className="login-right-stat">
                <span className="login-right-stat-value">50+</span>
                <span className="login-right-stat-label">Cities Monitored</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          display: flex;
          min-height: 100vh;
          background: #f0f4f8;
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
          max-width: 500px;
          width: 100%;
        }

        /* Brand */
        .login-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 32px;
        }

        .login-brand-icon {
          width: 40px;
          height: 40px;
          background: #2f855a;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .login-brand-name {
          font-size: 18px;
          font-weight: 700;
          color: #1a202c;
          line-height: 1.2;
        }

        .login-brand-sub {
          font-size: 11px;
          color: #718096;
        }

        /* Hero */
        .login-hero {
          margin-bottom: 24px;
        }

        .login-hero-title {
          font-size: 28px;
          font-weight: 700;
          color: #1a202c;
          line-height: 1.2;
          margin: 0 0 10px 0;
        }

        .login-hero-highlight {
          background: linear-gradient(135deg, #2b6cb0, #2f855a);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .login-hero-subtitle {
          font-size: 14px;
          color: #4a5568;
          line-height: 1.6;
          margin: 0;
        }

        /* Features Cards */
        .login-features {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          margin-bottom: 20px;
        }

        .login-feature-card {
          padding: 12px 14px;
          background: #f7fafc;
          border-radius: 8px;
          border: 1px solid #edf2f7;
          transition: all 0.2s;
        }

        .login-feature-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .login-feature-icon {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: #e6fffa;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2f855a;
          margin-bottom: 6px;
        }

        .login-feature-card h4 {
          font-size: 12px;
          font-weight: 600;
          color: #2d3748;
          margin: 0 0 2px 0;
        }

        .login-feature-card p {
          font-size: 10px;
          color: #718096;
          margin: 0;
          line-height: 1.4;
        }

        /* Quote */
        .login-quote {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: #f0fff4;
          border-radius: 8px;
          border-left: 3px solid #48bb78;
          margin-bottom: 28px;
        }

        .login-quote svg {
          color: #48bb78;
          flex-shrink: 0;
        }

        .login-quote span {
          font-size: 13px;
          color: #2d3748;
          font-style: italic;
          font-weight: 500;
        }

        /* Form Wrapper */
        .login-form-wrapper {
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 28px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        }

        .login-form-header {
          margin-bottom: 24px;
        }

        .login-form-header h2 {
          font-size: 22px;
          font-weight: 700;
          color: #1a202c;
          margin: 0 0 4px 0;
        }

        .login-form-header p {
          font-size: 13px;
          color: #718096;
          margin: 0;
        }

        /* Form */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
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
          color: #2d3748;
        }

        .login-label svg {
          color: #718096;
        }

        .login-input {
          padding: 9px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 13px;
          color: #2d3748;
          transition: all 0.2s;
          background: #f7fafc;
          width: 100%;
        }

        .login-input:focus {
          outline: none;
          border-color: #4299e1;
          box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
          background: white;
        }

        .login-input::placeholder {
          color: #a0aec0;
          font-size: 13px;
        }

        .login-password-wrapper {
          position: relative;
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
          color: #a0aec0;
          cursor: pointer;
          padding: 4px;
        }

        .login-password-toggle:hover {
          color: #718096;
        }

        /* Options */
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
          color: #4a5568;
          cursor: pointer;
        }

        .login-checkbox input[type="checkbox"] {
          width: 14px;
          height: 14px;
          cursor: pointer;
          accent-color: #2f855a;
        }

        .login-forgot {
          font-size: 12px;
          color: #4299e1;
          text-decoration: none;
          font-weight: 500;
        }

        .login-forgot:hover {
          color: #2b6cb0;
          text-decoration: underline;
        }

        /* Error */
        .login-error {
          padding: 8px 12px;
          background: #fed7d7;
          color: #9b2c2c;
          border-radius: 6px;
          font-size: 12px;
          border-left: 3px solid #e53e3e;
        }

        /* Buttons */
        .login-submit-btn {
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
        }

        .login-submit-btn:hover:not(:disabled) {
          background: #276749;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(47, 133, 90, 0.25);
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
          color: #a0aec0;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .login-register-btn {
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

        .login-register-btn:hover {
          background: #2f855a;
          color: white;
          transform: translateY(-1px);
        }

        /* Features Footer */
        .login-features-footer {
          display: flex;
          justify-content: center;
          gap: 14px;
          margin-top: 20px;
          flex-wrap: wrap;
        }

        .login-feature-tag {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 600;
          color: #2d3748;
          letter-spacing: 0.3px;
        }

        .login-feature-tag svg {
          color: #48bb78;
          width: 12px;
          height: 12px;
        }

        /* Right Side - Forest Background */
        .login-right {
          flex: 1;
          position: relative;
          background: url(${forestBg}) center/cover no-repeat;
          background-color: #1a202c;
          min-height: 100vh;
          display: none;
        }

        /* Gradient overlay */
        .login-right::before {
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

        .login-right-overlay {
          position: absolute;
          inset: 0;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
        }

        .login-right-content {
          max-width: 380px;
          color: white;
          text-align: center;
        }

        .login-right-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 36px;
        }

        .login-right-brand-icon {
          width: 40px;
          height: 40px;
          background: rgba(72, 187, 120, 0.2);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .login-right-brand-icon svg {
          color: #48bb78;
        }

        .login-right-quote {
          margin-bottom: 40px;
        }

        .login-right-quote p {
          font-size: 24px;
          font-weight: 300;
          line-height: 1.4;
          margin: 0 0 6px 0;
          font-style: italic;
        }

        .login-right-quote span {
          font-size: 12px;
          opacity: 0.7;
          letter-spacing: 1px;
        }

        .login-right-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          padding-top: 28px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .login-right-stat {
          display: flex;
          flex-direction: column;
        }

        .login-right-stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #48bb78;
        }

        .login-right-stat-label {
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
          .login-right {
            display: block;
          }
        }

        @media (max-width: 1024px) {
          .login-left {
            padding: 32px 24px;
          }

          .login-features {
            grid-template-columns: 1fr 1fr;
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

          .login-features {
            grid-template-columns: 1fr;
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

          .login-quote {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}