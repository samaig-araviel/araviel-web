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
import { ChevronDownIcon, CheckIcon } from '../Icons';
import styles from './ModalityBar.module.css';

const MODALITIES = [
  { id: 'text', label: 'Text', icon: '✦', enabled: true },
  { id: 'image', label: 'Image', icon: '◐', enabled: true },
  { id: 'voice', label: 'Voice', icon: '♪', enabled: false, comingSoon: true },
  { id: 'video', label: 'Video', icon: '▶', enabled: false, comingSoon: true },
];

export default function ModalityBar({ compact = false }) {
  const dispatch = useDispatch();
  const modality = useSelector(selectSelectedModality);
  const quality = useSelector(selectImageQuality);
  const creditBalance = useSelector(selectCreditBalance);

  const [isOpen, setIsOpen] = useState(false);
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
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleTriggerClick = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropdownDir(spaceBelow < 260 ? 'up' : 'down');
    }
    setIsOpen(!isOpen);
  };

  const handleSelectModality = (id) => {
    dispatch(setSelectedModality(id));
    if (id !== 'image') {
      setIsOpen(false);
    }
  };

  const handleSelectQuality = (value) => {
    dispatch(setImageQuality(value));
  };

  return (
    <div className={styles.wrapper}>
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''} ${
          isImage ? styles.triggerImage : ''
        } ${compact ? styles.compact : ''}`}
        onClick={handleTriggerClick}
        aria-label="Select output type"
        aria-expanded={isOpen}
      >
        <span className={styles.triggerIcon}>{currentModality.icon}</span>
        <span className={styles.triggerLabel}>
          {currentModality.label}
          {isImage && selectedQualityOption ? ` · ${selectedQualityOption.label}` : ''}
        </span>
        {isImage && creditBalance && (
          <span className={styles.creditPill}>{creditBalance.combined}cr</span>
        )}
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
          <div className={styles.sectionLabel}>Output</div>

          {MODALITIES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`${styles.option} ${modality === m.id ? styles.optionSelected : ''} ${
                !m.enabled ? styles.optionDisabled : ''
              }`}
              onClick={() => m.enabled && handleSelectModality(m.id)}
              disabled={!m.enabled}
            >
              <span
                className={`${styles.optionIcon} ${
                  modality === m.id ? styles.optionIconActive : ''
                }`}
              >
                {m.icon}
              </span>
              <span className={styles.optionContent}>
                <span className={styles.optionName}>{m.label}</span>
                {m.comingSoon && <span className={styles.comingSoon}>Soon</span>}
              </span>
              {modality === m.id && m.enabled && (
                <span className={styles.checkmark}>
                  <CheckIcon />
                </span>
              )}
            </button>
          ))}

          {isImage && (
            <>
              <div className={styles.divider} />
              <div className={styles.sectionLabel}>Quality</div>
              <div className={styles.qualityGrid}>
                {IMAGE_QUALITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.qualityOption} ${
                      quality === opt.value ? styles.qualityOptionActive : ''
                    }`}
                    onClick={() => handleSelectQuality(opt.value)}
                  >
                    <span className={styles.qualityLabel}>{opt.label}</span>
                    <span className={styles.qualityCost}>{opt.cost}cr</span>
                  </button>
                ))}
              </div>
              {insufficientCredits && <div className={styles.warning}>Insufficient credits</div>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
