'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
  isActive?: boolean;
  tooltip?: string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      size = 'default',
      variant = 'default',
      isActive = false,
      tooltip,
      children,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'h-7 w-7',
      default: 'h-9 w-9',
      lg: 'h-11 w-11',
    };

    const variantClasses = {
      default:
        'bg-transparent hover:bg-background-tertiary text-text-secondary hover:text-text-primary',
      ghost:
        'bg-transparent hover:bg-background-tertiary text-text-secondary hover:text-accent-primary',
      outline:
        'bg-transparent border border-border hover:bg-background-tertiary text-text-secondary hover:text-text-primary',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center rounded-lg transition-all duration-200',
          'focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed',
          sizeClasses[size],
          variantClasses[variant],
          isActive && 'bg-background-tertiary text-accent-primary',
          className
        )}
        {...props}
      >
        {children}
        {tooltip && (
          <span
            className={cn(
              'absolute bottom-full left-1/2 -translate-x-1/2 mb-2',
              'px-3 py-1.5 rounded-lg text-xs whitespace-nowrap',
              'bg-background-primary border border-border text-text-secondary',
              'opacity-0 pointer-events-none transition-opacity duration-200',
              'shadow-dropdown group-hover:opacity-100',
              'peer-hover:opacity-100'
            )}
          >
            {tooltip}
          </span>
        )}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export { IconButton };
