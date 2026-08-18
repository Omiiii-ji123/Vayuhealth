import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutGrid, Map, Sparkles, Stethoscope, User, Settings as SettingsIcon,
  LogOut, Wind, Activity,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/air-quality-map', label: 'Air Quality Map', icon: Map },
  { to: '/ai-assistant', label: 'AI Assistant', icon: Sparkles },
  { to: '/diseases', label: 'Diseases', icon: Stethoscope },
  { to: '/surveillance', label: 'Surveillance', icon: Activity },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

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
            <div className="sidebar__brand-name">VayuHealth</div>
            <div className="sidebar__brand-sub">Environmental Health</div>
          </div>
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onCloseMobile}
              className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
            >
              <Icon size={18} strokeWidth={2} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <button className="sidebar__link sidebar__logout" onClick={handleLogout}>
            <LogOut size={18} strokeWidth={2} />
            <span>Logout</span>
          </button>
          <div className="sidebar__status">
            <span className="status-dot" />
            System Status: Active
          </div>
        </div>
      </aside>
    </>
  );
}
