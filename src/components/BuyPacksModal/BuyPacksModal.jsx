import { useState } from 'react';
import { IMAGE_PACKS, PACK_EXPIRY_DAYS } from '../../config/credits';
import { createPackCheckoutSession } from '../../services/subscription';
import styles from './BuyPacksModal.module.css';

const PACK_OPTIONS = Object.entries(IMAGE_PACKS).map(([key, val]) => ({
  id: key,
  ...val,
}));

export default function BuyPacksModal({ onClose }) {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  const handleBuy = async (packId) => {
    setLoading(packId);
    setError(null);
    try {
      const { url } = await createPackCheckoutSession(packId);
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      setError(err.message || 'Failed to create checkout');
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
                {loading === pack.id ? 'Processing...' : 'Add credits'}
              </button>
            </div>
          ))}
        </div>

        {error && <div className={styles.error}>{error}</div>}
      </div>
    </div>
  );
}
