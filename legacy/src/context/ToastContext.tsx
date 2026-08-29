import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X, Sparkles } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (options: Omit<Toast, 'id'>) => string;
  showSuccess: (title: string, message: string, duration?: number) => string;
  showError: (title: string, message: string, duration?: number) => string;
  showInfo: (title: string, message: string, duration?: number) => string;
  showWarning: (title: string, message: string, duration?: number) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastCounters = useRef(0);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = 'info', title, message, duration = 4500 }: Omit<Toast, 'id'>) => {
      const id = `toast-${Date.now()}-${++toastCounters.current}`;
      const newToast: Toast = { id, type, title, message, duration };

      setToasts((prev) => [newToast, ...prev].slice(0, 5)); // Keep max 5 toasts

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }

      return id;
    },
    [dismissToast]
  );

  const showSuccess = useCallback(
    (title: string, message: string, duration = 4500) => {
      return showToast({ type: 'success', title, message, duration });
    },
    [showToast]
  );

  const showError = useCallback(
    (title: string, message: string, duration = 5000) => {
      return showToast({ type: 'error', title, message, duration });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (title: string, message: string, duration = 4000) => {
      return showToast({ type: 'info', title, message, duration });
    },
    [showToast]
  );

  const showWarning = useCallback(
    (title: string, message: string, duration = 4500) => {
      return showToast({ type: 'warning', title, message, duration });
    },
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        showSuccess,
        showError,
        showInfo,
        showWarning,
        dismissToast,
      }}
    >
      {children}

      {/* Floating Toast Notification Container */}
      <div
        id="toast-notification-region"
        aria-live="polite"
        className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-[calc(100vw-2rem)] sm:w-auto pointer-events-none"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-[#00C0FF]" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'info':
      default:
        return <Sparkles className="w-4 h-4 text-[#008CFF]" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-[#008CFF]/40 shadow-blue-950/20';
      case 'error':
        return 'border-red-500/40 shadow-red-950/20';
      case 'warning':
        return 'border-amber-500/40 shadow-amber-950/20';
      case 'info':
      default:
        return 'border-white/20 shadow-black/30';
    }
  };

  const getAccentBadge = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-blue-500/15 text-[#00C0FF] border-blue-400/20';
      case 'error':
        return 'bg-red-500/15 text-red-400 border-red-400/20';
      case 'warning':
        return 'bg-amber-500/15 text-amber-300 border-amber-400/20';
      case 'info':
      default:
        return 'bg-white/10 text-gray-200 border-white/15';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, y: -10, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
      id={`toast-${toast.id}`}
      className={`pointer-events-auto relative overflow-hidden bg-[#141414] text-white border ${getBorderColor()} rounded-2xl shadow-xl backdrop-blur-md p-4 sm:p-4.5 flex items-start gap-3 select-none`}
      role="alert"
    >
      {/* Icon Badge */}
      <div className={`p-2 rounded-xl border ${getAccentBadge()} flex-shrink-0 mt-0.5`}>
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-1 space-y-0.5 text-left">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-serif font-bold text-sm text-white tracking-tight leading-tight">
            {toast.title}
          </h4>
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
            {toast.type}
          </span>
        </div>
        <p className="text-xs font-sans text-gray-300 leading-relaxed break-words">
          {toast.message}
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={onDismiss}
        className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0 -mr-1 -mt-1 cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Animated subtle progress bar at bottom */}
      {toast.duration && toast.duration > 0 && (
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: toast.duration / 1000, ease: 'linear' }}
          className={`absolute bottom-0 left-0 h-0.5 ${
            toast.type === 'success'
              ? 'bg-[#008CFF]'
              : toast.type === 'error'
              ? 'bg-red-500'
              : toast.type === 'warning'
              ? 'bg-amber-500'
              : 'bg-gray-400'
          }`}
        />
      )}
    </motion.div>
  );
};
