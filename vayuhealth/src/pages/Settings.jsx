import { useState } from 'react';
import { Moon, Sun, Bell, Server, ShieldCheck } from 'lucide-react';
import Layout from '../components/Layout';
import { Card } from '../components/Common';
import { useTheme } from '../context/ThemeContext';
import { API_BASE_URL } from '../api/client';

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      className={`toggle ${checked ? 'toggle--on' : ''}`}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
    >
      <span className="toggle__thumb" />
    </button>
  );
}

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const [prefs, setPrefs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('vayu_prefs')) || { alerts: true, weeklyDigest: true, aiInsights: true };
    } catch {
      return { alerts: true, weeklyDigest: true, aiInsights: true };
    }
  });

  const setPref = (key, val) => {
    setPrefs((p) => {
      const next = { ...p, [key]: val };
      localStorage.setItem('vayu_prefs', JSON.stringify(next));
      return next;
    });
  };

  return (
    <Layout title="Settings" subtitle="Appearance, notifications, and connection details.">
      <Card className="section-card">
        <div className="card-head">
          <h3 className="section-title">{theme === 'light' ? <Sun size={16} /> : <Moon size={16} />} Appearance</h3>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-row__label">Dark mode</div>
            <div className="settings-row__desc">Switch between light and dark interface themes.</div>
          </div>
          <Toggle checked={theme === 'dark'} onChange={toggleTheme} />
        </div>
      </Card>

      <Card className="section-card">
        <div className="card-head">
          <h3 className="section-title"><Bell size={16} /> Notifications</h3>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-row__label">Air quality alerts</div>
            <div className="settings-row__desc">Get notified when AQI crosses into unhealthy ranges.</div>
          </div>
          <Toggle checked={prefs.alerts} onChange={(v) => setPref('alerts', v)} />
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-row__label">Weekly digest</div>
            <div className="settings-row__desc">A weekly summary of your exposure and impact.</div>
          </div>
          <Toggle checked={prefs.weeklyDigest} onChange={(v) => setPref('weeklyDigest', v)} />
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-row__label">AI health insights</div>
            <div className="settings-row__desc">Show AI-generated insights on your dashboard.</div>
          </div>
          <Toggle checked={prefs.aiInsights} onChange={(v) => setPref('aiInsights', v)} />
        </div>
      </Card>

      <Card className="section-card">
        <div className="card-head">
          <h3 className="section-title"><Server size={16} /> API Connection</h3>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-row__label">Backend base URL</div>
            <div className="settings-row__desc">All 21 endpoints across 6 controllers are read from this host.</div>
          </div>
          <code className="code-pill">{API_BASE_URL}</code>
        </div>
      </Card>

      <Card className="section-card notice-card">
        <ShieldCheck size={16} />
        <p>Your session token is stored locally in this browser and sent with every request to the API.</p>
      </Card>
    </Layout>
  );
}
