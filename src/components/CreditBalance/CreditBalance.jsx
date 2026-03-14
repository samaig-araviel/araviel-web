import { useSelector } from 'react-redux';
import { selectCreditBalance } from '../../store/slices/chatSlice';
import styles from './CreditBalance.module.css';

export default function CreditBalance({ onBuyCredits }) {
  const balance = useSelector(selectCreditBalance);

  if (!balance) return null;

  return (
    <div className={styles.container}>
      <div className={styles.breakdown}>
        <span className={styles.monthly}>
          {balance.monthly.remaining}/{balance.monthly.total} monthly
        </span>
        {balance.packs.remaining > 0 && (
          <>
            <span className={styles.separator}>&bull;</span>
            <span className={styles.packs}>{balance.packs.remaining} pack</span>
          </>
        )}
      </div>
      {balance.combined <= 0 && onBuyCredits && (
        <button className={styles.buyButton} onClick={onBuyCredits}>
          Get More Credits
        </button>
      )}
    </div>
  );
}
