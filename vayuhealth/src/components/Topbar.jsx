import { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  BellRing, 
  Moon, 
  Sun, 
  Menu, 
  ChevronDown, 
  LogOut, 
  User as UserIcon, 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle,
  Globe,
  X,
  Sparkles,
  Flame,
  ShieldAlert,
  Leaf,
  Radio,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CityAutocomplete from './CityAutocomplete';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { useDemoScenario } from '../context/DemoScenarioContext';

export default function Topbar({ onMenuClick, title, subtitle, onSearch }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    dismissAll,
    markAllAsRead 
  } = useNotifications();
  const { language, setLanguage, t, languagesList, currentLanguageMeta } = useLanguage();
  const { 
    currentScenario, 
    scenarioMeta, 
    selectScenario, 
    isScenarioActive, 
    allScenarios 
  } = useDemoScenario();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [query, setQuery] = useState('');
  const menuRef = useRef(null);
  const notifRef = useRef(null);
  const langRef = useRef(null);
  const scenarioRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false);
      }
      if (scenarioRef.current && !scenarioRef.current.contains(e.target)) {
        setScenarioOpen(false);
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

  const handleDismissNotification = (index) => {
    markAsRead(index);
  };

  const handleDismissAll = () => {
    dismissAll();
    setNotifOpen(false);
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  // Get notification icon based on category
  const getNotificationIcon = (category) => {
    switch(category) {
      case 'danger': return AlertCircle;
      case 'warning': return AlertTriangle;
      case 'success': return CheckCircle;
      default: return Info;
    }
  };

  // Get category label
  const getCategoryLabel = (category) => {
    switch(category) {
      case 'danger': return 'Critical';
      case 'warning': return 'Warning';
      case 'success': return 'Success';
      default: return 'Info';
    }
  };

  // Format time
  const formatNotificationTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get notification type emoji
  const getNotificationEmoji = (type) => {
    switch(type) {
      case 'aqi_alert': return '🌍';
      case 'weekly_digest': return '📊';
      case 'ai_insight': return '🧠';
      default: return '📢';
    }
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
          <CityAutocomplete
            value={query}
            onChange={(val) => setQuery(val)}
            onSelect={(item) => {
              setQuery(item.name);
              onSearch?.(item.name);
            }}
            onSubmit={submitSearch}
            placeholder={t('topbar.searchPlaceholder', 'Search locations, cities or health topics...')}
          />
        </form>
      )}

      <div className="topbar__actions">
        {/* SIH PS 82 Delhi 72H Quick Nav Badge */}
        <button
          type="button"
          className="sih-ps82-badge-btn"
          onClick={() => navigate('/delhi-forecast')}
          title="Switch to Delhi NCR 72H Coupled Forecast"
        >
          <span className="sih-live-pulse" />
          <span>Delhi 72H Forecast</span>
        </button>

        {/* Demo Scenario Selector */}
        <div className="topbar__scenario" ref={scenarioRef}>
          <button
            type="button"
            className={`topbar__scenario-btn ${isScenarioActive ? 'topbar__scenario-btn--custom' : ''} ${scenarioOpen ? 'topbar__scenario-btn--active' : ''}`}
            onClick={() => setScenarioOpen(!scenarioOpen)}
            title="Demo Scenario Switcher: Force-load High Smog Inversion, Stubble Surge, Clean Baseline, or Live Telemetry"
          >
            <span 
              className="scenario-live-pulse" 
              style={{ 
                backgroundColor: scenarioMeta.badgeColor,
                boxShadow: `0 0 8px ${scenarioMeta.badgeColor}`
              }} 
            />
            <span className="topbar__scenario-label">
              <span className="scenario-label-prefix">Preset:</span>
              <span className="scenario-label-name">{scenarioMeta.shortLabel}</span>
            </span>
            <ChevronDown size={12} className={scenarioOpen ? 'rotate-180' : ''} />
          </button>

          {scenarioOpen && (
            <div className="topbar__dropdown topbar__dropdown--scenario">
              <div className="topbar__scenario-dropdown-header">
                <div className="scenario-header-top">
                  <Sparkles size={13} color="#f59e0b" />
                  <span>SIMULATION PRESET SWITCHER</span>
                </div>
                <div className="scenario-header-sub">
                  Force-loads atmospheric physics, satellite anomalies & GRAP state
                </div>
              </div>

              <div className="topbar__scenario-list">
                {allScenarios.map((sc) => {
                  const isSelected = currentScenario === sc.id;
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      className={`topbar__scenario-option ${isSelected ? 'topbar__scenario-option--selected' : ''}`}
                      onClick={() => {
                        selectScenario(sc.id);
                        setScenarioOpen(false);
                      }}
                    >
                      <div className="scenario-option__left-bar" style={{ backgroundColor: sc.badgeColor }} />
                      <div className="scenario-option__content">
                        <div className="scenario-option__head">
                          <span className="scenario-option__name">{sc.title}</span>
                          <span 
                            className="scenario-option__tag"
                            style={{ 
                              borderColor: `${sc.badgeColor}40`, 
                              color: sc.badgeColor,
                              backgroundColor: `${sc.badgeColor}15`
                            }}
                          >
                            {sc.tag}
                          </span>
                        </div>
                        <p className="scenario-option__desc">{sc.description}</p>
                        <div className="scenario-option__metrics">
                          <span className="metric-pill">AQI: <strong>{sc.aqi}</strong></span>
                          <span className="metric-pill">PBL: <strong>{sc.pbl}m</strong></span>
                          <span className="metric-pill">{sc.grapStage}</span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="scenario-option__selected-icon">
                          <CheckCircle size={15} color={sc.badgeColor} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Language Selector */}
        <div className="topbar__lang" ref={langRef}>
          <button 
            className={`topbar__lang-btn ${langOpen ? 'topbar__lang-btn--active' : ''}`}
            onClick={() => setLangOpen(!langOpen)}
            title={t('topbar.selectLanguage', 'Select Language')}
          >
            <Globe size={16} />
            <span className="topbar__lang-code">{currentLanguageMeta.flag} {currentLanguageMeta.nativeName}</span>
            <ChevronDown size={12} className={langOpen ? 'rotate-180' : ''} />
          </button>
          {langOpen && (
            <div className="topbar__dropdown topbar__dropdown--lang">
              <div className="topbar__dropdown-title">
                <Globe size={13} /> {t('topbar.selectLanguage', 'Select Language')}
              </div>
              {languagesList.map((lang) => (
                <button
                  key={lang.code}
                  className={`topbar__lang-option ${language === lang.code ? 'topbar__lang-option--active' : ''}`}
                  onClick={() => {
                    setLanguage(lang.code);
                    setLangOpen(false);
                  }}
                >
                  <span className="topbar__lang-flag">{lang.flag}</span>
                  <span className="topbar__lang-names">
                    <strong>{lang.nativeName}</strong>
                    <small>({lang.name})</small>
                  </span>
                  {language === lang.code && <CheckCircle size={14} className="topbar__lang-check" />}
                </button>
              ))}
            </div>
          )}
        </div>

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
                <span className="notif-dot">{unreadCount > 99 ? '99+' : unreadCount}</span>
              </>
            ) : (
              <Bell size={18} />
            )}
          </button>

          {/* Notification Panel */}
          {notifOpen && (
            <div className="notification-panel">
              <div className="notification-panel__header">
                <div className="notification-panel__header-left">
                  <span className="notification-panel__title">{t('topbar.notifications', 'Notifications')}</span>
                  {unreadCount > 0 && (
                    <span className="notification-panel__badge">{unreadCount} unread</span>
                  )}
                </div>
                <div className="notification-panel__header-actions">
                  {notifications && notifications.length > 0 && unreadCount > 0 && (
                    <button 
                      className="notification-panel__mark-read"
                      onClick={handleMarkAllRead}
                    >
                      {t('topbar.markAllRead', 'Mark all read')}
                    </button>
                  )}
                  {notifications && notifications.length > 0 && (
                    <button 
                      className="notification-panel__dismiss-all"
                      onClick={handleDismissAll}
                    >
                      {t('topbar.dismissAll', 'Dismiss all')}
                    </button>
                  )}
                </div>
              </div>

              <div className="notification-panel__list">
                {!notifications || notifications.length === 0 ? (
                  <div className="notification-empty">
                    <Bell size={24} />
                    <p>{t('topbar.noNotifications', 'No notifications')}</p>
                    <span>{t('topbar.allCaughtUp', 'All caught up!')}</span>
                  </div>
                ) : (
                  notifications.slice(0, 20).map((notification, index) => {
                    const Icon = getNotificationIcon(notification.category);
                    const categoryLabel = getCategoryLabel(notification.category);
                    const emoji = getNotificationEmoji(notification.type);
                    
                    return (
                      <div 
                        key={notification.id || index} 
                        className={`notification-item notification-item--${notification.category} ${!notification.read ? 'notification-item--unread' : ''}`}
                        onClick={() => handleDismissNotification(index)}
                      >
                        <div className="notification-item__icon">
                          <span className="notification-item__emoji">{emoji}</span>
                        </div>
                        <div className="notification-item__content">
                          <div className="notification-item__header">
                            <span className="notification-item__title">{notification.title}</span>
                            <span className={`notification-item__category notification-item__category--${notification.category}`}>
                              {categoryLabel}
                            </span>
                          </div>
                          <span className="notification-item__message">{notification.message}</span>
                          <span className="notification-item__time">
                            {formatNotificationTime(notification.timestamp)}
                          </span>
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
                <UserIcon size={15} /> {t('nav.profile', 'Profile')}
              </button>
              <button onClick={() => { setMenuOpen(false); logout(); navigate('/login'); }}>
                <LogOut size={15} /> {t('nav.logout', 'Logout')}
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        /* Topbar styles */
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
          width: 420px;
          max-height: 500px;
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
          flex-wrap: wrap;
          gap: 8px;
        }

        .notification-panel__header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .notification-panel__header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .notification-panel__title {
          font-weight: 600;
          font-size: 14px;
          color: var(--color-text-primary, #1a202c);
        }

        .notification-panel__badge {
          font-size: 11px;
          background: #e53e3e;
          color: white;
          padding: 1px 8px;
          border-radius: 12px;
          font-weight: 600;
        }

        .notification-panel__dismiss-all,
        .notification-panel__mark-read {
          background: none;
          border: none;
          font-size: 12px;
          color: var(--color-text-secondary, #4a5568);
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .notification-panel__dismiss-all:hover,
        .notification-panel__mark-read:hover {
          background: var(--color-bg-hover, #f7fafc);
          color: var(--color-text-primary, #1a202c);
        }

        .notification-panel__list {
          overflow-y: auto;
          flex: 1;
        }

        .notification-panel__list::-webkit-scrollbar {
          width: 4px;
        }

        .notification-panel__list::-webkit-scrollbar-track {
          background: var(--color-bg-secondary);
        }

        .notification-panel__list::-webkit-scrollbar-thumb {
          background: var(--color-border);
          border-radius: 2px;
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
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .notification-item__emoji {
          font-size: 18px;
        }

        .notification-item--danger .notification-item__icon {
          background: #fff5f5;
        }

        .notification-item--warning .notification-item__icon {
          background: #fffbeb;
        }

        .notification-item--success .notification-item__icon {
          background: #f0fff4;
        }

        .notification-item--info .notification-item__icon {
          background: #ebf8ff;
        }

        .notification-item__content {
          flex: 1;
          min-width: 0;
        }

        .notification-item__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-bottom: 2px;
        }

        .notification-item__title {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-primary, #2d3748);
        }

        .notification-item__category {
          font-size: 10px;
          font-weight: 600;
          padding: 1px 8px;
          border-radius: 10px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          flex-shrink: 0;
        }

        .notification-item__category--danger {
          background: #fff5f5;
          color: #9b2c2c;
        }

        .notification-item__category--warning {
          background: #fffbeb;
          color: #975a16;
        }

        .notification-item__category--success {
          background: #f0fff4;
          color: #276749;
        }

        .notification-item__category--info {
          background: #ebf8ff;
          color: #2b6cb0;
        }

        .notification-item__message {
          display: block;
          font-size: 13px;
          color: var(--color-text-secondary, #4a5568);
          line-height: 1.4;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .notification-item__time {
          display: block;
          font-size: 11px;
          color: var(--color-text-secondary, #718096);
          margin-top: 4px;
        }

        .notification-item__dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #4299e1;
          flex-shrink: 0;
          margin-top: 12px;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
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
            width: 340px;
            right: -20px;
            max-height: 420px;
          }

          .scenario-label-prefix {
            display: none;
          }

          .topbar__scenario-btn {
            padding: 5px 8px;
            font-size: 11.5px;
          }

          .topbar__dropdown--scenario {
            width: 320px;
            right: -50px;
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
            width: 300px;
            right: -40px;
            max-height: 380px;
          }

          .topbar__scenario-btn {
            padding: 4px 6px;
          }

          .topbar__dropdown--scenario {
            width: 285px;
            right: -75px;
          }

          .notification-item {
            padding: 10px 12px;
          }

          .notification-item__header {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }

          .notification-panel__header {
            flex-direction: column;
            align-items: flex-start;
          }

          .notification-panel__header-actions {
            width: 100%;
            justify-content: flex-start;
          }
        }

        /* Language Selector Styles */
        .topbar__lang {
          position: relative;
        }

        .topbar__lang-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 8px;
          border: 1px solid var(--color-border, #e2e8f0);
          background: var(--color-bg-secondary, #f7fafc);
          color: var(--color-text-primary, #1a202c);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .topbar__lang-btn:hover,
        .topbar__lang-btn--active {
          background: var(--color-bg-hover, #edf2f7);
          border-color: var(--color-primary, #4299e1);
        }

        .topbar__lang-code {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .rotate-180 {
          transform: rotate(180deg);
        }

        .topbar__dropdown--lang {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          width: 220px;
          background: var(--color-bg-primary, white);
          border-radius: 12px;
          border: 1px solid var(--color-border, #e2e8f0);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          padding: 6px;
          z-index: 100;
        }

        .topbar__dropdown-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--color-text-secondary, #718096);
          padding: 6px 10px;
          display: flex;
          align-items: center;
          gap: 6px;
          border-bottom: 1px solid var(--color-border, #e2e8f0);
          margin-bottom: 4px;
        }

        .topbar__lang-option {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border: none;
          background: transparent;
          border-radius: 6px;
          font-size: 13px;
          color: var(--color-text-primary, #2d3748);
          cursor: pointer;
          text-align: left;
          transition: background 0.15s;
        }

        .topbar__lang-option:hover {
          background: var(--color-bg-hover, #f7fafc);
        }

        .topbar__lang-option--active {
          background: rgba(66, 153, 225, 0.1);
          color: var(--color-primary, #3182ce);
          font-weight: 600;
        }

        .topbar__lang-flag {
          font-size: 16px;
          line-height: 1;
        }

        .topbar__lang-names {
          display: flex;
          flex-direction: column;
          flex: 1;
          line-height: 1.2;
        }

        .topbar__lang-names small {
          font-size: 11px;
          color: var(--color-text-secondary, #718096);
          font-weight: normal;
        }

        .topbar__lang-check {
          color: var(--color-primary, #3182ce);
        }

        /* Demo Scenario Switcher Styles */
        .topbar__scenario {
          position: relative;
        }

        .topbar__scenario-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid var(--color-border, #e2e8f0);
          background: var(--color-bg-secondary, #f8fafc);
          color: var(--color-text-primary, #1e293b);
          font-size: 12.5px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
        }

        .topbar__scenario-btn:hover,
        .topbar__scenario-btn--active {
          background: var(--color-bg-hover, #f1f5f9);
          border-color: #38bdf8;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .topbar__scenario-btn--custom {
          border-color: rgba(249, 115, 22, 0.5);
          background: rgba(249, 115, 22, 0.06);
        }

        .scenario-live-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
          animation: scenario-pulse 2s infinite ease-in-out;
          flex-shrink: 0;
        }

        @keyframes scenario-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }

        .topbar__scenario-label {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .scenario-label-prefix {
          font-size: 11px;
          color: var(--color-text-secondary, #64748b);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .scenario-label-name {
          font-weight: 700;
          font-size: 12.5px;
          color: var(--color-text-primary, #0f172a);
        }

        .topbar__dropdown--scenario {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          width: 370px;
          max-width: 90vw;
          background: var(--color-bg-primary, #ffffff);
          border-radius: 14px;
          border: 1px solid var(--color-border, #e2e8f0);
          box-shadow: 0 14px 40px rgba(0, 0, 0, 0.18);
          padding: 8px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .topbar__scenario-dropdown-header {
          padding: 8px 10px 10px;
          border-bottom: 1px solid var(--color-border, #f1f5f9);
        }

        .scenario-header-top {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: var(--color-text-primary, #1e293b);
        }

        .scenario-header-sub {
          font-size: 11px;
          color: var(--color-text-secondary, #64748b);
          margin-top: 2px;
        }

        .topbar__scenario-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 420px;
          overflow-y: auto;
        }

        .topbar__scenario-option {
          display: flex;
          align-items: stretch;
          border: 1px solid var(--color-border, #e2e8f0);
          background: var(--color-bg-secondary, #f8fafc);
          border-radius: 10px;
          padding: 10px 12px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          gap: 10px;
        }

        .topbar__scenario-option:hover {
          background: var(--color-bg-hover, #f1f5f9);
          border-color: #38bdf8;
          transform: translateY(-1px);
        }

        .topbar__scenario-option--selected {
          border-color: #38bdf8;
          background: rgba(56, 189, 248, 0.08);
        }

        .scenario-option__left-bar {
          width: 4px;
          border-radius: 4px;
          flex-shrink: 0;
        }

        .scenario-option__content {
          flex: 1;
          min-width: 0;
        }

        .scenario-option__head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 4px;
        }

        .scenario-option__name {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text-primary, #0f172a);
          line-height: 1.2;
        }

        .scenario-option__tag {
          font-size: 9.5px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 6px;
          border-width: 1px;
          border-style: solid;
          letter-spacing: 0.4px;
          white-space: nowrap;
        }

        .scenario-option__desc {
          font-size: 11.5px;
          color: var(--color-text-secondary, #64748b);
          line-height: 1.35;
          margin: 0 0 6px;
        }

        .scenario-option__metrics {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .metric-pill {
          font-size: 10px;
          background: rgba(0, 0, 0, 0.05);
          padding: 2px 6px;
          border-radius: 4px;
          color: var(--color-text-secondary, #475569);
        }

        .scenario-option__selected-icon {
          display: flex;
          align-items: center;
          padding-left: 4px;
        }
      `}</style>
    </header>
  );
}