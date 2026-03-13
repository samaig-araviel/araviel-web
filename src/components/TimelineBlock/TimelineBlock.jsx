import { useState, useMemo } from 'react';
import styles from './TimelineBlock.module.css';

/**
 * Timeline block — renders a vertical timeline from a JSON spec.
 * Expects `spec` to be a JSON string of an array:
 * [{ "date": "2024", "title": "Event", "description": "Details" }, ...]
 */
export default function TimelineBlock({ spec }) {
  const [expanded, setExpanded] = useState(null);

  const items = useMemo(() => {
    try {
      const parsed = typeof spec === 'string' ? JSON.parse(spec) : spec;
      if (!Array.isArray(parsed)) return null;
      return parsed.filter(
        (item) => item && (item.date || item.label) && item.title
      );
    } catch {
      return null;
    }
  }, [spec]);

  if (!items || items.length === 0) {
    return (
      <div className={styles.error}>
        <span>Could not parse timeline data</span>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.headerLabel}>Timeline</span>
        <span className={styles.headerCount}>{items.length} events</span>
      </div>
      <div className={styles.timeline}>
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`${styles.item} ${expanded === idx ? styles.itemExpanded : ''}`}
            onClick={() => setExpanded(expanded === idx ? null : idx)}
          >
            <div className={styles.marker}>
              <div className={styles.dot} />
              {idx < items.length - 1 && <div className={styles.line} />}
            </div>
            <div className={styles.content}>
              <span className={styles.date}>{item.date || item.label}</span>
              <span className={styles.title}>{item.title}</span>
              {item.description && (
                <span
                  className={`${styles.description} ${expanded === idx ? styles.descriptionVisible : ''}`}
                >
                  {item.description}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
