import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectSelectedModality,
  selectImageQuality,
  selectCreditBalance,
  setSelectedModality,
  setImageQuality,
} from '../../store/slices/chatSlice';
import { IMAGE_QUALITY_OPTIONS } from '../../config/credits';
import { ChevronDownIcon, ChevronLeftIcon, CheckIcon } from '../Icons';
import styles from './ModalityBar.module.css';

const MODALITIES = [
  { id: 'text', label: 'Text', enabled: true },
  { id: 'image', label: 'Image', enabled: true },
  { id: 'voice', label: 'Voice', enabled: false, comingSoon: true },
  { id: 'video', label: 'Video', enabled: false, comingSoon: true },
];

export default function ModalityBar({ compact = false }) {
  const dispatch = useDispatch();
  const modality = useSelector(selectSelectedModality);
  const quality = useSelector(selectImageQuality);
  const creditBalance = useSelector(selectCreditBalance);

  const [isOpen, setIsOpen] = useState(false);
  const [showQuality, setShowQuality] = useState(false);
  const [dropdownDir, setDropdownDir] = useState('up');
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  const isImage = modality === 'image';
  const currentModality = MODALITIES.find((m) => m.id === modality) || MODALITIES[0];
  const selectedQualityOption = IMAGE_QUALITY_OPTIONS.find((q) => q.value === quality);
  const insufficientCredits =
    isImage && creditBalance && creditBalance.combined < (selectedQualityOption?.cost ?? 1);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
        setShowQuality(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showQuality) {
          setShowQuality(false);
        } else {
          setIsOpen(false);
        }
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, showQuality]);

  const handleTriggerClick = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropdownDir(spaceBelow < 260 ? 'up' : 'down');
    }
    setIsOpen(!isOpen);
    setShowQuality(false);
  };

  const handleSelectModality = (id) => {
    dispatch(setSelectedModality(id));
    if (id === 'image') {
      // Show quality sub-view
      setShowQuality(true);
    } else {
      setIsOpen(false);
      setShowQuality(false);
    }
  };

  const handleSelectQuality = (value) => {
    dispatch(setImageQuality(value));
    setIsOpen(false);
    setShowQuality(false);
  };

  // Only show trigger when not in default text mode, or always show it
  // Based on the user's request: Text is default, so show the label
  const triggerLabel = isImage
    ? `Image · ${selectedQualityOption?.label || 'Standard'}`
    : currentModality.label;

  return (
    <div className={styles.wrapper}>
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''} ${
          compact ? styles.compact : ''
        }`}
        onClick={handleTriggerClick}
        aria-label="Select output type"
        aria-expanded={isOpen}
      >
        <span className={styles.triggerLabel}>{triggerLabel}</span>
        <span className={`${styles.triggerChevron} ${isOpen ? styles.triggerChevronOpen : ''}`}>
          <ChevronDownIcon />
        </span>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={`${styles.dropdown} ${
            dropdownDir === 'up' ? styles.dropdownUp : styles.dropdownDown
          }`}
        >
          {showQuality ? (
            /* Quality sub-view */
            <>
              <div className={styles.subHeader}>
                <button
                  className={styles.backButton}
                  onClick={() => setShowQuality(false)}
                  type="button"
                >
                  <ChevronLeftIcon />
                  <span>Quality</span>
                </button>
              </div>
              {IMAGE_QUALITY_OPTIONS.map((opt) => {
                const isActive = quality === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.option} ${isActive ? styles.optionSelected : ''}`}
                    onClick={() => handleSelectQuality(opt.value)}
                  >
                    <div className={styles.optionContent}>
                      <span className={styles.optionName}>{opt.label}</span>
                      <span className={styles.optionTagline}>
                        {opt.cost} credit{opt.cost > 1 ? 's' : ''} per image
                      </span>
                    </div>
                    {isActive && (
                      <span className={styles.checkmark}>
                        <CheckIcon />
                      </span>
                    )}
                  </button>
                );
              })}
              {insufficientCredits && <div className={styles.warning}>Insufficient credits</div>}
            </>
          ) : (
            /* Main modality view */
            <>
              {MODALITIES.map((m) => {
                const isActive = modality === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    className={`${styles.option} ${isActive ? styles.optionSelected : ''} ${
                      !m.enabled ? styles.optionDisabled : ''
                    }`}
                    onClick={() => m.enabled && handleSelectModality(m.id)}
                    disabled={!m.enabled}
                  >
                    <div className={styles.optionContent}>
                      <span className={styles.optionName}>
                        {m.label}
                        {m.comingSoon && <span className={styles.comingSoon}>Soon</span>}
                      </span>
                    </div>
                    {isActive && m.enabled && (
                      <span className={styles.checkmark}>
                        <CheckIcon />
                      </span>
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
