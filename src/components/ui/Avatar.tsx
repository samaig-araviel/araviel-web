'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';

export interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  showBorder?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({
  name = '',
  src,
  size = 'default',
  className,
  showBorder = false,
}) => {
  const [imageError, setImageError] = React.useState(false);
  const initials = getInitials(name);

  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    default: 'w-7 h-7 text-xs',
    lg: 'w-8 h-8 text-sm',
  };

  const showImage = src && !imageError;

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg flex-shrink-0',
        'bg-gradient-to-br from-accent-primary to-accent-hover',
        'font-bold text-white',
        'shadow-[0_2px_8px_rgba(217,120,70,0.25)]',
        showBorder && 'border-2 border-background-secondary',
        sizeClasses[size],
        className
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full rounded-lg object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span>{initials || '?'}</span>
      )}
    </div>
  );
};

Avatar.displayName = 'Avatar';

export { Avatar };
