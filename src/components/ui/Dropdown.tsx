'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface DropdownContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const DropdownContext = React.createContext<DropdownContextValue | null>(null);

const useDropdownContext = () => {
  const context = React.useContext(DropdownContext);
  if (!context) {
    throw new Error('Dropdown components must be used within a Dropdown');
  }
  return context;
};

// Root component
interface DropdownProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Dropdown: React.FC<DropdownProps> = ({
  children,
  open: controlledOpen,
  onOpenChange,
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const setIsOpen = React.useCallback(
    (open: boolean) => {
      if (isControlled) {
        onOpenChange?.(open);
      } else {
        setInternalOpen(open);
      }
    },
    [isControlled, onOpenChange]
  );

  // Close on escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, setIsOpen]);

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (isOpen && !target.closest('[data-dropdown]')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen, setIsOpen]);

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative" data-dropdown>
        {children}
      </div>
    </DropdownContext.Provider>
  );
};

// Trigger component
interface DropdownTriggerProps {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

const DropdownTrigger: React.FC<DropdownTriggerProps> = ({
  children,
  className,
}) => {
  const { isOpen, setIsOpen } = useDropdownContext();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div
      className={cn('cursor-pointer', className)}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-expanded={isOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsOpen(!isOpen);
        }
      }}
    >
      {children}
    </div>
  );
};

// Content component
interface DropdownContentProps {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
}

const DropdownContent: React.FC<DropdownContentProps> = ({
  children,
  className,
  align = 'start',
  side = 'bottom',
  sideOffset = 8,
}) => {
  const { isOpen } = useDropdownContext();

  if (!isOpen) {return null;}

  const alignmentClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  };

  const sideClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  };

  return (
    <div
      className={cn(
        'absolute z-50 min-w-[160px]',
        'bg-background-tertiary border border-border rounded-xl',
        'p-1.5 shadow-dropdown-dark backdrop-blur-xl',
        'animate-slide-down',
        sideClasses[side],
        alignmentClasses[align],
        className
      )}
      style={{ marginTop: side === 'bottom' ? sideOffset : undefined }}
    >
      {children}
    </div>
  );
};

// Item component
interface DropdownItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  icon?: React.ReactNode;
}

const DropdownItem: React.FC<DropdownItemProps> = ({
  children,
  className,
  onClick,
  disabled = false,
  destructive = false,
  icon,
}) => {
  const { setIsOpen } = useDropdownContext();

  const handleClick = () => {
    if (disabled) {return;}
    onClick?.();
    setIsOpen(false);
  };

  return (
    <button
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
        'text-sm font-medium transition-all duration-200',
        'hover:bg-background-secondary',
        disabled && 'opacity-50 cursor-not-allowed',
        destructive
          ? 'text-red-500 hover:bg-red-500/10'
          : 'text-text-primary',
        className
      )}
      onClick={handleClick}
      disabled={disabled}
    >
      {icon && (
        <span className="w-4 h-4 flex-shrink-0 text-text-secondary">
          {icon}
        </span>
      )}
      {children}
    </button>
  );
};

// Separator component
const DropdownSeparator: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn('h-px bg-border my-1.5', className)}
      role="separator"
    />
  );
};

// Label component
const DropdownLabel: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'px-3 py-2 text-xs font-semibold text-text-tertiary uppercase tracking-wide',
        className
      )}
    >
      {children}
    </div>
  );
};

export {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
};
