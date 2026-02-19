import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectEffectiveTheme } from '../../store/slices/themeSlice';
import { getProviderLogo } from '../ProviderLogos';
import { PROVIDERS } from '../../data/models';
import styles from './ThinkingTimeline.module.css';

/**
 * Stage status: 'pending' | 'active' | 'complete'
 *
 * ThinkingTimeline shows 3 stages:
 *  1. Routing to optimal model...
 *  2. Thinking with [Model Name]...
 *  3. Writing response...
 */
export default function ThinkingTimeline({ stages, modelName, provider, fading }) {
  const effectiveTheme = useSelector(selectEffectiveTheme);
  const isDark = effectiveTheme === 'dark';
  const [durations, setDurations] = useState({});
  const [stageTimers, setStageTimers] = useState({});

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

  const providerData = PROVIDERS[provider] || PROVIDERS.anthropic;
  const LogoComponent = getProviderLogo(provider);

  return (
    <div className={`${styles.timeline} ${fading ? styles.fading : ''}`}>
      {stages.map((stage, index) => {
        const isActive = stage.status === 'active';
        const isComplete = stage.status === 'complete';
        const isPending = stage.status === 'pending';

        return (
          <div
            key={index}
            className={`${styles.stage} ${isActive ? styles.active : ''} ${
              isComplete ? styles.complete : ''
            } ${isPending ? styles.pending : ''}`}
          >
            <div className={styles.stageIndicator}>
              {isComplete && (
                <svg
                  className={styles.checkIcon}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {isActive && <span className={styles.pulse} />}
              {isPending && <span className={styles.dot} />}
            </div>

            <div className={styles.stageContent}>
              <div className={styles.stageLabel}>
                {stage.showModel && modelName ? (
                  <span className={styles.modelLabel}>
                    <span
                      className={styles.modelBadge}
                      style={{
                        backgroundColor: isDark ? providerData.accentBgDark : providerData.accentBg,
                        color: isDark
                          ? providerData.accentTextDark || providerData.accentColor
                          : providerData.accentText,
                      }}
                    >
                      <LogoComponent size={13} />
                      {modelName}
                    </span>
                  </span>
                ) : null}
                <span className={isPending ? styles.mutedText : ''}>{stage.label}</span>
              </div>
              {isComplete && durations[index] && (
                <span className={styles.duration}>{durations[index]}s</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
