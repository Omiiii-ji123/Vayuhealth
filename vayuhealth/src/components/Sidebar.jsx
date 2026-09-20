import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutGrid, Map, Settings as SettingsIcon,
  LogOut, Wind, Activity, TrendingUp, ShieldAlert, Cpu,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const NAV_ITEMS = [
    { to: '/dashboard', key: 'nav.home', label: 'Home Page', icon: LayoutGrid, end: true },
    { to: '/admin-dashboard', key: 'nav.adminDashboard', label: 'Admin Command', icon: ShieldAlert },
    { to: '/delhi-forecast', key: 'nav.delhiForecast', label: '72H Coupled Forecast', icon: TrendingUp },
    { to: '/air-quality-map', key: 'nav.airQualityMap', label: 'Air Quality Map', icon: Map },
    { to: '/surveillance', key: 'nav.surveillance', label: 'Surveillance', icon: Activity },
    { to: '/station-diagnostics', key: 'nav.stationDiagnostics', label: 'Station Diagnostics', icon: Cpu },
    { to: '/settings', key: 'nav.settings', label: 'Settings', icon: SettingsIcon },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {mobileOpen && <div className="sidebar-scrim" onClick={onCloseMobile} />}
      <aside className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <div className="sidebar__brand-icon">
            <Wind size={20} strokeWidth={2.5} />
          </div>
          <div>
            <div className="sidebar__brand-name">VayuHealth CPCB</div>
            <div className="sidebar__brand-sub">Air Quality Regulatory Authority</div>
          </div>
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map(({ to, key, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onCloseMobile}
              className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
            >
              <Icon size={18} strokeWidth={2} />
              <span>{t(key, label)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <button className="sidebar__link sidebar__logout" onClick={handleLogout}>
            <LogOut size={18} strokeWidth={2} />
            <span>{t('nav.logout', 'Logout')}</span>
          </button>
          <div className="sidebar__status">
            <span className="status-dot" />
            {t('nav.systemActive', 'System Status: Active')}
          </div>
        </div>
      </aside>
    </>
  );
}
