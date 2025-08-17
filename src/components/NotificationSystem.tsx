import React, { useState, useEffect, createContext, useContext } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
}

interface NotificationContextType {
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationSystem: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      id,
      duration: 5000,
      ...notification,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto remove after duration (unless persistent)
    if (!newNotification.persistent && newNotification.duration) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'error':
        return <AlertCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'info':
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getStyles = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIconColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
      default:
        return 'text-blue-500';
    }
  };

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification, clearAll }}>
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              'border rounded-lg shadow-lg p-4 transition-all duration-300 transform',
              'animate-slideIn',
              getStyles(notification.type)
            )}
          >
            <div className="flex items-start space-x-3">
              <div className={cn('flex-shrink-0', getIconColor(notification.type))}>
                {getIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">
                  {notification.title}
                </h4>
                {notification.message && (
                  <p className="text-sm opacity-90 mt-1">
                    {notification.message}
                  </p>
                )}
              </div>

              <button
                onClick={() => removeNotification(notification.id)}
                className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

// Global notification functions for easy use
export const showNotification = {
  success: (title: string, message?: string, options?: Partial<Notification>) => {
    const event = new CustomEvent('addNotification', {
      detail: { type: 'success', title, message, ...options }
    });
    window.dispatchEvent(event);
  },
  error: (title: string, message?: string, options?: Partial<Notification>) => {
    const event = new CustomEvent('addNotification', {
      detail: { type: 'error', title, message, ...options }
    });
    window.dispatchEvent(event);
  },
  warning: (title: string, message?: string, options?: Partial<Notification>) => {
    const event = new CustomEvent('addNotification', {
      detail: { type: 'warning', title, message, ...options }
    });
    window.dispatchEvent(event);
  },
  info: (title: string, message?: string, options?: Partial<Notification>) => {
    const event = new CustomEvent('addNotification', {
      detail: { type: 'info', title, message, ...options }
    });
    window.dispatchEvent(event);
  }
};

// Hook to listen for global notifications
export const useGlobalNotifications = () => {
  const { addNotification } = useNotifications();

  useEffect(() => {
    const handleAddNotification = (event: CustomEvent) => {
      addNotification(event.detail);
    };

    window.addEventListener('addNotification', handleAddNotification as EventListener);
    
    return () => {
      window.removeEventListener('addNotification', handleAddNotification as EventListener);
    };
  }, [addNotification]);
};