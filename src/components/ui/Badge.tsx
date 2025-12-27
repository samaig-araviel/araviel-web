'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-accent-primary text-white',
        secondary:
          'bg-background-tertiary text-text-secondary border border-border',
        outline: 'border border-border text-text-primary bg-transparent',
        success: 'bg-green-500/10 text-green-500 border border-green-500/20',
        warning: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20',
        error: 'bg-red-500/10 text-red-500 border border-red-500/20',
        ade: 'bg-accent-primary text-white uppercase tracking-wide text-[9px] font-bold',
      },
      size: {
        default: 'h-5',
        sm: 'h-4 text-[10px] px-1.5',
        lg: 'h-6 text-sm px-2.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge: React.FC<BadgeProps> = ({
  className,
  variant,
  size,
  ...props
}) => {
  return (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
};

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
