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

function ToastItem({ toast, onDismiss }) {
  const typeClass =
    toast.type === 'error'
      ? styles.toastError
      : toast.type === 'success'
      ? styles.toastSuccess
      : '';
  const iconClass =
    toast.type === 'error'
      ? styles.toastIconError
      : toast.type === 'success'
      ? styles.toastIconSuccess
      : '';

  return (
    <div className={`${styles.toast} ${typeClass} ${toast.exiting ? styles.toastExiting : ''}`}>
      <div className={`${styles.toastIcon} ${iconClass}`}>
        {toast.type === 'error' ? <ErrorIcon /> : <SuccessIcon />}
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

  return (
    <ToastContext.Provider value={{ show, showError, showSuccess, dismiss }}>
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
