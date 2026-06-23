import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './RouteProgressBar.module.css';

const START_DELAY_MS = 20;
const LOADING_HOLD_MS = 500;
const COMPLETE_FADE_MS = 300;

/**
 * Slim top-of-viewport progress bar that animates on route changes. Pure
 * UI affordance — runs on a fixed timeline (~800ms total) rather than
 * tracking actual data-load completion. Quick navigations still benefit
 * from the perceived-progress feedback. The bar is hidden in `idle` and
 * skips the very first render so a cold load doesn't flash.
 */
export default function RouteProgressBar() {
  const { pathname } = useLocation();
  const [phase, setPhase] = useState('idle');
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return undefined;
    }

    setPhase('start');
    const loadingTimer = setTimeout(() => setPhase('loading'), START_DELAY_MS);
    const completeTimer = setTimeout(() => setPhase('complete'), LOADING_HOLD_MS);
    const idleTimer = setTimeout(() => setPhase('idle'), LOADING_HOLD_MS + COMPLETE_FADE_MS);

    return () => {
      clearTimeout(loadingTimer);
      clearTimeout(completeTimer);
      clearTimeout(idleTimer);
    };
  }, [pathname]);

  const className = phase === 'idle' ? styles.bar : `${styles.bar} ${styles[phase]}`;
  return <div className={className} aria-hidden="true" />;
}
