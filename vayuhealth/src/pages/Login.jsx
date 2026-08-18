import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Wind, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);

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

        <h2>Welcome back</h2>
        <p className="auth-sub">Sign in to view your daily environmental health overview.</p>

        <form onSubmit={submit} className="auth-form">
          <label>
            Email
            <input type="email" required value={form.email} onChange={update('email')} placeholder="you@example.com" />
          </label>
          <label>
            Password
            <input type="password" required value={form.password} onChange={update('password')} placeholder="••••••••" />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button className="btn btn--primary btn--block" type="submit" disabled={loading}>
            {loading ? <Loader2 size={16} className="spin" /> : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer">
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
