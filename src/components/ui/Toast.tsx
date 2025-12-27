'use client';

import * as React from 'react';
import { Check, X, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectToasts } from '@/store/selectors';
import { removeToast } from '@/store/slices/uiSlice';
import type { ToastMessage } from '@/types';

const ToastIcon: React.FC<{ type: ToastMessage['type'] }> = ({ type }) => {
  const icons = {
    success: <Check size={18} />,
    error: <X size={18} />,
    warning: <AlertTriangle size={18} />,
    info: <Info size={18} />,
  };

  const colorClasses = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
  };

  return (
    <span className={cn('flex-shrink-0', colorClasses[type])}>
      {icons[type]}
    </span>
  );
};

interface ToastItemProps {
  toast: ToastMessage;
  onRemove: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  React.useEffect(() => {
    const duration = toast.duration || 3000;
    const timer = setTimeout(() => {
      onRemove();
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.duration, onRemove]);

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3',
        'bg-background-secondary border border-border rounded-xl',
        'shadow-dropdown-dark backdrop-blur-xl',
        'animate-slide-up-modal'
      )}
    >
      <ToastIcon type={toast.type} />
      <span className="text-sm font-medium text-text-primary">
        {toast.message}
      </span>
      <button
        onClick={onRemove}
        className={cn(
          'ml-auto p-1 rounded-md',
          'text-text-tertiary hover:text-text-primary',
          'hover:bg-background-tertiary transition-colors'
        )}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
};

const ToastContainer: React.FC = () => {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector(selectToasts);

  const handleRemove = (id: string) => {
    dispatch(removeToast(id));
  };

  if (toasts.length === 0) {return null;}

  return (
    <div
      className={cn(
        'fixed bottom-20 left-1/2 -translate-x-1/2 z-[60]',
        'flex flex-col gap-2 w-auto max-w-sm'
      )}
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => handleRemove(toast.id)}
        />
      ))}
    </div>
  );
};

export { ToastContainer, ToastItem };
