import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectSelectedModelId,
  selectExtendedThinking,
  selectDeepResearch,
  selectGoogleThinking,
  setSelectedModel,
  setExtendedThinking,
  setDeepResearch,
  setGoogleThinking,
} from '../../store/slices/chatSlice';
import { MODELS, PROVIDERS, PROVIDER_ORDER, getModelsByProvider } from '../../data/models';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  CheckIcon,
  BrainIcon,
  BeakerIcon,
  CpuIcon,
} from '../Icons';
import styles from './ModelSelector.module.css';

// The 3 featured models shown in the dropdown — one per major provider
const FEATURED_MODEL_IDS = [
  'claude-opus-4-5-20251101', // Anthropic flagship
  'gpt-5.2', // OpenAI flagship
  'gemini-2.5-pro', // Google flagship
];

const MODE_CONFIG = [
  {
    key: 'extendedThinking',
    label: 'Extended Thinking',
    description: 'Deep chain-of-thought reasoning',
    provider: 'anthropic',
    providerLabel: 'Claude',
    Icon: BrainIcon,
    selector: selectExtendedThinking,
    action: setExtendedThinking,
  },
  {
    key: 'deepResearch',
    label: 'Deep Research',
    description: 'Multi-step research & analysis',
    provider: 'openai',
    providerLabel: 'OpenAI',
    Icon: BeakerIcon,
    selector: selectDeepResearch,
    action: setDeepResearch,
  },
  {
    key: 'googleThinking',
    label: 'Thinking Mode',
    description: 'Enhanced reasoning with Gemini',
    provider: 'google',
    providerLabel: 'Gemini',
    Icon: CpuIcon,
    selector: selectGoogleThinking,
    action: setGoogleThinking,
  },
];

