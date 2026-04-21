import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Toast.module.css';

const ToastContext = createContext(null);

let nextId = 0;

const ErrorIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const SuccessIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const WarningIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const CloseIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const TOAST_VISUALS = {
  error: {
    border: styles.toastError,
    icon: styles.toastIconError,
    Icon: ErrorIcon,
  },
  success: {
    border: styles.toastSuccess,
    icon: styles.toastIconSuccess,
    Icon: SuccessIcon,
  },
  warning: {
    border: styles.toastWarning,
    icon: styles.toastIconWarning,
    Icon: WarningIcon,
  },
};

function ToastItem({ toast, onDismiss }) {
  const visuals = TOAST_VISUALS[toast.type] ?? TOAST_VISUALS.error;
  const { Icon } = visuals;

  return (
    <div
      className={`${styles.toast} ${visuals.border} ${toast.exiting ? styles.toastExiting : ''}`}
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
    >
      <div className={`${styles.toastIcon} ${visuals.icon}`}>
        <Icon />
      </div>
      <div className={styles.toastBody}>
        <span className={styles.toastMessage}>{toast.message}</span>
      </div>
      <div className={styles.toastActions}>
        {toast.onRetry && (
          <button
            className={styles.toastBtn}
            onClick={() => {
              onDismiss(toast.id);
              toast.onRetry();
            }}
          >
            Retry
          </button>
        )}
        <button
          className={styles.toastDismiss}
          onClick={() => onDismiss(toast.id)}
          aria-label="Dismiss"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
  }, []);

  const show = useCallback(
    ({ message, type = 'error', duration = 5000, onRetry }) => {
      const id = ++nextId;
      setToasts((prev) => {
        // Max 3 visible toasts
        const visible = prev.filter((t) => !t.exiting);
        if (visible.length >= 3) {
          const oldest = visible[0];
          dismiss(oldest.id);
        }
        return [...prev, { id, message, type, onRetry, exiting: false }];
      });
      if (duration > 0) {
        timersRef.current[id] = setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  const showError = useCallback(
    (message, options = {}) => {
      return show({ message, type: 'error', ...options });
    },
    [show]
  );

  const showSuccess = useCallback(
    (message, options = {}) => {
      return show({ message, type: 'success', ...options });
    },
    [show]
  );

  const showWarning = useCallback(
    (message, options = {}) => {
      return show({ message, type: 'warning', ...options });
    },
    [show]
  );

  return (
    <ToastContext.Provider value={{ show, showError, showSuccess, showWarning, dismiss }}>
      {children}
      {createPortal(
        <div className={styles.toastContainer}>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
