import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setCreditBalance } from '../../store/slices/chatSlice';
import { IMAGE_PACKS, PACK_EXPIRY_DAYS } from '../../config/credits';
import { buyPack } from '../../services/credits';
import styles from './BuyPacksModal.module.css';

const PACK_OPTIONS = Object.entries(IMAGE_PACKS).map(([key, val]) => ({
  id: key,
  ...val,
}));

export default function BuyPacksModal({ onClose }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleBuy = async (packId) => {
    setLoading(packId);
    setError(null);
    try {
      const result = await buyPack(packId);
      if (result.balance) {
        dispatch(setCreditBalance(result.balance));
      }
      const creditsAdded = result.credits || IMAGE_PACKS[packId]?.credits || 0;
      setSuccess(creditsAdded);
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err.message || 'Failed to add pack');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {success ? (
          <div className={styles.successState}>
            <div className={styles.successIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <span className={styles.successText}>{success} credits added!</span>
            <span className={styles.successSubtext}>Ready to create</span>
          </div>
        ) : (
          <>
            <div className={styles.header}>
              <h3>Get More Image Credits</h3>
              <button className={styles.closeButton} onClick={onClose}>
                &times;
              </button>
            </div>

            <div className={styles.packs}>
              {PACK_OPTIONS.map((pack) => (
                <div key={pack.id} className={styles.pack}>
                  <div className={styles.packInfo}>
                    <span className={styles.packName}>{pack.label}</span>
                    <span className={styles.packCredits}>{pack.credits} credits</span>
                    <span className={styles.packExpiry}>Valid for {PACK_EXPIRY_DAYS} days</span>
                  </div>
                  <button
                    className={styles.buyButton}
                    onClick={() => handleBuy(pack.id)}
                    disabled={loading !== null}
                  >
                    {loading === pack.id ? 'Adding...' : 'Add'}
                  </button>
                </div>
              ))}
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <p className={styles.note}>
              Credits are added instantly. Payment integration coming soon.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
