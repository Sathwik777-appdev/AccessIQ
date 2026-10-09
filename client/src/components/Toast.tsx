import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

let toastCounter = 0;
const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now().toString(36)}-${++toastCounter}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />;
      default:
        return <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />;
    }
  };

  const getStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'border-emerald-200 bg-emerald-50 text-emerald-900';
      case 'error':
        return 'border-red-200 bg-red-50 text-red-900';
      case 'warning':
        return 'border-amber-200 bg-amber-50 text-amber-900';
      default:
        return 'border-blue-200 bg-blue-50 text-blue-900';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Accessible Floating Toast Region */}
      <aside
        aria-label="Notifications"
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border shadow-lg transition-all duration-200 transform translate-y-0 ${getStyles(
              t.type,
            )}`}
          >
            <div className="flex items-center gap-2.5">
              {getIcon(t.type)}
              <span className="text-sm font-medium">{t.message}</span>
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              aria-label="Dismiss notification"
              className="text-gray-400 hover:text-gray-700 p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </aside>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
