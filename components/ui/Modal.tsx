'use client';

import { useEffect, useRef, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalContextType {
  onClose: () => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error('useModal must be used within Modal');
  return context;
};

// Root Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <ModalContext.Provider value={{ onClose }}>
      <div
        ref={overlayRef}
        className="
          fixed inset-0 z-50
          flex items-center justify-center
          bg-black/50 backdrop-blur-sm
          animate-fade-in
        "
        onClick={handleOverlayClick}
        aria-modal="true"
        role="dialog"
      >
        {children}
      </div>
    </ModalContext.Provider>,
    document.body
  );
}

// Modal Content
interface ModalContentProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

function ModalContent({ children, size = 'md', className }: ModalContentProps) {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl',
  };

  return (
    <div
      className={cn(
        `
        w-full mx-4
        bg-background-secondary
        rounded-2xl shadow-lg
        overflow-hidden
        animate-scale-in
      `,
        sizes[size],
        className
      )}
    >
      {children}
    </div>
  );
}

// Modal Header
interface ModalHeaderProps {
  children: React.ReactNode;
  showClose?: boolean;
  className?: string;
}

function ModalHeader({ children, showClose = true, className }: ModalHeaderProps) {
  const { onClose } = useModal();

  return (
    <div
      className={cn(
        'flex items-center justify-between border-b border-border px-6 py-4',
        className
      )}
    >
      <h2 className="text-lg font-semibold text-text-primary">{children}</h2>
      {showClose && (
        <button
          onClick={onClose}
          className="
            rounded-lg p-1.5 text-text-muted
            transition-colors hover:bg-background-tertiary hover:text-text-primary
          "
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

// Modal Body
interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

function ModalBody({ children, className }: ModalBodyProps) {
  return (
    <div className={cn('px-6 py-4', className)}>
      {children}
    </div>
  );
}

// Modal Footer
interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 border-t border-border px-6 py-4',
        className
      )}
    >
      {children}
    </div>
  );
}

export { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter };
