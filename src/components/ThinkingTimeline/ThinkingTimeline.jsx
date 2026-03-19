import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectEffectiveTheme } from '../../store/slices/themeSlice';
import { getProviderLogo } from '../getProviderLogo';
import { PROVIDERS } from '../../data/models';
import styles from './ThinkingTimeline.module.css';

/**
 * Stage status: 'pending' | 'active' | 'complete'
 *
 * ThinkingTimeline shows 3 stages during streaming:
 *  1. Routing to optimal model...
 *  2. Thinking with [Model Name]...
 *  3. Generating response...
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
        const isLast = index === stages.length - 1;

        return (
          <div
            key={index}
            className={`${styles.stage} ${isActive ? styles.active : ''} ${
              isComplete ? styles.complete : ''
            } ${isPending ? styles.pending : ''}`}
          >
            <div className={styles.dotLine}>
              {isComplete && <span className={styles.dotComplete} />}
              {isActive && <span className={styles.pulse} />}
              {isPending && <span className={styles.dot} />}
              {!isLast && <span className={styles.verticalLine} />}
            </div>

            <div className={styles.stageContent}>
              <div className={styles.stageLabel}>
                <span className={isPending ? styles.mutedText : ''}>{stage.label}</span>
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
                      <LogoComponent size={12} />
                      {modelName}
                    </span>
                  </span>
                ) : null}
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
