import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './ConversationTrail.module.css';

const MIN_MARKERS_TO_SHOW = 3;
const ACTIVE_ANCHOR_RATIO = 0.32;
const AUTO_HIDE_DELAY_MS = 1500;
const EDGE_HOVER_ZONE_PX = 96;
const FLASH_DURATION_MS = 1100;

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
  const [visible, setVisible] = useState(false);

  const hideTimeoutRef = useRef(null);
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
      return undefined;
    }
    const container = scrollContainerRef.current;
    if (!container) return undefined;

    recomputeMarkers();

    const resizeObserver = new ResizeObserver(() => recomputeMarkers());
    resizeObserver.observe(container);
    const anchors = container.querySelectorAll('[data-trail-anchor="true"]');
    anchors.forEach((node) => resizeObserver.observe(node));

    return () => resizeObserver.disconnect();
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

  useEffect(() => {
    if (!shouldRender) {
      setVisible(false);
      return undefined;
    }
    const container = scrollContainerRef.current;
    if (!container) return undefined;

    const reveal = () => {
      setVisible(true);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = setTimeout(() => setVisible(false), AUTO_HIDE_DELAY_MS);
    };

    const handleMouseMove = (event) => {
      const rect = container.getBoundingClientRect();
      const distanceFromRight = rect.right - event.clientX;
      if (distanceFromRight >= 0 && distanceFromRight <= EDGE_HOVER_ZONE_PX) {
        reveal();
      }
    };

    container.addEventListener('scroll', reveal, { passive: true });
    container.addEventListener('mousemove', handleMouseMove);
    return () => {
      container.removeEventListener('scroll', reveal);
      container.removeEventListener('mousemove', handleMouseMove);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };
  }, [shouldRender, scrollContainerRef]);

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

  const handleMarkerEnter = useCallback((index) => {
    setHoveredIndex(index);
    setVisible(true);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const handleMarkerLeave = useCallback(() => {
    setHoveredIndex(null);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => setVisible(false), AUTO_HIDE_DELAY_MS);
  }, []);

  if (!shouldRender || markers.length === 0) return null;

  const progressPercent = markers.length <= 1 ? 0 : (markers[activeIndex]?.ratio ?? 0) * 100;

  return (
    <div className={styles.trailViewport} aria-hidden={!visible}>
      <nav
        className={`${styles.trail} ${visible ? styles.trailVisible : ''}`}
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
                onMouseEnter={() => handleMarkerEnter(index)}
                onMouseLeave={handleMarkerLeave}
                onFocus={() => handleMarkerEnter(index)}
                onBlur={handleMarkerLeave}
                aria-label={`Jump to prompt ${index + 1}${
                  marker.preview ? `: ${marker.preview.slice(0, 60)}` : ''
                }`}
                aria-current={isActive ? 'true' : undefined}
              >
                <span className={styles.markerStroke} />
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
    </div>
  );
}
