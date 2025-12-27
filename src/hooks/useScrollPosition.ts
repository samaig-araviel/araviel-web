'use client';

import * as React from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setScrolledFromBottom } from '@/store/slices/uiSlice';

interface ScrollPosition {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  scrolledFromBottom: number;
  isAtBottom: boolean;
  isAtTop: boolean;
}

/**
 * Custom hook for tracking scroll position
 * Useful for auto-scrolling chat messages
 */
export function useScrollPosition(
  ref: React.RefObject<HTMLElement>,
  threshold: number = 100
): ScrollPosition {
  const dispatch = useAppDispatch();
  const [position, setPosition] = React.useState<ScrollPosition>({
    scrollTop: 0,
    scrollHeight: 0,
    clientHeight: 0,
    scrolledFromBottom: 0,
    isAtBottom: true,
    isAtTop: true,
  });

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = element;
      const scrolledFromBottom = scrollHeight - scrollTop - clientHeight;
      const isAtBottom = scrolledFromBottom <= threshold;
      const isAtTop = scrollTop <= threshold;

      setPosition({
        scrollTop,
        scrollHeight,
        clientHeight,
        scrolledFromBottom,
        isAtBottom,
        isAtTop,
      });

      // Update Redux state
      dispatch(setScrolledFromBottom(scrolledFromBottom));
    };

    // Initial position
    handleScroll();

    // Listen for scroll events
    element.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, [ref, threshold, dispatch]);

  return position;
}

/**
 * Hook for auto-scrolling to bottom
 */
export function useAutoScroll(
  ref: React.RefObject<HTMLElement>,
  deps: React.DependencyList = []
) {
  const [shouldAutoScroll, setShouldAutoScroll] = React.useState(true);

  React.useEffect(() => {
    const element = ref.current;
    if (!element || !shouldAutoScroll) return;

    element.scrollTo({
      top: element.scrollHeight,
      behavior: 'smooth',
    });
  }, [...deps, shouldAutoScroll]);

  const scrollToBottom = React.useCallback((behavior: ScrollBehavior = 'smooth') => {
    const element = ref.current;
    if (!element) return;

    element.scrollTo({
      top: element.scrollHeight,
      behavior,
    });
  }, [ref]);

  return {
    shouldAutoScroll,
    setShouldAutoScroll,
    scrollToBottom,
  };
}
