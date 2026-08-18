import { useState, useRef, useEffect } from 'react';
import { Search, Bell, BellRing, Moon, Sun, Menu, ChevronDown, LogOut, User as UserIcon, X, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Notification types
const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  DANGER: 'danger',
};

// Notification icons mapping
const NOTIFICATION_ICONS = {
  [NOTIFICATION_TYPES.INFO]: Info,
  [NOTIFICATION_TYPES.SUCCESS]: CheckCircle,
  [NOTIFICATION_TYPES.WARNING]: AlertTriangle,
  [NOTIFICATION_TYPES.DANGER]: AlertCircle,
};

export default function Topbar({ onMenuClick, title, subtitle, onSearch, notifications = [], onDismissNotification, onDismissAllNotifications }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [query, setQuery] = useState('');
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  // Close notification panel when clicking outside
  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // Auto-close notification panel after 8 seconds
  useEffect(() => {
    if (notifOpen) {
      const timer = setTimeout(() => {
        setNotifOpen(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [notifOpen]);

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

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const handleDismissNotification = (index) => {
    if (onDismissNotification) {
      onDismissNotification(index);
    }
  };

  const handleDismissAll = () => {
    if (onDismissAllNotifications) {
      onDismissAllNotifications();
    }
    setNotifOpen(false);
  };

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
        
        {/* Notification Bell */}
        <div className="notification-container" ref={notifRef}>
          <button 
            className={`icon-btn icon-btn--dot ${notifOpen ? 'icon-btn--active' : ''}`} 
            onClick={() => setNotifOpen(!notifOpen)}
            aria-label="Notifications"
          >
            {unreadCount > 0 ? (
              <>
                <BellRing size={18} />
                <span className="notif-dot">{unreadCount}</span>
              </>
            ) : (
              <Bell size={18} />
            )}
          </button>

          {/* Notification Panel */}
          {notifOpen && (
            <div className="notification-panel">
              <div className="notification-panel__header">
                <span className="notification-panel__title">Notifications</span>
                {notifications && notifications.length > 0 && (
                  <button 
                    className="notification-panel__dismiss-all"
                    onClick={handleDismissAll}
                  >
                    Dismiss all
                  </button>
                )}
              </div>

              <div className="notification-panel__list">
                {!notifications || notifications.length === 0 ? (
                  <div className="notification-empty">
                    <Bell size={24} />
                    <p>No notifications</p>
                    <span>All caught up!</span>
                  </div>
                ) : (
                  notifications.map((notification, index) => {
                    const Icon = NOTIFICATION_ICONS[notification.type] || Info;
                    return (
                      <div 
                        key={index} 
                        className={`notification-item notification-item--${notification.type} ${!notification.read ? 'notification-item--unread' : ''}`}
                        onClick={() => handleDismissNotification(index)}
                      >
                        <div className="notification-item__icon">
                          <Icon size={16} />
                        </div>
                        <div className="notification-item__content">
                          <span className="notification-item__message">{notification.message}</span>
                          <span className="notification-item__time">{notification.time || 'Just now'}</span>
                        </div>
                        {!notification.read && <div className="notification-item__dot" />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
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

      <style jsx>{`
        /* Topbar existing styles */
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          height: 64px;
          background: var(--color-bg-primary, white);
          border-bottom: 1px solid var(--color-border, #e2e8f0);
          gap: 16px;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .topbar__menu-btn {
          display: none;
          background: none;
          border: none;
          color: var(--color-text-secondary, #4a5568);
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
        }

        .topbar__menu-btn:hover {
          background: var(--color-bg-hover, #f7fafc);
        }

        .topbar__title-block {
          flex: 1;
          min-width: 0;
        }

        .topbar__title-block h1 {
          font-size: 18px;
          font-weight: 600;
          color: var(--color-text-primary, #1a202c);
          margin: 0;
          line-height: 1.2;
        }

        .topbar__title-block p {
          font-size: 13px;
          color: var(--color-text-secondary, #4a5568);
          margin: 0;
        }

        .topbar__search {
          flex: 1;
          max-width: 480px;
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--color-bg-secondary, #f7fafc);
          padding: 6px 14px;
          border-radius: 10px;
          border: 1px solid var(--color-border, #e2e8f0);
          transition: all 0.2s;
        }

        .topbar__search:focus-within {
          border-color: var(--color-primary, #4299e1);
          box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
          background: var(--color-bg-primary, white);
        }

        .topbar__search-icon {
          color: var(--color-text-faint, #a0aec0);
          flex-shrink: 0;
        }

        .topbar__search input {
          border: none;
          outline: none;
          flex: 1;
          font-size: 14px;
          color: var(--color-text-primary, #2d3748);
          background: transparent;
          padding: 6px 0;
        }

        .topbar__search input::placeholder {
          color: var(--color-text-faint, #a0aec0);
        }

        .topbar__actions {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }

        .icon-btn {
          width: 36px;
          height: 36px;
          border: none;
          background: transparent;
          color: var(--color-text-secondary, #4a5568);
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          position: relative;
        }

        .icon-btn:hover {
          background: var(--color-bg-hover, #f7fafc);
        }

        .icon-btn--active {
          background: var(--color-bg-hover, #f7fafc);
          color: var(--color-primary, #4299e1);
        }

        .icon-btn--dot {
          position: relative;
        }

        .notif-dot {
          position: absolute;
          top: 2px;
          right: 2px;
          background: #e53e3e;
          color: white;
          font-size: 10px;
          font-weight: 700;
          min-width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          border: 2px solid var(--color-bg-primary, white);
        }

        /* Notification Container */
        .notification-container {
          position: relative;
        }

        /* Notification Panel */
        .notification-panel {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          width: 380px;
          max-height: 460px;
          background: var(--color-bg-primary, white);
          border-radius: 12px;
          border: 1px solid var(--color-border, #e2e8f0);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          z-index: 1000;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .notification-panel__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid var(--color-border, #e2e8f0);
          background: var(--color-bg-secondary, #f7fafc);
          flex-shrink: 0;
        }

        .notification-panel__title {
          font-weight: 600;
          font-size: 14px;
          color: var(--color-text-primary, #1a202c);
        }

        .notification-panel__dismiss-all {
          background: none;
          border: none;
          font-size: 12px;
          color: var(--color-text-secondary, #4a5568);
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .notification-panel__dismiss-all:hover {
          background: var(--color-bg-hover, #f7fafc);
          color: var(--color-text-primary, #1a202c);
        }

        .notification-panel__list {
          overflow-y: auto;
          flex: 1;
        }

        .notification-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 20px;
          color: var(--color-text-secondary, #4a5568);
        }

        .notification-empty svg {
          color: var(--color-text-faint, #a0aec0);
          margin-bottom: 12px;
        }

        .notification-empty p {
          font-weight: 500;
          margin: 0;
          font-size: 14px;
        }

        .notification-empty span {
          font-size: 13px;
          color: var(--color-text-secondary, #4a5568);
        }

        .notification-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--color-border-light, #edf2f7);
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .notification-item:hover {
          background: var(--color-bg-hover, #f7fafc);
        }

        .notification-item--unread {
          background: var(--color-bg-subtle, #f0f7ff);
        }

        .notification-item--unread:hover {
          background: var(--color-bg-hover, #f7fafc);
        }

        .notification-item__icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .notification-item--info .notification-item__icon {
          background: #ebf8ff;
          color: #2b6cb0;
        }

        .notification-item--success .notification-item__icon {
          background: #f0fff4;
          color: #276749;
        }

        .notification-item--warning .notification-item__icon {
          background: #fffbeb;
          color: #975a16;
        }

        .notification-item--danger .notification-item__icon {
          background: #fff5f5;
          color: #9b2c2c;
        }

        .notification-item__content {
          flex: 1;
          min-width: 0;
        }

        .notification-item__message {
          display: block;
          font-size: 13px;
          color: var(--color-text-primary, #2d3748);
          line-height: 1.4;
          margin-bottom: 4px;
        }

        .notification-item__time {
          display: block;
          font-size: 11px;
          color: var(--color-text-secondary, #718096);
        }

        .notification-item__dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #4299e1;
          flex-shrink: 0;
          margin-top: 8px;
        }

        /* User Menu */
        .topbar__user {
          position: relative;
        }

        .topbar__user-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          padding: 4px 8px 4px 4px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--color-text-primary, #1a202c);
        }

        .topbar__user-btn:hover {
          background: var(--color-bg-hover, #f7fafc);
        }

        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--color-primary, #4299e1);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 13px;
          flex-shrink: 0;
        }

        .topbar__user-name {
          font-size: 13px;
          font-weight: 500;
        }

        .topbar__dropdown {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          min-width: 180px;
          background: var(--color-bg-primary, white);
          border-radius: 10px;
          border: 1px solid var(--color-border, #e2e8f0);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
          padding: 4px;
          z-index: 50;
        }

        .topbar__dropdown button {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          width: 100%;
          border: none;
          background: none;
          color: var(--color-text-primary, #2d3748);
          font-size: 13px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .topbar__dropdown button:hover {
          background: var(--color-bg-hover, #f7fafc);
        }

        .topbar__dropdown button svg {
          color: var(--color-text-secondary, #4a5568);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .topbar {
            padding: 0 16px;
          }

          .topbar__menu-btn {
            display: block;
          }

          .topbar__search {
            max-width: 100%;
          }

          .topbar__title-block h1 {
            font-size: 16px;
          }

          .topbar__user-name {
            display: none;
          }

          .notification-panel {
            width: 320px;
            right: -20px;
          }
        }

        @media (max-width: 480px) {
          .topbar {
            padding: 0 12px;
          }

          .topbar__search {
            padding: 4px 10px;
          }

          .topbar__search input {
            font-size: 13px;
          }

          .notification-panel {
            width: 290px;
            right: -40px;
            max-height: 400px;
          }

          .notification-item {
            padding: 10px 12px;
          }
        }
      `}</style>
    </header>
  );
}