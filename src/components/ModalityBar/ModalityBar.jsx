import { useSelector, useDispatch } from 'react-redux';
import {
  selectSelectedModality,
  selectImageQuality,
  selectCreditBalance,
  setSelectedModality,
  setImageQuality,
} from '../../store/slices/chatSlice';
import { IMAGE_QUALITY_OPTIONS } from '../../config/credits';
import styles from './ModalityBar.module.css';

export default function ModalityBar({ compact = false }) {
  const dispatch = useDispatch();
  const modality = useSelector(selectSelectedModality);
  const quality = useSelector(selectImageQuality);
  const creditBalance = useSelector(selectCreditBalance);

  const selectedQualityOption = IMAGE_QUALITY_OPTIONS.find((q) => q.value === quality);
  const isImage = modality === 'image';

  return (
    <div className={`${styles.bar} ${compact ? styles.compact : ''}`}>
      <div className={styles.chips}>
        <button
          className={`${styles.chip} ${!isImage ? styles.active : ''}`}
          onClick={() => dispatch(setSelectedModality('text'))}
        >
          Text
        </button>
        <button
          className={`${styles.chip} ${isImage ? styles.active : ''}`}
          onClick={() => dispatch(setSelectedModality('image'))}
        >
          Image
        </button>
      </div>

      {isImage && (
        <div className={styles.qualitySection}>
          <select
            className={styles.qualitySelect}
            value={quality}
            onChange={(e) => dispatch(setImageQuality(e.target.value))}
          >
            {IMAGE_QUALITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} ({opt.cost}cr)
              </option>
            ))}
          </select>

          {creditBalance && (
            <span className={styles.creditBadge}>
              {creditBalance.combined}cr
            </span>
          )}
        </div>
      )}

      {isImage && creditBalance && creditBalance.combined < (selectedQualityOption?.cost ?? 1) && (
        <span className={styles.warning}>Insufficient credits</span>
      )}
    </div>
  );
}
