import { useEffect, useMemo, useRef, useState } from 'react';
import useElapsedPhase from './useElapsedPhase';
import styles from './ImageGenerationPlaceholder.module.css';

export default function ImageGenerationPlaceholder({ startedAt, aspectRatio = '1 / 1' }) {
  const safeStartedAt = useMemo(
    () => (typeof startedAt === 'number' ? startedAt : Date.now()),
    [startedAt]
  );
  const { label } = useElapsedPhase(safeStartedAt);
  const cardRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || typeof IntersectionObserver !== 'function') return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setIsVisible(entry.isIntersecting);
      },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.wrapper}>
      <div className={styles.statusRow} role="status" aria-live="polite">
        <span key={label} className={styles.statusLabel}>
          {label}
        </span>
      </div>
      <div
        ref={cardRef}
        className={styles.card}
        style={{ aspectRatio }}
        data-paused={isVisible ? undefined : 'true'}
        aria-hidden="true"
      >
        <div className={styles.dots} />
      </div>
    </div>
  );
}
