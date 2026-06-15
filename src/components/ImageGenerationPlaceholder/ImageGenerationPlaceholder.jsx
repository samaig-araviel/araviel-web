import { useEffect, useMemo, useRef, useState } from 'react';
import useElapsedPhase from './useElapsedPhase';
import styles from './ImageGenerationPlaceholder.module.css';

const A_MARK_PATH =
  'M 50 8 L 92 90 L 76 90 L 67 72 L 33 72 L 24 90 L 8 90 Z M 50 28 L 38 62 L 62 62 Z';
const SAMPLE_STEP = 3.6;
const SAMPLE_MIN = 4;
const SAMPLE_MAX = 96;
const SHIMMER_DURATION_S = 2.6;

function computeMarkDots(pathElement) {
  if (!pathElement || typeof pathElement.isPointInFill !== 'function') return [];
  const dots = [];
  for (let y = SAMPLE_MIN; y <= SAMPLE_MAX; y += SAMPLE_STEP) {
    for (let x = SAMPLE_MIN; x <= SAMPLE_MAX; x += SAMPLE_STEP) {
      try {
        if (pathElement.isPointInFill({ x, y })) {
          dots.push({
            x,
            y,
            delay: Math.random() * SHIMMER_DURATION_S,
          });
        }
      } catch {
        return [];
      }
    }
  }
  return dots;
}

export default function ImageGenerationPlaceholder({ startedAt, aspectRatio = '1 / 1' }) {
  const safeStartedAt = useMemo(
    () => (typeof startedAt === 'number' ? startedAt : Date.now()),
    [startedAt]
  );
  const { label } = useElapsedPhase(safeStartedAt);
  const cardRef = useRef(null);
  const pathRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);
  const [dots, setDots] = useState([]);

  useEffect(() => {
    setDots(computeMarkDots(pathRef.current));
  }, []);

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
        <svg
          className={styles.mark}
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          focusable="false"
        >
          <path ref={pathRef} d={A_MARK_PATH} fillRule="evenodd" className={styles.markHidden} />
          {dots.map((dot, idx) => (
            <circle
              key={idx}
              cx={dot.x}
              cy={dot.y}
              r="1.1"
              className={styles.markDot}
              style={{ animationDelay: `${dot.delay.toFixed(2)}s` }}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
