'use client';

import * as React from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectTheme } from '@/store/selectors';
import { setTheme } from '@/store/slices/uiSlice';
import type { ThemeMode } from '@/types';

/**
 * Custom hook for managing theme state
 * Handles system preference detection and theme switching
 */
export function useTheme() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);
  const [resolvedTheme, setResolvedTheme] = React.useState<'light' | 'dark'>('dark');

  // Detect system preference
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (theme === 'system') {
        setResolvedTheme(e.matches ? 'dark' : 'light');
      }
    };

    // Set initial value
    if (theme === 'system') {
      setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
    } else {
      setResolvedTheme(theme);
    }

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Apply theme to document
  React.useEffect(() => {
    const root = document.documentElement;

    // Remove previous theme classes
    root.classList.remove('light', 'dark');

    // Add current theme class
    root.classList.add(resolvedTheme);

    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        resolvedTheme === 'dark' ? '#0d0f12' : '#ffffff'
      );
    }
  }, [resolvedTheme]);

  const changeTheme = React.useCallback(
    (newTheme: ThemeMode) => {
      dispatch(setTheme(newTheme));
    },
    [dispatch]
  );

  const toggleTheme = React.useCallback(() => {
    const nextTheme: ThemeMode =
      theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';
    dispatch(setTheme(nextTheme));
  }, [dispatch, theme]);

  return {
    theme,
    resolvedTheme,
    setTheme: changeTheme,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    isSystem: theme === 'system',
  };
}
