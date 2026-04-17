import { useSelector } from 'react-redux';
import { selectCreditBalance } from '../../store/slices/chatSlice';
import { PlusIcon } from '../Icons';
import styles from './CreditBalance.module.css';

function formatResetTime(isoDate) {
  const days = Math.max(0, Math.ceil((new Date(isoDate) - new Date()) / (1000 * 60 * 60 * 24)));
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
}

const TIER_LABELS = {
  free: 'Free',
  lite: 'Lite',
  pro: 'Pro',
  ultra: 'Ultra',
  apex: 'Apex',
};

export default function CreditBalance({ onBuyCredits, tier = 'free' }) {
  const balance = useSelector(selectCreditBalance);

  if (!balance) return null;

  const hasPackCredits = balance.packs.remaining > 0;
  const monthlyDepleted = balance.monthly.remaining === 0;
  const outOfCredits = balance.combined <= 0;
  const resetLabel = balance.cycleResetsAt ? formatResetTime(balance.cycleResetsAt) : null;
  const tierKey = TIER_LABELS[tier] ? tier : 'free';
  const isPaidTier = tierKey !== 'free';
  const actionLabel = outOfCredits ? 'Get credits' : 'Add more';

  return (
    <div className={styles.root}>
      <div className={`${styles.card} ${outOfCredits ? styles.cardUrgent : ''}`}>
        <div className={styles.primaryRow}>
          <span className={styles.pulseDot} aria-hidden="true" />
          <span className={`${styles.available} ${outOfCredits ? styles.availableUrgent : ''}`}>
            {balance.combined}
          </span>
          <span className={styles.availableLabel}>credit{balance.combined !== 1 ? 's' : ''}</span>
          {hasPackCredits && (
            <span className={styles.bonus} title={`${balance.packs.remaining} bonus credits`}>
              +{balance.packs.remaining}
            </span>
          )}
          <span className={styles.spacer} aria-hidden="true" />
          <span
            className={`${styles.tierBadge} ${isPaidTier ? styles.tierBadgePaid : ''}`}
            aria-label={`${TIER_LABELS[tierKey]} tier`}
          >
            {TIER_LABELS[tierKey]}
          </span>
        </div>
        <div className={styles.secondaryRow}>
          <span className={monthlyDepleted ? styles.secondaryUrgent : ''}>
            {balance.monthly.remaining} of {balance.monthly.total} monthly
          </span>
          {resetLabel && (
            <>
              <span className={styles.secondaryDivider} aria-hidden="true">
                ·
              </span>
              <span className={monthlyDepleted ? styles.secondaryUrgent : ''}>
                resets {resetLabel}
              </span>
            </>
          )}
        </div>
      </div>
      {onBuyCredits && (
        <button
          type="button"
          className={`${styles.addButton} ${outOfCredits ? styles.addButtonUrgent : ''}`}
          onClick={onBuyCredits}
          aria-label={actionLabel}
          title={actionLabel}
        >
          <PlusIcon />
        </button>
      )}
    </div>
  );
}
