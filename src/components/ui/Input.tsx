'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'ghost';
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = 'default', error, type, ...props }, ref) => {
    const variantClasses = {
      default:
        'bg-background-tertiary border border-border focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/10',
      ghost: 'bg-transparent border-none',
    };

    return (
      <input
        type={type}
        className={cn(
          'w-full rounded-lg px-3 py-2.5 text-sm',
          'text-text-primary placeholder:text-text-tertiary',
          'transition-all duration-200 focus:outline-none',
          'font-inherit',
          variantClasses[variant],
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/10',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };
