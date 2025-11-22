
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppNotification, N8nInstance } from '../types';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isPanelOpen: boolean;
  n8nInstances: N8nInstance[];
  togglePanel: () => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  removeNotification: (id: string) => void;
  addN8nInstance: (name: string, url: string) => void;
  removeN8nInstance: (id: string) => void;
  toggleN8nInstance: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
  // Manage multiple n8n instances
  const [n8nInstances, setN8nInstances] = useState<N8nInstance[]>(() => {
    const saved = localStorage.getItem('autoflow_n8n_instances');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('autoflow_n8n_instances', JSON.stringify(n8nInstances));
  }, [n8nInstances]);

  const togglePanel = () => setIsPanelOpen(prev => !prev);

  const addNotification = async (data: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: AppNotification = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      read: false,
      ...data
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 100)); // Keep last 100

    // Trigger External Alerts for all active instances
    if (data.type === 'error' && n8nInstances.length > 0) {
      n8nInstances.filter(i => i.active).forEach(instance => {
        try {
          // Mocking the external call to n8n
          console.log(`[n8n Trigger: ${instance.name}] POST ${instance.url}`, {
            event: 'CRITICAL_ALERT',
            data: newNotification
          });
          
          // Uncomment to actually enable fetch:
          /*
          fetch(instance.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newNotification)
          }).catch(err => console.error(`Failed to send to ${instance.name}`, err));
          */
        } catch (err) {
          console.error(`Failed to trigger external alert for ${instance.name}`, err);
        }
      });
    }
  };

  const addN8nInstance = (name: string, url: string) => {
    const newInstance: N8nInstance = {
      id: crypto.randomUUID(),
      name,
      url,
      active: true,
      createdAt: new Date().toISOString()
    };
    setN8nInstances(prev => [...prev, newInstance]);
  };

  const removeN8nInstance = (id: string) => {
    setN8nInstances(prev => prev.filter(i => i.id !== id));
  };

  const toggleN8nInstance = (id: string) => {
    setN8nInstances(prev => prev.map(i => i.id === id ? { ...i, active: !i.active } : i));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      isPanelOpen,
      n8nInstances,
      togglePanel,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearAll,
      removeNotification,
      addN8nInstance,
      removeN8nInstance,
      toggleN8nInstance
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
