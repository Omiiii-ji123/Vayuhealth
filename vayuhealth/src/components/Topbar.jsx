import { useState, useRef, useEffect } from 'react';
import { Search, Bell, Moon, Sun, Menu, ChevronDown, LogOut, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Topbar({ onMenuClick, title, subtitle, onSearch }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    onSearch?.(query);
  };

  const initials = (user?.name || user?.email || 'U')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="topbar">
      <button className="topbar__menu-btn" onClick={onMenuClick} aria-label="Open menu">
        <Menu size={20} />
      </button>

      {title ? (
        <div className="topbar__title-block">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      ) : (
        <form className="topbar__search" onSubmit={submitSearch}>
          <Search size={16} className="topbar__search-icon" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search locations, diseases or health topics..."
          />
        </form>
      )}

      <div className="topbar__actions">
        <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <button className="icon-btn icon-btn--dot" aria-label="Notifications">
          <Bell size={18} />
          <span className="notif-dot">3</span>
        </button>
        <div className="topbar__user" ref={menuRef}>
          <button className="topbar__user-btn" onClick={() => setMenuOpen((o) => !o)}>
            <div className="avatar">{initials}</div>
            <span className="topbar__user-name">{user?.name || 'Account'}</span>
            <ChevronDown size={14} />
          </button>
          {menuOpen && (
            <div className="topbar__dropdown">
              <button onClick={() => { setMenuOpen(false); navigate('/profile'); }}>
                <UserIcon size={15} /> Profile
              </button>
              <button onClick={() => { setMenuOpen(false); logout(); navigate('/login'); }}>
                <LogOut size={15} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
