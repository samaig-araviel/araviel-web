import { useMemo } from 'react';
import styles from './TimelineBlock.module.css';

/**
 * Timeline block — renders a vertical timeline from a JSON spec.
 *
 * Supports two formats:
 *
 * 1. Flat array:
 *    [{ "date": "2024", "title": "Event", "description": "Details" }, ...]
 *
 * 2. Era-grouped object:
 *    {
 *      "title": "History of X",
 *      "style": "editorial" | "cards" | "compact",
 *      "eras": [
 *        {
 *          "name": "Era Name",
 *          "color": "#8B5CF6",
 *          "events": [{ "date": "...", "title": "...", "description": "...", "sublabel": "..." }]
 *        }
 *      ]
 *    }
 *
 * Styles:
 *   editorial — Clean left-aligned flowing text with colored dots and era pills. Default.
 *   cards     — Center-line alternating cards on desktop with subtle backgrounds.
 *   compact   — Dense single-column with tight spacing and sublabel metadata.
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

const VALID_STYLES = ['editorial', 'cards', 'compact'];

export default function TimelineBlock({ spec, isStreaming = false }) {
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
        const style = VALID_STYLES.includes(data.style) ? data.style : 'editorial';

        return { type: 'eras', title: data.title || null, style, eras, totalEvents };
      }

      // Flat array format
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
        <div className={styles.root}>
          <div className={styles.streamingPlaceholder}>
            <div className={styles.placeholderDot} />
            <span className={styles.placeholderText}>Building timeline...</span>
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

  // Flat format — clean minimal layout
  if (parsed.type === 'flat') {
    return (
      <div className={styles.root}>
        <div className={styles.flatTimeline}>
          {parsed.items.map((item, idx) => (
            <div key={idx} className={styles.flatItem}>
              <div className={styles.flatMarker}>
                <div className={styles.flatDot} />
                {idx < parsed.items.length - 1 && <div className={styles.flatLine} />}
              </div>
              <div className={styles.flatContent}>
                <span className={styles.flatDate}>{item.date || item.label}</span>
                <span className={styles.flatTitle}>{item.title}</span>
                {item.description && (
                  <span className={styles.flatDescription}>{item.description}</span>
                )}
                {item.sublabel && (
                  <span className={styles.sublabel}>{item.sublabel}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Era-grouped — route to style-specific renderer
  const { style } = parsed;

  if (style === 'cards') return renderCardsStyle(parsed);
  if (style === 'compact') return renderCompactStyle(parsed);
  return renderEditorialStyle(parsed);
}

/* ── Editorial style ─────────────────────────────────────────────── */

