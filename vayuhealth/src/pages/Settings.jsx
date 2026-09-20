import { useState } from 'react';
import { Moon, Sun, Bell, Server, ShieldCheck, Globe } from 'lucide-react';
import Layout from '../components/Layout';
import { Card } from '../components/Common';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
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
  const { language, setLanguage, t, languagesList } = useLanguage();
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
    <Layout title={t('nav.settings', 'Settings')} subtitle="Appearance, language, notifications, and connection details.">
      {/* Language Section */}
      <Card className="section-card">
        <div className="card-head">
          <h3 className="section-title"><Globe size={16} /> Language / भाषा</h3>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-row__label">App Language</div>
            <div className="settings-row__desc">Choose your preferred Indian language for UI, precautions, and video narration.</div>
          </div>
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            className="settings-select"
          >
            {languagesList.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.nativeName} ({lang.name})
              </option>
            ))}
          </select>
        </div>
      </Card>

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

      <style jsx>{`
        .settings-select {
          padding: 8px 14px;
          border-radius: 8px;
          border: 1px solid var(--color-border, #e2e8f0);
          background: var(--color-bg-secondary, #f7fafc);
          color: var(--color-text-primary, #1a202c);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          outline: none;
        }
        .settings-select:focus {
          border-color: var(--color-primary, #4299e1);
        }
      `}</style>
    </Layout>
  );
}
