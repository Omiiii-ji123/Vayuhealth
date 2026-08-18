import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wind, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', district: '', city: '', state: '' });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await register(form);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.message || 'Registration failed. Confirm the API is running on port 8081.');
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="sidebar__brand-icon">
            <Wind size={20} strokeWidth={2.5} />
          </div>
          <div>
            <div className="sidebar__brand-name">VayuHealth</div>
            <div className="sidebar__brand-sub">Environmental Health</div>
          </div>
        </div>

        <h2>Create your account</h2>
        <p className="auth-sub">Track air quality, get AI insights, and monitor disease risk in your area.</p>

        {success ? (
          <div className="auth-success">
            <CheckCircle2 size={20} />
            Account created. Redirecting to sign in...
          </div>
        ) : (
          <form onSubmit={submit} className="auth-form">
            <label>
              Full name
              <input required value={form.name} onChange={update('name')} placeholder="Alex Johnson" />
            </label>
            <label>
              Email
              <input type="email" required value={form.email} onChange={update('email')} placeholder="you@example.com" />
            </label>
            <label>
              Password
              <input type="password" required value={form.password} onChange={update('password')} placeholder="••••••••" />
            </label>
            <div className="auth-form__row">
              <label>
                City
                <input value={form.city} onChange={update('city')} placeholder="San Francisco" />
              </label>
              <label>
                State
                <input value={form.state} onChange={update('state')} placeholder="CA" />
              </label>
            </div>
            <label>
              District
              <input value={form.district} onChange={update('district')} placeholder="District name (for health surveillance data)" />
            </label>

            {error && <div className="auth-error">{error}</div>}

            <button className="btn btn--primary btn--block" type="submit" disabled={loading}>
              {loading ? <Loader2 size={16} className="spin" /> : 'Create account'}
            </button>
          </form>
        )}

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