function renderEditorialStyle(parsed) {
  return (
    <div className={styles.root}>
      {parsed.title && <div className={styles.timelineTitle}>{parsed.title}</div>}
      <div className={styles.editorialTimeline}>
        {parsed.eras.map((era, eraIdx) => {
          const eraRgb = hexToRgb(era.color);
          const isLastEra = eraIdx === parsed.eras.length - 1;
          return (
            <div key={eraIdx} className={styles.editorialEra}>
              <div className={styles.editorialEraHeader}>
                <span className={styles.editorialEraPill} style={{ color: era.color }}>
                  {era.name}
                </span>
              </div>
              {era.events.map((event, eventIdx) => {
                const isLastEvent = isLastEra && eventIdx === era.events.length - 1;
                return (
                  <div key={eventIdx} className={styles.editorialItem}>
                    <div className={styles.editorialMarker}>
                      <div
                        className={styles.editorialDot}
                        style={{ background: era.color }}
                      />
                      {!isLastEvent && (
                        <div
                          className={styles.editorialLine}
                          style={{ background: `rgba(${eraRgb}, 0.2)` }}
                        />
                      )}
                    </div>
                    <div className={styles.editorialContent}>
                      <span className={styles.editorialDate} style={{ color: era.color }}>
                        {event.date || event.label}
                      </span>
                      <span className={styles.editorialEventTitle}>{event.title}</span>
                      {event.description && (
                        <span className={styles.editorialDescription}>{event.description}</span>
                      )}
                      {event.sublabel && (
                        <span className={styles.sublabel}>{event.sublabel}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Cards style ─────────────────────────────────────────────────── */

function renderCardsStyle(parsed) {
  let globalIdx = 0;

  return (
    <div className={styles.root}>
      {parsed.title && <div className={styles.timelineTitle}>{parsed.title}</div>}
      <div className={styles.cardsTimeline}>
        <div className={styles.cardsCenterLine} />
        {parsed.eras.map((era, eraIdx) => {
          const eraRgb = hexToRgb(era.color);
          const isLastEra = eraIdx === parsed.eras.length - 1;
          return (
            <div key={eraIdx} className={styles.cardsEra}>
              <div className={styles.cardsEraLabel}>
                <span className={styles.cardsEraPill} style={{ color: era.color }}>
                  {era.name}
                </span>
              </div>
              <div className={styles.cardsEvents}>
                {era.events.map((event, eventIdx) => {
                  const idx = globalIdx++;
                  const isRight = idx % 2 === 1;
                  const isLastEvent = isLastEra && eventIdx === era.events.length - 1;

                  return (
                    <div
                      key={eventIdx}
                      className={`${styles.cardsItem} ${isRight ? styles.cardsItemRight : ''}`}
                      style={{ '--era-color': era.color, '--era-rgb': eraRgb }}
                    >
                      <div className={styles.cardsMarker}>
                        <div
                          className={styles.cardsDot}
                          style={{ background: era.color }}
                        />
                        {!isLastEvent && (
                          <div
                            className={styles.cardsLine}
                            style={{ background: `rgba(${eraRgb}, 0.2)` }}
                          />
                        )}
                      </div>
                      <div className={styles.cardsCard} style={{ '--era-rgb': eraRgb }}>
                        <span className={styles.cardsDate} style={{ color: era.color }}>
                          {event.date || event.label}
                        </span>
                        <span className={styles.cardsCardTitle}>{event.title}</span>
                        {event.description && (
                          <span className={styles.cardsDescription}>{event.description}</span>
                        )}
                        {event.sublabel && (
                          <span className={styles.sublabel}>{event.sublabel}</span>
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

/* ── Compact style ───────────────────────────────────────────────── */

function renderCompactStyle(parsed) {
  return (
    <div className={styles.root}>
      {parsed.title && <div className={styles.timelineTitle}>{parsed.title}</div>}
      <div className={styles.compactTimeline}>
        {parsed.eras.map((era, eraIdx) => {
          const eraRgb = hexToRgb(era.color);
          const isLastEra = eraIdx === parsed.eras.length - 1;
          return (
            <div key={eraIdx} className={styles.compactEra}>
              <div className={styles.compactEraHeader}>
                <span className={styles.compactEraPill} style={{ color: era.color }}>
                  {era.name}
                </span>
              </div>
              {era.events.map((event, eventIdx) => {
                const isLastEvent = isLastEra && eventIdx === era.events.length - 1;
                return (
                  <div key={eventIdx} className={styles.compactItem}>
                    <div className={styles.compactMarker}>
                      <div
                        className={styles.compactDot}
                        style={{ background: era.color }}
                      />
                      {!isLastEvent && (
                        <div
                          className={styles.compactLine}
                          style={{ background: `rgba(${eraRgb}, 0.15)` }}
                        />
                      )}
                    </div>
                    <div className={styles.compactContent}>
                      {event.sublabel && (
                        <span className={styles.compactSublabel}>{event.sublabel}</span>
                      )}
                      <span className={styles.compactTitle}>{event.title}</span>
                      {event.description && (
                        <span className={styles.compactDescription}>{event.description}</span>
                      )}
                      <span className={styles.compactDate} style={{ color: era.color }}>
                        {event.date || event.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
