import { useMemo } from 'react';
import styles from './ComparisonBlock.module.css';

/**
 * Comparison block — renders a side-by-side comparison from a JSON spec.
 * Expects `spec` to be a JSON string:
 * { "items": [{ "name": "A", "pros": [...], "cons": [...], "description": "..." }, ...] }
 */
export default function ComparisonBlock({ spec, isStreaming = false }) {
  const data = useMemo(() => {
    try {
      const parsed = typeof spec === 'string' ? JSON.parse(spec) : spec;
      if (!parsed || !Array.isArray(parsed.items)) return null;
      const items = parsed.items.filter((item) => item && item.name);
      return items.length >= 2 ? items : null;
    } catch {
      return null;
    }
  }, [spec]);

  if (!data) {
    if (isStreaming) {
      return (
        <div className={styles.wrapper}>
          <div className={styles.header}>
            <span className={styles.headerLabel}>Comparison</span>
            <span className={styles.headerCount}>Loading...</span>
          </div>
          <div style={{ padding: '20px', opacity: 0.5, fontSize: '12.5px', color: 'var(--text-muted)' }}>
            Building comparison...
          </div>
        </div>
      );
    }
    return (
      <div className={styles.error}>
        <span>Could not parse comparison data</span>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.headerLabel}>Comparison</span>
        <span className={styles.headerCount}>{data.length} items</span>
      </div>
      <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }}>
        {data.map((item, idx) => (
          <div key={idx} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardName}>{item.name}</span>
              {item.description && (
                <span className={styles.cardDescription}>{item.description}</span>
              )}
            </div>
            <div className={styles.cardBody}>
              {item.pros && item.pros.length > 0 && (
                <div className={styles.section}>
                  <span className={styles.sectionLabel}>
                    <span className={styles.prosIcon}>+</span> Pros
                  </span>
                  <ul className={styles.list}>
                    {item.pros.map((pro, pi) => (
                      <li key={pi} className={styles.proItem}>{pro}</li>
                    ))}
                  </ul>
                </div>
              )}
              {item.cons && item.cons.length > 0 && (
                <div className={styles.section}>
                  <span className={styles.sectionLabel}>
                    <span className={styles.consIcon}>&minus;</span> Cons
                  </span>
                  <ul className={styles.list}>
                    {item.cons.map((con, ci) => (
                      <li key={ci} className={styles.conItem}>{con}</li>
                    ))}
                  </ul>
                </div>
              )}
              {item.features && item.features.length > 0 && (
                <div className={styles.section}>
                  <span className={styles.sectionLabel}>Features</span>
                  <ul className={styles.list}>
                    {item.features.map((feat, fi) => (
                      <li key={fi} className={styles.featureItem}>{feat}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
