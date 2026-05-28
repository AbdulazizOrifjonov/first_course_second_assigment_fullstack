import React, { createContext, useCallback, useContext, useState } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import './ToastContext.css';

const ToastContext = createContext(null);

const toastStyles = {
  success: {
    wrap: 'border-green-200 bg-green-50 text-green-900',
    icon: 'text-green-600',
    Icon: CheckCircle,
  },
  error: {
    wrap: 'border-red-200 bg-red-50 text-red-900',
    icon: 'text-red-600',
    Icon: AlertCircle,
  },
  info: {
    wrap: 'border-blue-200 bg-blue-50 text-blue-900',
    icon: 'text-blue-600',
    Icon: Info,
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(() => {
    return localStorage.getItem('tybt_notifications_enabled') !== 'false';
  });

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((toast) => {
    if (!notificationsEnabled) return;
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const nextToast = { ...toast, id, createdAt };
    setToasts(prev => [...prev, nextToast]);
    setNotifications(prev => [nextToast, ...prev].slice(0, 10));
    window.setTimeout(() => removeToast(id), 3500);
  }, [notificationsEnabled, removeToast]);

  const setNotificationsEnabled = useCallback((enabled) => {
    setNotificationsEnabledState(enabled);
    localStorage.setItem('tybt_notifications_enabled', String(enabled));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, notificationsEnabled, setNotificationsEnabled, notifications, clearNotifications }}>
      {children}
      <div className="fixed right-3 top-20 z-[70] flex w-[calc(100vw-1.5rem)] max-w-sm flex-col gap-3 sm:right-5">
        {toasts.map(toast => {
          const styles = toastStyles[toast.type];
          const Icon = styles.Icon;
          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur ${styles.wrap}`}
            >
              <Icon size={20} className={`mt-0.5 flex-shrink-0 ${styles.icon}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold break-safe">{toast.title}</p>
                {toast.message && <p className="mt-0.5 text-xs opacity-80 break-safe">{toast.message}</p>}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="rounded-lg p-1 opacity-60 transition hover:bg-black/5 hover:opacity-100"
                aria-label="Toastni yopish"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