export default function ModelSelector() {
  const dispatch = useDispatch();
  const selectedModelId = useSelector(selectSelectedModelId);
  const extendedThinking = useSelector(selectExtendedThinking);
  const deepResearch = useSelector(selectDeepResearch);
  const googleThinking = useSelector(selectGoogleThinking);

  const modeValues = { extendedThinking, deepResearch, googleThinking };

  const [isOpen, setIsOpen] = useState(false);
  const [dropdownDir, setDropdownDir] = useState('down');
  const [showAllModels, setShowAllModels] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  const selectedModel = selectedModelId ? MODELS.find((m) => m.id === selectedModelId) : null;
  const selectedProvider = selectedModel ? selectedModel.provider : null;
  const isAutoMode = !selectedModelId;

  // For Auto mode tagline: check if there's a saved default model to show in subtitle
  const savedDefaultId = localStorage.getItem('araviel-default-model');
  const savedDefaultModel =
    isAutoMode && savedDefaultId ? MODELS.find((m) => m.id === savedDefaultId) : null;

  // Grouped models for "all models" view
  const modelsByProvider = getModelsByProvider();

  const featuredModels = FEATURED_MODEL_IDS.map((id) => MODELS.find((m) => m.id === id)).filter(
    Boolean
  );

  const anyModeActive = extendedThinking || deepResearch || googleThinking;
  const activeModeConfig = anyModeActive ? MODE_CONFIG.find((m) => modeValues[m.key]) : null;

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
        setShowAllModels(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showAllModels) {
          setShowAllModels(false);
        } else {
          setIsOpen(false);
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showAllModels]);

  // Calculate dropdown direction before opening
  const handleTriggerClick = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropdownDir(spaceBelow < 380 ? 'up' : 'down');
      setShowAllModels(false);
    }
    setIsOpen((prev) => !prev);
  };

  const handleModelSelect = (modelId) => {
    dispatch(setSelectedModel(modelId));
    setIsOpen(false);
  };

  const handleAutoSelect = () => {
    dispatch(setSelectedModel(null));
    setIsOpen(false);
  };

  const handleModeToggle = (modeConf) => {
    const currentValue = modeValues[modeConf.key];
    dispatch(modeConf.action(!currentValue));
  };

  const handleMoreModels = () => {
    setShowAllModels(true);
  };

  const handleBackToFeatured = () => {
    setShowAllModels(false);
  };

  // Trigger label and provider accent — only reflect the explicitly selected model, not the
  // saved default. When in Auto mode the trigger always shows "Auto".
  const displayProvider = !isAutoMode && selectedModel ? PROVIDERS[selectedModel.provider] : null;
  const triggerLabel = isAutoMode ? 'Auto' : (selectedModel?.name ?? 'Auto');

  return (
    <div className={styles.wrapper}>
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''} ${
          anyModeActive ? styles.triggerWithMode : ''
        }`}
        onClick={handleTriggerClick}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select AI model"
      >
        {displayProvider ? (
          <span
            className={styles.triggerProviderChip}
            style={{
              '--chip-bg': displayProvider.accentBg,
              '--chip-text': displayProvider.accentText,
              '--chip-bg-dark': displayProvider.accentBgDark,
            }}
          >
            {displayProvider.logoChar}
          </span>
        ) : (
          <span className={styles.autoGlyph}>✦</span>
        )}
        <span className={styles.triggerLabel}>{triggerLabel}</span>
        {activeModeConfig && (
          <span className={styles.modeTag} title={activeModeConfig.label}>
            <activeModeConfig.Icon />
          </span>
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
          role="listbox"
          aria-label="Model selection"
        >
          {showAllModels ? (
            /* ── All Models view ── */
            <>
              <div className={styles.allModelsHeader}>
                <button
                  className={styles.backButton}
                  onClick={handleBackToFeatured}
                  aria-label="Back to featured models"
                >
                  <ChevronLeftIcon />
                  <span>All Models</span>
                </button>
              </div>
              <div className={styles.allModelsList}>
                {PROVIDER_ORDER.map((providerId) => {
                  const provider = PROVIDERS[providerId];
                  const providerModels = modelsByProvider[providerId];
                  if (!providerModels || providerModels.length === 0) return null;
                  return (
                    <div key={providerId}>
                      <div className={styles.providerGroupLabel}>
                        <span
                          className={styles.providerGroupChip}
                          style={{
                            '--chip-bg': provider.accentBg,
                            '--chip-text': provider.accentText,
                            '--chip-bg-dark': provider.accentBgDark,
                          }}
                        >
                          {provider.logoChar}
                        </span>
                        {provider.name}
                      </div>
                      {providerModels.map((model) => {
                        const isSelected = selectedModelId === model.id;
                        return (
                          <button
                            key={model.id}
                            className={`${styles.modelOption} ${isSelected ? styles.modelOptionSelected : ''}`}
                            onClick={() => handleModelSelect(model.id)}
                            role="option"
                            aria-selected={isSelected}
                          >
                            <div className={styles.modelOptionContent}>
                              <div className={styles.modelOptionRow}>
                                <span className={styles.modelOptionName}>{model.name}</span>
                                {model.badge && (
                                  <span
                                    className={styles.modelBadge}
                                    style={{
                                      '--badge-bg': provider.accentBg,
                                      '--badge-text': provider.accentText,
                                      '--badge-bg-dark': provider.accentBgDark,
                                    }}
                                  >
                                    {model.badge}
                                  </span>
                                )}
                              </div>
                              <span className={styles.modelOptionTagline}>{model.tagline}</span>
                            </div>
                            {isSelected && (
                              <span className={styles.checkmark}>
                                <CheckIcon />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* ── Featured / default view ── */
            <>
              {/* ── Auto ── */}
              <button
                className={`${styles.modelOption} ${isAutoMode ? styles.modelOptionSelected : ''}`}
                onClick={handleAutoSelect}
                role="option"
                aria-selected={isAutoMode}
              >
                <span className={styles.autoChip}>✦</span>
                <div className={styles.modelOptionContent}>
                  <span className={styles.modelOptionName}>Auto</span>
                  <span className={styles.modelOptionTagline}>
                    {savedDefaultModel
                      ? `Using ${savedDefaultModel.name} by default`
                      : 'Best model selected for each task'}
                  </span>
                </div>
                {isAutoMode && (
                  <span className={styles.checkmark}>
                    <CheckIcon />
                  </span>
                )}
              </button>

              <div className={styles.divider} />
              <div className={styles.sectionLabel}>Featured Models</div>

              {/* ── 3 featured models ── */}
              {featuredModels.map((model) => {
                const provider = PROVIDERS[model.provider];
                const isSelected = selectedModelId === model.id;
                return (
                  <button
                    key={model.id}
                    className={`${styles.modelOption} ${isSelected ? styles.modelOptionSelected : ''}`}
                    onClick={() => handleModelSelect(model.id)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span
                      className={styles.providerChip}
                      style={{
                        '--chip-bg': provider.accentBg,
                        '--chip-text': provider.accentText,
                        '--chip-bg-dark': provider.accentBgDark,
                      }}
                    >
                      {provider.logoChar}
                    </span>
                    <div className={styles.modelOptionContent}>
                      <div className={styles.modelOptionRow}>
                        <span className={styles.modelOptionName}>{model.name}</span>
                        {model.badge && (
                          <span
                            className={styles.modelBadge}
                            style={{
                              '--badge-bg': provider.accentBg,
                              '--badge-text': provider.accentText,
                              '--badge-bg-dark': provider.accentBgDark,
                            }}
                          >
                            {model.badge}
                          </span>
                        )}
                      </div>
                      <span className={styles.modelOptionTagline}>{model.tagline}</span>
                    </div>
                    {isSelected && (
                      <span className={styles.checkmark}>
                        <CheckIcon />
                      </span>
                    )}
                  </button>
                );
              })}

              <div className={styles.divider} />
              <div className={styles.sectionLabel}>Modes</div>

              {/* ── Mode toggles ── */}
              {MODE_CONFIG.map((modeConf) => {
                const active = modeValues[modeConf.key];
                // Available when: auto mode (no specific provider locked) OR provider matches
                const available = isAutoMode || selectedProvider === modeConf.provider;
                const Icon = modeConf.Icon;
                return (
                  <button
                    key={modeConf.key}
                    className={`${styles.modeOption} ${active ? styles.modeOptionActive : ''} ${
                      !available ? styles.modeOptionDisabled : ''
                    }`}
                    onClick={() => available && handleModeToggle(modeConf)}
                    disabled={!available}
                    aria-pressed={active}
                    title={
                      !available
                        ? `Only available with ${modeConf.providerLabel} models`
                        : modeConf.description
                    }
                  >
                    <span className={`${styles.modeIcon} ${active ? styles.modeIconActive : ''}`}>
                      <Icon />
                    </span>
                    <div className={styles.modeContent}>
                      <span className={styles.modeName}>{modeConf.label}</span>
                      <span className={styles.modeProvider}>{modeConf.providerLabel}</span>
                    </div>
                    <div
                      className={`${styles.toggle} ${active ? styles.toggleOn : ''} ${
                        !available ? styles.toggleDisabled : ''
                      }`}
                    >
                      <div className={styles.toggleThumb} />
                    </div>
                  </button>
                );
              })}

              <div className={styles.divider} />

              {/* ── More models ── */}
              <button className={styles.moreModels} onClick={handleMoreModels}>
                <span>More models</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
