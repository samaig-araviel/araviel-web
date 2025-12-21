import React from 'react';
import styles from './Avatar.module.css';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
  className?: string;
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export const Avatar: React.FC<AvatarProps> = ({
  name,
  size = 'md',
  variant = 'primary',
  className = '',
}) => {
  const classes = [styles.avatar, styles[size], styles[variant], className]
    .filter(Boolean)
    .join(' ');

  return <div className={classes}>{getInitials(name)}</div>;
};
