import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const STORAGE_KEY = 'araviel:scroll-positions';
const PERSIST_DEBOUNCE_MS = 120;

function readPositions() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writePositions(positions) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch {
    // sessionStorage may be unavailable (private mode, quota); fail silently
  }
}

/**
 * Restore the scroll position of a route's scroll container across navigations.
 * Forward navigations (PUSH / REPLACE) reset scroll to the top. Browser back /
 * forward (POP) restores the position recorded when the user last left.
 *
 * Positions are keyed by `useLocation().key`, so revisiting the same URL via a
 * different history entry starts fresh — matching native browser behaviour.
 *
 * @param {import('react').RefObject<HTMLElement>} containerRef - Ref attached
 *   to the route's scrollable root element.
 */
export default function useScrollRestoration(containerRef) {
  const { key } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const positions = readPositions();
    if (navigationType === 'POP' && typeof positions[key] === 'number') {
      container.scrollTo({ top: positions[key], left: 0 });
    } else {
      container.scrollTo({ top: 0, left: 0 });
    }

    let timeoutId;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const next = readPositions();
        next[key] = container.scrollTop;
        writePositions(next);
      }, PERSIST_DEBOUNCE_MS);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      container.removeEventListener('scroll', handleScroll);
      const final = readPositions();
      final[key] = container.scrollTop;
      writePositions(final);
    };
  }, [key, navigationType, containerRef]);
}
