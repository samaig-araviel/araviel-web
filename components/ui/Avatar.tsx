'use client';

import { forwardRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy' | 'away';
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, size = 'md', status, ...props }, ref) => {
    const sizes = {
      xs: 'h-6 w-6 text-xs',
      sm: 'h-8 w-8 text-sm',
      md: 'h-10 w-10 text-base',
      lg: 'h-12 w-12 text-lg',
      xl: 'h-16 w-16 text-xl',
    };

    const statusColors = {
      online: 'bg-success',
      offline: 'bg-text-muted',
      busy: 'bg-error',
      away: 'bg-warning',
    };

    const statusSizes = {
      xs: 'h-1.5 w-1.5',
      sm: 'h-2 w-2',
      md: 'h-2.5 w-2.5',
      lg: 'h-3 w-3',
      xl: 'h-4 w-4',
    };

    const getFallbackInitials = () => {
      if (fallback) return fallback.slice(0, 2).toUpperCase();
      if (alt) {
        const names = alt.split(' ');
        if (names.length >= 2) {
          return (names[0][0] + names[1][0]).toUpperCase();
        }
        return alt.slice(0, 2).toUpperCase();
      }
      return 'U';
    };

    return (
      <div
        ref={ref}
        className={cn('relative inline-flex shrink-0', className)}
        {...props}
      >
        <div
          className={cn(
            `
            relative flex items-center justify-center rounded-full
            bg-accent-soft text-accent font-medium
            overflow-hidden
          `,
            sizes[size]
          )}
        >
          {src ? (
            <Image
              src={src}
              alt={alt || 'Avatar'}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <span>{getFallbackInitials()}</span>
          )}
        </div>
        {status && (
          <span
            className={cn(
              `
              absolute bottom-0 right-0
              rounded-full ring-2 ring-background-primary
            `,
              statusSizes[size],
              statusColors[status]
            )}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };
