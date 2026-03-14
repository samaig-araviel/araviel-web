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

  const handleBuy = async (packId) => {
    setLoading(packId);
    setError(null);
    try {
      const result = await buyPack(packId);
      if (result.balance) {
        dispatch(setCreditBalance(result.balance));
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add pack');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
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
      </div>
    </div>
  );
}
