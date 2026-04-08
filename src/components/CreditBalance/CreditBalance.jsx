import { useSelector } from 'react-redux';
import { selectCreditBalance } from '../../store/slices/chatSlice';
import styles from './CreditBalance.module.css';

function formatResetTime(isoDate) {
  const days = Math.max(0, Math.ceil((new Date(isoDate) - new Date()) / (1000 * 60 * 60 * 24)));
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
}

export default function CreditBalance({ onBuyCredits }) {
  const balance = useSelector(selectCreditBalance);

  if (!balance) return null;

  const hasPackCredits = balance.packs.remaining > 0;
  const monthlyDepleted = balance.monthly.remaining === 0;
  const resetLabel = balance.cycleResetsAt ? formatResetTime(balance.cycleResetsAt) : null;

  return (
    <div className={styles.container}>
      <div className={styles.balanceMain}>
        <span className={styles.available}>{balance.combined}</span>
        <span className={styles.availableLabel}>
          credit{balance.combined !== 1 ? 's' : ''} available
        </span>
      </div>
      <div className={styles.breakdown}>
        <span className={monthlyDepleted ? styles.monthlyDepleted : styles.monthly}>
          {monthlyDepleted
            ? `0 of ${balance.monthly.total} monthly left`
            : `${balance.monthly.remaining} of ${balance.monthly.total} monthly left`}
        </span>
        {resetLabel && (
          <>
            <span className={styles.separator}>&bull;</span>
            <span className={monthlyDepleted ? styles.resetInfoUrgent : styles.resetInfo}>
              resets {resetLabel}
            </span>
          </>
        )}
        {hasPackCredits && (
          <>
            <span className={styles.separator}>&bull;</span>
            <span className={styles.packs}>
              {balance.packs.remaining} bonus
            </span>
          </>
        )}
      </div>
      {onBuyCredits && (
        <button
          className={`${styles.buyButton} ${balance.combined <= 0 ? styles.buyButtonUrgent : ''}`}
          onClick={onBuyCredits}
        >
          {balance.combined <= 0 ? 'Get Credits' : 'Add More'}
        </button>
      )}
    </div>
  );
}
