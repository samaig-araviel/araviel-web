import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setExtendedThinking,
  setDeepResearch,
  setGoogleThinking,
  selectExtendedThinking,
  selectDeepResearch,
  selectGoogleThinking,
} from '../../store/slices/chatSlice';
import { BrainIcon, BeakerIcon, CpuIcon, CloseIcon } from '../Icons';
import styles from './MainContent.module.css';

const MODES = [
  {
    key: 'extendedThinking',
    label: 'Extended Thinking',
    selector: selectExtendedThinking,
    action: setExtendedThinking,
    Icon: BrainIcon,
  },
  {
    key: 'deepResearch',
    label: 'Deep Research',
    selector: selectDeepResearch,
    action: setDeepResearch,
    Icon: BeakerIcon,
  },
  {
    key: 'googleThinking',
    label: 'Thinking Mode',
    selector: selectGoogleThinking,
    action: setGoogleThinking,
    Icon: CpuIcon,
  },
];

/**
 * Persistent indicator that appears in the input bar when a research mode is
 * active. Click the chip to reopen the research dropdown (e.g. to switch
 * modes); click the X to cancel the active mode entirely. Hidden when no mode
 * is active so the input bar stays minimal in the default state.
 */
function ResearchModeChip({ onReopen, disabled = false }) {
  const dispatch = useDispatch();

  // Read all three flags at the top level — calling useSelector inside .map
  // would violate the rules of hooks. The slice enforces mutual exclusivity,
  // so at most one of these is ever true.
  const extendedThinking = useSelector(selectExtendedThinking);
  const deepResearch = useSelector(selectDeepResearch);
  const googleThinking = useSelector(selectGoogleThinking);

  const activeMode = useMemo(() => {
    const flags = { extendedThinking, deepResearch, googleThinking };
    return MODES.find((m) => flags[m.key]) ?? null;
  }, [extendedThinking, deepResearch, googleThinking]);

  if (!activeMode) return null;

  const { label, Icon, action } = activeMode;

  const handleCancel = (event) => {
    // Stop the click from also reopening the dropdown via the chip handler.
    event.stopPropagation();
    if (disabled) return;
    dispatch(action(false));
  };

  const handleReopen = () => {
    if (disabled) return;
    onReopen?.();
  };

  return (
    <div className={styles.researchChip}>
      <button
        type="button"
        className={styles.researchChipButton}
        onClick={handleReopen}
        disabled={disabled}
        title={label}
        aria-label={`${label} active. Click to change research mode.`}
      >
        <Icon />
      </button>
      <button
        type="button"
        className={styles.researchChipCancel}
        onClick={handleCancel}
        disabled={disabled}
        title={`Turn off ${label}`}
        aria-label={`Turn off ${label}`}
      >
        <CloseIcon />
      </button>
    </div>
  );
}

export default ResearchModeChip;
