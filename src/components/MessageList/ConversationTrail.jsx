import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './ConversationTrail.module.css';

const MIN_MARKERS_TO_SHOW = 1;
const ACTIVE_ANCHOR_RATIO = 0.32;
const FLASH_DURATION_MS = 1100;
const TOP_INSET_PX = 96;
const BOTTOM_INSET_PX = 120;
const RIGHT_INSET_PX = 18;

function formatTime(value) {
  if (!value) return null;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return null;
  }
}

function buildPreview(content) {
  if (!content || typeof content !== 'string') return '';
  return content.replace(/\s+/g, ' ').trim();
}

export default function ConversationTrail({ messages, scrollContainerRef, hidden = false }) {
  const userPrompts = useMemo(
    () =>
      messages
        .map((msg, originalIndex) =>
          msg.role === 'user'
            ? {
                id: msg.id ?? `idx-${originalIndex}`,
                preview: buildPreview(msg.content),
                createdAt: msg.createdAt,
              }
            : null
        )
        .filter(Boolean),
    [messages]
  );

  const [markers, setMarkers] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [containerBounds, setContainerBounds] = useState(null);

  const rafRef = useRef(null);
  const flashTimeoutRef = useRef(null);

  const shouldRender = !hidden && userPrompts.length >= MIN_MARKERS_TO_SHOW;

  const recomputeMarkers = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      setMarkers([]);
      return;
    }

    const nodes = container.querySelectorAll('[data-trail-anchor="true"]');
    const scrollableHeight = container.scrollHeight;
    if (scrollableHeight <= 0 || nodes.length === 0) {
      setMarkers([]);
      return;
    }

    const next = [];
    for (let i = 0; i < nodes.length; i += 1) {
      const element = nodes[i];
      const prompt = userPrompts[i];
      if (!prompt) continue;
      const offsetTop = element.offsetTop;
      const ratio = Math.min(1, Math.max(0, offsetTop / scrollableHeight));
      next.push({
        id: prompt.id,
        element,
        offsetTop,
        ratio,
        preview: prompt.preview,
        createdAt: prompt.createdAt,
      });
    }
    setMarkers(next);
  }, [scrollContainerRef, userPrompts]);

  useEffect(() => {
    if (!shouldRender) {
      setMarkers([]);
      setContainerBounds(null);
      return undefined;
    }
    const container = scrollContainerRef.current;
    if (!container) return undefined;

    const updateBounds = () => {
      const rect = container.getBoundingClientRect();
      setContainerBounds({ top: rect.top, bottom: rect.bottom, right: rect.right });
    };

    updateBounds();
    recomputeMarkers();

    const resizeObserver = new ResizeObserver(() => {
      updateBounds();
      recomputeMarkers();
    });
    resizeObserver.observe(container);
    container.querySelectorAll('[data-trail-anchor="true"]').forEach((node) => {
      resizeObserver.observe(node);
    });

    window.addEventListener('resize', updateBounds);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateBounds);
    };
  }, [shouldRender, recomputeMarkers, scrollContainerRef]);

  useEffect(() => {
    if (!shouldRender || markers.length === 0) return undefined;
    const container = scrollContainerRef.current;
    if (!container) return undefined;

    const updateActive = () => {
      rafRef.current = null;
      const anchor = container.scrollTop + container.clientHeight * ACTIVE_ANCHOR_RATIO;
      let next = 0;
      for (let i = 0; i < markers.length; i += 1) {
        if (markers[i].offsetTop <= anchor) next = i;
        else break;
      }
      setActiveIndex(next);
    };

    const handleScroll = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(updateActive);
    };

    updateActive();
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [shouldRender, markers, scrollContainerRef]);

  useEffect(
    () => () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    },
    []
  );

  const handleJump = useCallback(
    (index) => {
      const marker = markers[index];
      if (!marker || !marker.element) return;
      marker.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      marker.element.classList.add(styles.flash);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = setTimeout(() => {
        marker.element.classList.remove(styles.flash);
        flashTimeoutRef.current = null;
      }, FLASH_DURATION_MS);
    },
    [markers]
  );

  if (!shouldRender || markers.length === 0 || !containerBounds) return null;

  const railTop = containerBounds.top + TOP_INSET_PX;
  const railHeight = Math.max(
    0,
    containerBounds.bottom - containerBounds.top - TOP_INSET_PX - BOTTOM_INSET_PX
  );
  const railRight = Math.max(
    RIGHT_INSET_PX,
    window.innerWidth - containerBounds.right + RIGHT_INSET_PX
  );
  const progressPercent = markers.length <= 1 ? 0 : (markers[activeIndex]?.ratio ?? 0) * 100;

  return (
    <nav
      className={styles.trail}
      style={{ top: `${railTop}px`, height: `${railHeight}px`, right: `${railRight}px` }}
      aria-label="Conversation navigation"
    >
      <div className={styles.rail}>
        <div className={styles.railLine} />
        <div className={styles.railProgress} style={{ '--progress': `${progressPercent}%` }} />
        {markers.map((marker, index) => {
          const isActive = index === activeIndex;
          const time = formatTime(marker.createdAt);
          return (
            <button
              key={marker.id}
              type="button"
              className={`${styles.marker} ${isActive ? styles.markerActive : ''}`}
              style={{ top: `${marker.ratio * 100}%` }}
              onClick={() => handleJump(index)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onFocus={() => setHoveredIndex(index)}
              onBlur={() => setHoveredIndex(null)}
              aria-label={`Jump to prompt ${index + 1}${
                marker.preview ? `: ${marker.preview.slice(0, 60)}` : ''
              }`}
              aria-current={isActive ? 'true' : undefined}
            >
              <span className={styles.markerDot} />
              {hoveredIndex === index && marker.preview && (
                <div className={styles.tooltip} role="tooltip">
                  <span className={styles.tooltipPreview}>{marker.preview}</span>
                  {time && <span className={styles.tooltipTime}>{time}</span>}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
