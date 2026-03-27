import { useState } from 'react';
import { IMAGE_PACKS, PACK_EXPIRY_DAYS } from '../../config/credits';
import { createPackCheckoutSession } from '../../services/subscription';
import ConfirmPackModal from '../ConfirmPackModal/ConfirmPackModal';
import styles from './BuyPacksModal.module.css';

const PACK_OPTIONS = Object.entries(IMAGE_PACKS).map(([key, val]) => ({
  id: key,
  ...val,
}));

export default function BuyPacksModal({ onClose }) {
  const [selectedPack, setSelectedPack] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePackSelect = (packId) => {
    setSelectedPack(packId);
    setError(null);
  };

  const handleContinue = async () => {
    if (!selectedPack) return;
    setLoading(true);
    setError(null);
    try {
      const { url } = await createPackCheckoutSession(selectedPack);
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      setError(err.message || 'Failed to create checkout');
      setLoading(false);
    }
  };

  // Show confirmation modal if a pack is selected
  if (selectedPack) {
    return (
      <ConfirmPackModal
        packType={selectedPack}
        onCancel={() => setSelectedPack(null)}
        onContinue={handleContinue}
        isLoading={loading}
      />
    );
  }

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
                onClick={() => handlePackSelect(pack.id)}
                disabled={loading}
              >
                Add credits
              </button>
            </div>
          ))}
        </div>

        {error && <div className={styles.error}>{error}</div>}
      </div>
    </div>
  );
}
