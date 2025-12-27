'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}) => {
  // Handle escape key
  React.useEffect(() => {
    if (!closeOnEscape) {return;}

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) {return null;}

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-black/60 backdrop-blur-sm',
        'animate-fade-in'
      )}
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div
        className={cn(
          'relative bg-background-secondary border border-border',
          'rounded-2xl p-7 max-w-md w-[90%]',
          'shadow-modal animate-slide-up-modal',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            className={cn(
              'absolute top-4 right-4',
              'w-8 h-8 flex items-center justify-center rounded-lg',
              'text-text-secondary hover:text-text-primary',
              'hover:bg-background-tertiary transition-colors'
            )}
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
};

// Modal Header
interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({ children, className }) => {
  return <div className={cn('mb-5', className)}>{children}</div>;
};

// Modal Title
interface ModalTitleProps {
  children: React.ReactNode;
  className?: string;
}

const ModalTitle: React.FC<ModalTitleProps> = ({ children, className }) => {
  return (
    <h3
      className={cn(
        'text-xl font-semibold text-text-primary',
        className
      )}
    >
      {children}
    </h3>
  );
};

// Modal Description
interface ModalDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

const ModalDescription: React.FC<ModalDescriptionProps> = ({
  children,
  className,
}) => {
  return (
    <p
      className={cn(
        'text-sm text-text-secondary mt-2 leading-relaxed',
        className
      )}
    >
      {children}
    </p>
  );
};

// Modal Content
interface ModalContentProps {
  children: React.ReactNode;
  className?: string;
}

const ModalContent: React.FC<ModalContentProps> = ({ children, className }) => {
  return <div className={cn('', className)}>{children}</div>;
};

// Modal Footer
interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

const ModalFooter: React.FC<ModalFooterProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'flex gap-3 justify-end mt-6 pt-5 border-t border-border',
        className
      )}
    >
      {children}
    </div>
  );
};

// Modal Icon
interface ModalIconProps {
  children: React.ReactNode;
  variant?: 'default' | 'danger' | 'success' | 'warning';
  className?: string;
}

const ModalIcon: React.FC<ModalIconProps> = ({
  children,
  variant = 'default',
  className,
}) => {
  const variantClasses = {
    default:
      'bg-accent-primary/10 border-accent-primary/30 text-accent-primary',
    danger: 'bg-red-500/10 border-red-500/30 text-red-500',
    success: 'bg-green-500/10 border-green-500/30 text-green-500',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500',
  };

  return (
    <div
      className={cn(
        'w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5',
        'border-2 animate-icon-pulse',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </div>
  );
};

export {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
  ModalIcon,
};
