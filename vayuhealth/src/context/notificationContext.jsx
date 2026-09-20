import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { generateAllNotifications, NOTIFICATION_TYPES } from '../services/notificationService';
import { getAqiByCity, getAqiByCoords } from '../api/aqi';
import { getAqiBand } from '../utils/aqi';
import { X, Bell, Shield, Wind, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [toasts, setToasts] = useState([]);
  const startupHandledRef = useRef(false);

  // Show a floating toast alert
  const showToast = useCallback((notification, durationMs = 6000) => {
    const toastId = `toast_${Date.now()}_${Math.random()}`;
    const newToast = { ...notification, toastId };
    setToasts(prev => [newToast, ...prev.slice(0, 2)]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.toastId !== toastId));
    }, durationMs);
  }, []);

  const dismissToast = (toastId) => {
    setToasts(prev => prev.filter(t => t.toastId !== toastId));
  };

  // Add notification to state and local storage
  const pushNotification = useCallback((notif, triggerToast = true) => {
    const notificationItem = {
      id: notif.id || `notif_${Date.now()}_${Math.random()}`,
      title: notif.title || 'Notification',
      message: notif.message || '',
      category: notif.category || 'info',
      type: notif.type || NOTIFICATION_TYPES.AQI_ALERT,
      timestamp: notif.timestamp || new Date().toISOString(),
      read: false,
      ...notif
    };

    setNotifications(prev => [notificationItem, ...prev.slice(0, 49)]);
    setUnreadCount(prev => prev + 1);

    if (triggerToast) {
      showToast(notificationItem);
    }
  }, [showToast]);

  // Load saved notifications from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotifications(parsed);
        setUnreadCount(parsed.filter(n => !n.read).length);
      } catch (e) {
        console.error('Error loading saved notifications:', e);
      }
    }
  }, []);

  // Save notifications to localStorage
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  // Startup: Fetch AQI for current location/city, trigger Welcome notification & Precautions notification
  useEffect(() => {
    if (startupHandledRef.current) return;
    startupHandledRef.current = true;

    const initializeStartupNotifications = async () => {
      const city = user?.city || user?.district || 'Anand Vihar, Delhi';
      let liveAqiRecord = null;
      let locationName = city;

      // Try browser geolocation first
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 4000,
              maximumAge: 300000,
              enableHighAccuracy: true
            });
          });
          const { latitude, longitude } = position.coords;
          liveAqiRecord = await getAqiByCoords(latitude, longitude);
          if (liveAqiRecord) {
            locationName = liveAqiRecord.locationName || liveAqiRecord.city || locationName;
          }
        } catch (geoErr) {
          console.log('Using default/user city for startup notifications:', city);
        }
      }

      if (!liveAqiRecord) {
        try {
          liveAqiRecord = await getAqiByCity(city);
          if (liveAqiRecord) {
            locationName = liveAqiRecord.locationName || liveAqiRecord.city || city;
          }
        } catch (e) {
          console.warn('Failed to fetch initial AQI for notifications:', e);
        }
      }

      const aqi = liveAqiRecord?.aqi || 65;
      const band = getAqiBand(aqi);
      const userName = user?.name ? user.name.split(' ')[0] : 'there';

      // 1. Welcome Notification (Immediate)
      setTimeout(() => {
        pushNotification({
          id: `welcome_${Date.now()}`,
          title: `👋 Welcome to VayuHealth, ${userName}!`,
          message: `Live air quality in ${locationName} is AQI ${aqi} (${band.label}). Your daily environmental monitor is active.`,
          category: band.category === 'good' ? 'success' : band.category === 'moderate' ? 'info' : 'warning',
          type: NOTIFICATION_TYPES.AQI_ALERT,
          location: locationName,
          aqi: aqi
        }, true);
      }, 1000);

      // 2. Precautions Notification (After 4.5 seconds)
      setTimeout(() => {
        let precautionText = '';
        let precautionCat = 'info';

        if (aqi <= 50) {
          precautionText = `Air quality is Good. Ideal conditions for outdoor walks and exercises. No special precautions needed.`;
          precautionCat = 'success';
        } else if (aqi <= 100) {
          precautionText = `Air quality is Moderate today. Sensitive individuals should avoid heavy outdoor exertion. Keep well-hydrated.`;
          precautionCat = 'info';
        } else if (aqi <= 150) {
          precautionText = `Air quality is Unhealthy for Sensitive Groups. Wear an N95 mask outdoors, keep windows closed, and drink warm Tulsi tea.`;
          precautionCat = 'warning';
        } else {
          precautionText = `High pollution detected! Wear an N95 mask, minimize outdoor exposure, use indoor air purifiers, and practice steam inhalation.`;
          precautionCat = 'danger';
        }

        pushNotification({
          id: `precautions_${Date.now()}`,
          title: `🛡️ Daily Health Advisory (${band.label})`,
          message: precautionText,
          category: precautionCat,
          type: NOTIFICATION_TYPES.AQI_ALERT,
          location: locationName,
          aqi: aqi
        }, true);
      }, 4500);
    };

    initializeStartupNotifications();
  }, [user, pushNotification]);

  // Generate notifications for user's city periodically
  const generateNotificationsForCity = useCallback(async (city) => {
    if (!city) return;

    try {
      const aqiData = await getAqiByCity(city);
      const newNotifications = await generateAllNotifications(city, aqiData);
      
      if (newNotifications.length > 0) {
        setNotifications(prev => {
          const existingMessages = new Set(prev.map(n => n.message));
          const uniqueNew = newNotifications.filter(n => !existingMessages.has(n.message));
          return [...uniqueNew, ...prev].slice(0, 50);
        });
        
        setUnreadCount(prev => prev + newNotifications.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error('Error generating notifications:', error);
    }
  }, []);

  const markAsRead = (index) => {
    setNotifications(prev => {
      const updated = prev.map((n, i) => 
        i === index ? { ...n, read: true } : n
      );
      setUnreadCount(updated.filter(n => !n.read).length);
      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      setUnreadCount(0);
      return updated;
    });
  };

  const dismissNotification = (index) => {
    setNotifications(prev => {
      const updated = prev.filter((_, i) => i !== index);
      setUnreadCount(updated.filter(n => !n.read).length);
      return updated;
    });
  };

  const dismissAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('notifications');
  };

  // Helper to trigger instant location & AQI update notification
  const notifyLocationAqiChange = useCallback((locationName, aqi) => {
    if (!locationName || !aqi) return;
    const band = getAqiBand(aqi);

    let advice = '';
    let category = 'info';
    if (aqi <= 50) {
      advice = 'Air quality is Good. Ideal conditions for outdoor walks and workouts.';
      category = 'success';
    } else if (aqi <= 100) {
      advice = 'Air quality is Moderate. Sensitive individuals should monitor outdoor exertion.';
      category = 'info';
    } else if (aqi <= 150) {
      advice = 'Unhealthy for sensitive groups. Wear an N95 mask outdoors and stay hydrated.';
      category = 'warning';
    } else if (aqi <= 200) {
      advice = 'Unhealthy pollution detected! Limit prolonged outdoor exposure.';
      category = 'warning';
    } else {
      advice = 'Hazardous air quality alert! Stay indoors and use air purification.';
      category = 'danger';
    }

    pushNotification({
      id: `loc_change_${locationName}_${Date.now()}`,
      title: `📍 Location Updated: ${locationName}`,
      message: `Current live AQI is ${aqi} (${band.label}). ${advice}`,
      category: category,
      type: NOTIFICATION_TYPES.AQI_ALERT,
      location: locationName,
      aqi: aqi,
      timestamp: new Date().toISOString()
    }, true);
  }, [pushNotification]);

  const value = {
    notifications,
    unreadCount,
    isConnected,
    generateNotificationsForCity,
    pushNotification,
    notifyLocationAqiChange,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    dismissAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}

      {/* Floating Toast Notification Container */}
      {toasts.length > 0 && (
        <div className="vayu-toast-container">
          {toasts.map(toast => (
            <div key={toast.toastId} className={`vayu-toast vayu-toast--${toast.category || 'info'}`}>
              <div className="vayu-toast__icon">
                {toast.category === 'success' ? (
                  <CheckCircle2 size={20} color="#10b981" />
                ) : toast.category === 'warning' || toast.category === 'danger' ? (
                  <AlertTriangle size={20} color="#f59e0b" />
                ) : (
                  <Wind size={20} color="#3b82f6" />
                )}
              </div>
              <div className="vayu-toast__content">
                <h4 className="vayu-toast__title">{toast.title}</h4>
                <p className="vayu-toast__message">{toast.message}</p>
              </div>
              <button 
                className="vayu-toast__close" 
                onClick={() => dismissToast(toast.toastId)}
                aria-label="Close notification"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .vayu-toast-container {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 999999;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 380px;
          width: calc(100vw - 48px);
          pointer-events: none;
        }

        .vayu-toast {
          pointer-events: auto;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          background: var(--color-bg-primary, #ffffff);
          border: 1px solid var(--color-border, #e2e8f0);
          border-left: 4px solid #3b82f6;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          animation: slideInToast 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          transition: all 0.2s ease;
        }

        .vayu-toast--success {
          border-left-color: #10b981;
        }

        .vayu-toast--warning {
          border-left-color: #f59e0b;
        }

        .vayu-toast--danger {
          border-left-color: #ef4444;
        }

        .vayu-toast__icon {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .vayu-toast__content {
          flex: 1;
          min-width: 0;
        }

        .vayu-toast__title {
          font-size: 14px;
          font-weight: 700;
          color: var(--color-text-primary, #1e293b);
          margin: 0 0 4px 0;
        }

        .vayu-toast__message {
          font-size: 12.5px;
          line-height: 1.5;
          color: var(--color-text-secondary, #475569);
          margin: 0;
        }

        .vayu-toast__close {
          background: none;
          border: none;
          color: var(--color-text-secondary, #94a3b8);
          cursor: pointer;
          padding: 2px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s;
        }

        .vayu-toast__close:hover {
          color: var(--color-text-primary, #1e293b);
        }

        @keyframes slideInToast {
          from {
            opacity: 0;
            transform: translateX(100%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export const useNotification = useNotifications;