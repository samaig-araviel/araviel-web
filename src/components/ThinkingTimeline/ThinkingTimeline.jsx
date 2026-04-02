import { useEffect, useState, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectEffectiveTheme } from '../../store/slices/themeSlice';
import { getProviderLogo } from '../getProviderLogo';
import { ClockIcon, CheckCircleIcon } from '../Icons';
import { PROVIDERS } from '../../data/models';
import styles from './ThinkingTimeline.module.css';

/**
 * Stage status: 'pending' | 'active' | 'complete'
 *
 * ThinkingTimeline shows a Claude-inspired dashed-line timeline:
 *  1. Routing to optimal model...
 *  2. Thinking with [Model Name]...
 *  3. Finishing up...
 *
 * Auto-expands during streaming, auto-collapses when fading/complete.
 * Streams thinking content inline under the Thinking stage.
 */
export default function ThinkingTimeline({ stages, modelName, provider, fading, thinkingContent }) {
  const effectiveTheme = useSelector(selectEffectiveTheme);
  const isDark = effectiveTheme === 'dark';
  const [durations, setDurations] = useState({});
  const [stageTimers, setStageTimers] = useState({});
  const [isExpanded, setIsExpanded] = useState(true);
  const [totalElapsed, setTotalElapsed] = useState('0.0');
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef(null);

  // Live elapsed timer
  useEffect(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTotalElapsed(((Date.now() - startTimeRef.current) / 1000).toFixed(1));
    }, 100);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Track when each stage becomes active to calculate duration
  useEffect(() => {
    stages.forEach((stage, index) => {
      if (stage.status === 'active' && !stageTimers[index]) {
        setStageTimers((prev) => ({ ...prev, [index]: Date.now() }));
      }
      if (stage.status === 'complete' && stageTimers[index] && !durations[index]) {
        const elapsed = ((Date.now() - stageTimers[index]) / 1000).toFixed(1);
        setDurations((prev) => ({ ...prev, [index]: elapsed }));
      }
    });
  }, [stages, stageTimers, durations]);

  // Auto-collapse when fading
  useEffect(() => {
    if (fading) {
      const timeout = setTimeout(() => setIsExpanded(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [fading]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const providerData = PROVIDERS[provider] || PROVIDERS.anthropic;
  const LogoComponent = getProviderLogo(provider);

  // Determine summary label
  const allComplete = stages.every((s) => s.status === 'complete');
  const summaryLabel = allComplete
    ? `Thought for ${totalElapsed}s`
    : `Thinking for ${totalElapsed}s`;

  return (
    <div className={`${styles.timeline} ${fading ? styles.fading : ''}`}>
      {/* Collapsible toggle header */}
      <button className={styles.toggle} onClick={toggleExpanded} aria-expanded={isExpanded}>
        <span className={`${styles.toggleChevron} ${isExpanded ? styles.toggleChevronOpen : ''}`}>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </span>
        <span className={styles.toggleLabel}>{summaryLabel}</span>
      </button>

      {/* Expandable details — always in DOM, toggled via CSS */}
      <div className={`${styles.details} ${isExpanded ? styles.detailsOpen : ''}`}>
        <div className={styles.stagesContainer}>
          {stages.map((stage, index) => {
            const isActive = stage.status === 'active';
            const isComplete = stage.status === 'complete';
            const isPending = stage.status === 'pending';
            const isLast = index === stages.length - 1;
            const isThinkingStage = stage.showModel;

            return (
              <div key={index} className={styles.stage}>
                {/* Icon/dot + dashed line column */}
                <div className={styles.dotLineCol}>
                  {isComplete ? (
                    <span className={styles.stageIcon}>
                      <CheckCircleIcon size={12} />
                    </span>
                  ) : isActive && isThinkingStage ? (
                    <span className={`${styles.stageIcon} ${styles.stageIconActive}`}>
                      <ClockIcon size={12} />
                    </span>
                  ) : isActive ? (
                    <span className={styles.dotActive} />
                  ) : (
                    <span className={styles.dotPending} />
                  )}
                  {!isLast && <span className={styles.dashedLine} />}
                </div>

                {/* Stage content column */}
                <div
                  className={`${styles.stageContent} ${isPending ? styles.stagePending : ''} ${
                    isComplete ? styles.stageComplete : ''
                  }`}
                >
                  <div className={styles.stageRow}>
                    <span className={styles.stageLabel}>
                      {stage.label}
                      {isThinkingStage && modelName ? (
                        <span
                          className={styles.modelBadge}
                          style={{
                            backgroundColor: isDark
                              ? providerData.accentBgDark
                              : providerData.accentBg,
                            color: isDark
                              ? providerData.accentTextDark || providerData.accentColor
                              : providerData.accentText,
                          }}
                        >
                          <LogoComponent size={11} />
                          {modelName}
                        </span>
                      ) : null}
                    </span>
                    {isComplete && durations[index] && (
                      <span className={styles.duration}>{durations[index]}s</span>
                    )}
                    {isActive && (
                      <span className={styles.activeDuration}>
                        {((Date.now() - (stageTimers[index] || Date.now())) / 1000).toFixed(1)}s
                      </span>
                    )}
                  </div>

                  {/* Stream thinking content under the thinking stage */}
                  {isThinkingStage && (isActive || isComplete) && thinkingContent && (
                    <div className={styles.thinkingContentBlock}>
                      <div className={styles.thinkingContentText}>
                        {thinkingContent}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
