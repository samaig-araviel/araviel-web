import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { subscribeToInflight } from '../../lib/apiClient';
import styles from './RouteProgressBar.module.css';

const START_DELAY_MS = 20;
const FETCH_GRACE_MS = 150;
const SETTLE_DEBOUNCE_MS = 80;
const COMPLETE_FADE_MS = 300;
const SAFETY_TIMEOUT_MS = 10000;

/**
 * Slim top-of-viewport progress bar that animates on route changes and
 * tracks actual in-flight `apiFetch` calls.
 *
 * Timeline per navigation:
 *   1. pathname changes → bar appears (`start`)
 *   2. ~20ms later → slow climb to ~90% (`loading`)
 *   3. After a short grace period, watch the in-flight counter
 *   4. When the counter settles at 0 → snap to 100% + fade (`complete`)
 *   5. → `idle`
 *
 * The grace period lets the new route mount and kick off its fetches before
 * we start watching; otherwise we'd settle immediately on routes whose data
 * is already cached. A safety timeout guarantees the bar never sticks.
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

    let cancelled = false;
    let settleTimer = null;
    let unsubscribe = null;
    let settled = false;

    const finish = () => {
      if (cancelled || settled) return;
      settled = true;
      if (unsubscribe) unsubscribe();
      setPhase('complete');
      const idle = setTimeout(() => {
        if (!cancelled) setPhase('idle');
      }, COMPLETE_FADE_MS);
      settleTimer = idle;
    };

    setPhase('start');
    const loadingTimer = setTimeout(() => {
      if (!cancelled) setPhase('loading');
    }, START_DELAY_MS);

    const watchTimer = setTimeout(() => {
      if (cancelled) return;
      unsubscribe = subscribeToInflight((count) => {
        if (cancelled) return;
        if (settleTimer) clearTimeout(settleTimer);
        if (count === 0) {
          settleTimer = setTimeout(finish, SETTLE_DEBOUNCE_MS);
        }
      });
    }, FETCH_GRACE_MS);

    const safetyTimer = setTimeout(finish, SAFETY_TIMEOUT_MS);

    return () => {
      cancelled = true;
      clearTimeout(loadingTimer);
      clearTimeout(watchTimer);
      clearTimeout(safetyTimer);
      if (settleTimer) clearTimeout(settleTimer);
      if (unsubscribe) unsubscribe();
    };
  }, [pathname]);

  const className = phase === 'idle' ? styles.bar : `${styles.bar} ${styles[phase]}`;
  return <div className={className} aria-hidden="true" />;
}
