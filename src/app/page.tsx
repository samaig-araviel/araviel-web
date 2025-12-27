'use client';

import * as React from 'react';
import { MainLayout } from '@/components/layout';
import { useTheme } from '@/hooks/useTheme';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useAppDispatch } from '@/store/hooks';
import { setIsMobile } from '@/store/slices/uiSlice';

/**
 * Home Page
 * The main entry point of the application
 */
export default function HomePage() {
  const dispatch = useAppDispatch();
  const isMobile = useIsMobile();

  // Initialize theme
  useTheme();

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  // Track mobile state
  React.useEffect(() => {
    dispatch(setIsMobile(isMobile));
  }, [isMobile, dispatch]);

  return <MainLayout />;
}
