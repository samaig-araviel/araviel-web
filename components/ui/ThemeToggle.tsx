'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STORAGE_KEYS } from '@/lib/constants';
import type { Theme } from '@/types';

interface ThemeToggleProps {
  variant?: 'button' | 'dropdown';
  className?: string;
}

export function ThemeToggle({ variant = 'button', className }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEYS.THEME) as Theme | null;
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    if (theme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', systemDark);
      localStorage.removeItem(STORAGE_KEYS.THEME);
    } else {
      root.classList.toggle('dark', theme === 'dark');
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    }
  }, [theme, mounted]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle('dark', e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const cycleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  const getCurrentIcon = () => {
    if (theme === 'light') return <Sun className="h-5 w-5" />;
    if (theme === 'dark') return <Moon className="h-5 w-5" />;
    return <Monitor className="h-5 w-5" />;
  };

  if (!mounted) {
    return (
      <button
        className={cn(
          'h-10 w-10 rounded-lg bg-background-tertiary',
          className
        )}
        disabled
      />
    );
  }

  if (variant === 'button') {
    return (
      <button
        onClick={cycleTheme}
        className={cn(
          `
          flex h-10 w-10 items-center justify-center rounded-lg
          text-text-secondary
          transition-colors duration-200
          hover:bg-background-tertiary hover:text-text-primary
        `,
          className
        )}
        aria-label={`Current theme: ${theme}. Click to change.`}
        title={`Theme: ${theme}`}
      >
        {getCurrentIcon()}
      </button>
    );
  }

  // Dropdown variant for settings
  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium text-text-primary">Theme</label>
      <div className="flex gap-2">
        {[
          { value: 'light' as Theme, icon: Sun, label: 'Light' },
          { value: 'dark' as Theme, icon: Moon, label: 'Dark' },
          { value: 'system' as Theme, icon: Monitor, label: 'System' },
        ].map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={cn(
              `
              flex flex-1 flex-col items-center gap-2 rounded-xl p-3
              border transition-all duration-200
            `,
              theme === value
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-border bg-background-tertiary text-text-secondary hover:border-text-muted'
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-sm font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
