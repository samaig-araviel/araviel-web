import { IMAGE_PACKS, PACK_EXPIRY_DAYS } from '../../config/credits';
import styles from './ConfirmPackModal.module.css';

export default function ConfirmPackModal({ packType, onCancel, onContinue, isLoading }) {
  const pack = IMAGE_PACKS[packType];

  if (!pack) return null;

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Get Credits</h2>
          <button className={styles.closeButton} onClick={onCancel}>
            &times;
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.packDisplay}>
            <div className={styles.creditAmount}>{pack.credits}</div>
            <div className={styles.creditLabel}>Credits</div>
          </div>

          <div className={styles.details}>
            <h3 className={styles.packName}>{pack.label}</h3>
            <p className={styles.packDescription}>
              Use these credits to generate images at any quality level.
            </p>

            <div className={styles.features}>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>⏱</span>
                <span className={styles.featureText}>Valid for {PACK_EXPIRY_DAYS} days</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>🎨</span>
                <span className={styles.featureText}>Use on any quality level</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>∞</span>
                <span className={styles.featureText}>Stack with monthly allowance</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelButton} onClick={onCancel} disabled={isLoading}>
            Cancel
          </button>
          <button className={styles.continueButton} onClick={onContinue} disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
