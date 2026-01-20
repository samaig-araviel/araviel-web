'use client';

import { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

interface DropdownContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  close: () => void;
}

const DropdownContext = createContext<DropdownContextType | null>(null);

const useDropdown = () => {
  const context = useContext(DropdownContext);
  if (!context) throw new Error('useDropdown must be used within Dropdown');
  return context;
};

// Root Dropdown Component
interface DropdownProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function Dropdown({ children, defaultOpen = false, onOpenChange }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setIsOpen(false);
    onOpenChange?.(false);
  }, [onOpenChange]);

  const handleSetIsOpen = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        close();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, close]);

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen: handleSetIsOpen, close }}>
      <div ref={containerRef} className="relative inline-block">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

// Dropdown Trigger
interface DropdownTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

function DropdownTrigger({ children, className }: DropdownTriggerProps) {
  const { isOpen, setIsOpen } = useDropdown();

  return (
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className={cn('outline-none', className)}
      aria-expanded={isOpen}
      aria-haspopup="true"
    >
      {children}
    </button>
  );
}

// Dropdown Content
interface DropdownContentProps {
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom';
  className?: string;
}

function DropdownContent({
  children,
  align = 'start',
  side = 'bottom',
  className,
}: DropdownContentProps) {
  const { isOpen } = useDropdown();

  if (!isOpen) return null;

  const alignments = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  };

  const sides = {
    top: 'bottom-full mb-1',
    bottom: 'top-full mt-1',
  };

  return (
    <div
      className={cn(
        `
        absolute z-50 min-w-[180px]
        rounded-xl border border-border bg-background-secondary
        p-1.5 shadow-lg
        animate-scale-in origin-top-left
      `,
        alignments[align],
        sides[side],
        className
      )}
      role="menu"
    >
      {children}
    </div>
  );
}

// Dropdown Item
interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  shortcut?: string;
  danger?: boolean;
}

function DropdownItem({
  children,
  icon,
  shortcut,
  danger,
  className,
  onClick,
  ...props
}: DropdownItemProps) {
  const { close } = useDropdown();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    close();
  };

  return (
    <button
      type="button"
      className={cn(
        `
        flex w-full items-center gap-3 rounded-lg px-3 py-2
        text-sm text-text-primary
        transition-colors duration-150
        hover:bg-background-tertiary
        focus:bg-background-tertiary focus:outline-none
      `,
        danger && 'text-error hover:bg-error/10',
        className
      )}
      onClick={handleClick}
      role="menuitem"
      {...props}
    >
      {icon && <span className="w-4 text-text-muted">{icon}</span>}
      <span className="flex-1 text-left">{children}</span>
      {shortcut && (
        <span className="text-xs text-text-muted">{shortcut}</span>
      )}
    </button>
  );
}

// Dropdown Label
interface DropdownLabelProps {
  children: React.ReactNode;
  className?: string;
}

function DropdownLabel({ children, className }: DropdownLabelProps) {
  return (
    <div
      className={cn('px-3 py-2 text-xs font-medium text-text-muted', className)}
    >
      {children}
    </div>
  );
}

// Dropdown Divider
function DropdownDivider({ className }: { className?: string }) {
  return (
    <div className={cn('-mx-1.5 my-1 h-px bg-border', className)} />
  );
}

export {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownDivider,
};
