import { useMemo } from 'react';
import styles from './ComparisonBlock.module.css';

const CheckIcon = () => (
  <svg
    viewBox="0 0 16 16"
    width="12"
    height="12"
    aria-hidden="true"
    focusable="false"
    className={styles.icon}
  >
    <path
      d="M3.5 8.5l2.8 2.8L12.5 5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CrossIcon = () => (
  <svg
    viewBox="0 0 16 16"
    width="12"
    height="12"
    aria-hidden="true"
    focusable="false"
    className={styles.icon}
  >
    <path
      d="M4.5 4.5l7 7M11.5 4.5l-7 7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const SparkIcon = () => (
  <svg
    viewBox="0 0 16 16"
    width="12"
    height="12"
    aria-hidden="true"
    focusable="false"
    className={styles.icon}
  >
    <path
      d="M8 1.6l1.7 3.8 3.8 1.7-3.8 1.7L8 12.6 6.3 8.8 2.5 7.1l3.8-1.7L8 1.6z"
      fill="currentColor"
    />
  </svg>
);

/**
 * Comparison block — renders a side-by-side comparison from a JSON spec.
 * Expects `spec` to be a JSON string:
 * { "items": [{ "name": "A", "pros": [...], "cons": [...], "description": "..." }, ...] }
 */
export default function ComparisonBlock({ spec, isStreaming = false }) {
  const items = useMemo(() => {
    try {
      const parsed = typeof spec === 'string' ? JSON.parse(spec) : spec;
      if (!parsed || !Array.isArray(parsed.items)) return null;
      const filtered = parsed.items.filter((item) => item && item.name);
      return filtered.length >= 2 ? filtered : null;
    } catch {
      return null;
    }
  }, [spec]);

  if (!items) {
    if (isStreaming) {
      return (
        <div className={styles.wrapper} data-testid="comparison-block">
          <div className={styles.skeleton} role="status" aria-live="polite">
            <span className={styles.skeletonDot} aria-hidden="true" />
            Building comparison…
          </div>
        </div>
      );
    }
    return (
      <div className={styles.error} role="alert">
        <span>Could not parse comparison data</span>
      </div>
    );
  }

  return (
    <div className={styles.wrapper} data-testid="comparison-block">
      <div className={styles.grid} style={{ '--comparison-cols': items.length }}>
        {items.map((item, idx) => (
          <article key={idx} className={styles.card} style={{ '--comparison-index': idx }}>
            <header className={styles.cardHeader}>
              <span className={styles.cardBadge} aria-hidden="true">
                {String.fromCharCode(65 + idx)}
              </span>
              <div className={styles.cardHeadings}>
                <h3 className={styles.cardName}>{item.name}</h3>
                {item.description && <p className={styles.cardDescription}>{item.description}</p>}
              </div>
            </header>

            <div className={styles.cardBody}>
              {item.pros && item.pros.length > 0 && (
                <section className={styles.section}>
                  <span className={`${styles.sectionLabel} ${styles.proLabel}`}>Pros</span>
                  <ul className={styles.list}>
                    {item.pros.map((pro, pi) => (
                      <li key={pi} className={styles.proItem}>
                        <span className={styles.iconWrap}>
                          <CheckIcon />
                        </span>
                        <span className={styles.itemText}>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {item.cons && item.cons.length > 0 && (
                <section className={styles.section}>
                  <span className={`${styles.sectionLabel} ${styles.conLabel}`}>Cons</span>
                  <ul className={styles.list}>
                    {item.cons.map((con, ci) => (
                      <li key={ci} className={styles.conItem}>
                        <span className={styles.iconWrap}>
                          <CrossIcon />
                        </span>
                        <span className={styles.itemText}>{con}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {item.features && item.features.length > 0 && (
                <section className={styles.section}>
                  <span className={`${styles.sectionLabel} ${styles.featureLabel}`}>Features</span>
                  <ul className={styles.list}>
                    {item.features.map((feat, fi) => (
                      <li key={fi} className={styles.featureItem}>
                        <span className={styles.iconWrap}>
                          <SparkIcon />
                        </span>
                        <span className={styles.itemText}>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
