import { useState, useMemo, useId } from 'react';
import styles from './TimelineBlock.module.css';

/**
 * Timeline block — renders a vertical timeline from a JSON spec.
 *
 * Supports two formats:
 *
 * 1. Legacy flat array:
 *    [{ "date": "2024", "title": "Event", "description": "Details" }, ...]
 *
 * 2. Era-grouped object:
 *    {
 *      "title": "History of X",
 *      "layout": "alternating",   // optional, default "left"
 *      "eras": [
 *        {
 *          "name": "Era Name",
 *          "color": "#8B5CF6",
 *          "events": [{ "date": "...", "title": "...", "description": "..." }]
 *        }
 *      ]
 *    }
 */

const DEFAULT_ERA_COLORS = [
  '#8B5CF6', '#D97706', '#0EA5E9', '#10B981', '#F43F5E',
  '#06B6D4', '#EC4899', '#F97316', '#6366F1', '#84CC16',
];

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

export default function TimelineBlock({ spec, isStreaming = false }) {
  const [expanded, setExpanded] = useState(null);
  const scopeId = useId();

  const parsed = useMemo(() => {
    try {
      const data = typeof spec === 'string' ? JSON.parse(spec) : spec;

      // Era-grouped format
      if (data && data.eras && Array.isArray(data.eras)) {
        const eras = data.eras
          .filter((era) => era && era.events && Array.isArray(era.events))
          .map((era, idx) => ({
            name: era.name || `Period ${idx + 1}`,
            color: era.color || DEFAULT_ERA_COLORS[idx % DEFAULT_ERA_COLORS.length],
            events: era.events.filter((e) => e && (e.date || e.label) && e.title),
          }))
          .filter((era) => era.events.length > 0);

        if (eras.length === 0) return null;

        const totalEvents = eras.reduce((sum, era) => sum + era.events.length, 0);
        return {
          type: 'eras',
          title: data.title || null,
          layout: data.layout === 'alternating' ? 'alternating' : 'left',
          eras,
          totalEvents,
        };
      }

      // Legacy flat array format
      if (Array.isArray(data)) {
        const items = data.filter((item) => item && (item.date || item.label) && item.title);
        if (items.length === 0) return null;
        return { type: 'flat', items };
      }

      return null;
    } catch {
      return null;
    }
  }, [spec]);

  if (!parsed) {
    if (isStreaming) {
      return (
        <div className={styles.wrapper}>
          <div className={styles.header}>
            <span className={styles.headerLabel}>Timeline</span>
            <span className={styles.headerCount}>Loading...</span>
          </div>
          <div className={styles.timeline} style={{ padding: '20px', opacity: 0.5 }}>
            <div className={styles.item}>
              <div className={styles.marker}>
                <div className={styles.dot} />
                <div className={styles.line} />
              </div>
              <div className={styles.content}>
                <span className={styles.date}>...</span>
                <span className={styles.title}>Building timeline...</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className={styles.error}>
        <span>Could not parse timeline data</span>
      </div>
    );
  }

  // Legacy flat format
  if (parsed.type === 'flat') {
    return (
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <span className={styles.headerLabel}>Timeline</span>
          <span className={styles.headerCount}>{parsed.items.length} events</span>
        </div>
        <div className={styles.timeline}>
          {parsed.items.map((item, idx) => (
            <div
              key={idx}
              className={`${styles.item} ${expanded === idx ? styles.itemExpanded : ''}`}
              onClick={() => setExpanded(expanded === idx ? null : idx)}
            >
              <div className={styles.marker}>
                <div className={styles.dot} />
                {idx < parsed.items.length - 1 && <div className={styles.line} />}
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

  // Era-grouped format
  const isAlternating = parsed.layout === 'alternating';
  let globalIdx = 0;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        {parsed.title ? (
          <>
            <span className={styles.headerLabel}>{parsed.title}</span>
            <span className={styles.headerCount}>{parsed.totalEvents} events</span>
          </>
        ) : (
          <>
            <span className={styles.headerLabel}>Timeline</span>
            <span className={styles.headerCount}>{parsed.totalEvents} events</span>
          </>
        )}
      </div>
      <div className={`${styles.eraTimeline} ${isAlternating ? styles.alternatingLayout : ''}`}>
        {isAlternating && <div className={styles.centerLine} />}
        {parsed.eras.map((era, eraIdx) => {
          const eraRgb = hexToRgb(era.color);
          return (
            <div key={eraIdx} className={styles.eraGroup}>
              <div
                className={styles.eraLabel}
                style={{
                  '--era-color': era.color,
                  '--era-rgb': eraRgb,
                }}
              >
                <span className={styles.eraName}>{era.name}</span>
              </div>
              <div className={styles.eraEvents}>
                {era.events.map((event, eventIdx) => {
                  const idx = globalIdx++;
                  const isRight = isAlternating && idx % 2 === 1;
                  const isLast = eraIdx === parsed.eras.length - 1 && eventIdx === era.events.length - 1;
                  const expandKey = `${eraIdx}-${eventIdx}`;

                  return (
                    <div
                      key={eventIdx}
                      className={`${styles.eraItem} ${isRight ? styles.eraItemRight : ''} ${expanded === expandKey ? styles.itemExpanded : ''}`}
                      onClick={() => setExpanded(expanded === expandKey ? null : expandKey)}
                      style={{
                        '--era-color': era.color,
                        '--era-rgb': eraRgb,
                      }}
                    >
                      <div className={styles.eraMarker}>
                        <div
                          className={styles.eraDot}
                          style={{ borderColor: era.color }}
                        />
                        {!isLast && (
                          <div
                            className={styles.eraLine}
                            style={{ background: era.color, opacity: 0.3 }}
                          />
                        )}
                      </div>
                      <div className={styles.eraCard}>
                        <span className={styles.eraDate} style={{ color: era.color }}>
                          {event.date || event.label}
                        </span>
                        <span className={styles.eraTitle}>{event.title}</span>
                        {event.description && (
                          <span
                            className={`${styles.eraDescription} ${expanded === expandKey ? styles.descriptionVisible : ''}`}
                          >
                            {event.description}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
