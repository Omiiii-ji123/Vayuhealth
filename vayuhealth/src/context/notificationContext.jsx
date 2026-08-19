import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { generateAllNotifications, NOTIFICATION_TYPES } from '../services/notificationService';
import { getAqiByCity } from '../api/aqi';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

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

  // Generate notifications for user's city
  const generateNotificationsForCity = useCallback(async (city) => {
    if (!city) return;

    try {
      const aqiData = await getAqiByCity(city);
      const newNotifications = await generateAllNotifications(city, aqiData);
      
      if (newNotifications.length > 0) {
        setNotifications(prev => {
          // Avoid duplicates by checking message
          const existingMessages = new Set(prev.map(n => n.message));
          const uniqueNew = newNotifications.filter(n => !existingMessages.has(n.message));
          return [...uniqueNew, ...prev].slice(0, 50); // Keep last 50
        });
        
        // Update unread count
        setUnreadCount(prev => prev + newNotifications.filter(n => !n.read).length);
        
        // Play notification sound for important alerts
        const hasImportant = newNotifications.some(n => 
          n.category === 'danger' || n.category === 'warning'
        );
        if (hasImportant) {
          playNotificationSound();
        }
      }
    } catch (error) {
      console.error('Error generating notifications:', error);
    }
  }, []);

  // Initial notification generation
  useEffect(() => {
    if (user?.city || user?.district) {
      const city = user.city || user.district || 'Mumbai';
      generateNotificationsForCity(city);
      
      // Set up periodic refresh (every 30 minutes)
      const interval = setInterval(() => {
        generateNotificationsForCity(city);
      }, 30 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [user, generateNotificationsForCity]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => {
        // Fallback: use Web Audio API for beep
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
      });
    } catch (e) {
      console.log('Notification sound not available');
    }
  };

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

  const value = {
    notifications,
    unreadCount,
    isConnected,
    generateNotificationsForCity,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    dismissAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
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