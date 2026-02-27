import { useState, useRef, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectSelectedModelId, setSelectedModel } from '../../store/slices/chatSlice';
import {
  MODELS,
  PROVIDERS,
  PROVIDER_ORDER,
  ACCESS_TIERS,
  getUserTier,
  getModelsForTier,
  getModelsByProvider,
} from '../../data/models';
import { ChevronDownIcon, ChevronLeftIcon, CheckIcon } from '../Icons';
import styles from './ModelSelector.module.css';

// Featured models per tier — one per major provider
const FEATURED_MODEL_IDS_PRO = [
  'claude-opus-4-6', // Anthropic flagship
  'gpt-5.2', // OpenAI flagship
  'gemini-2.5-pro', // Google flagship
];

const FEATURED_MODEL_IDS_FREE = [
  'claude-haiku-4-5-20251001', // Anthropic free
  'gpt-5-mini', // OpenAI free
  'gemini-2.5-flash', // Google free
];

export default function ModelSelector() {
  const dispatch = useDispatch();
  const selectedModelId = useSelector(selectSelectedModelId);

  const [isOpen, setIsOpen] = useState(false);
  const [dropdownDir, setDropdownDir] = useState('down');
  const [showAllModels, setShowAllModels] = useState(false);
  const [mobileDropdownStyle, setMobileDropdownStyle] = useState({});
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  // Get user tier and filter models accordingly
  const userTier = getUserTier();
  const tierModels = useMemo(() => getModelsForTier(userTier), [userTier]);
  const tierModelsByProvider = useMemo(() => getModelsByProvider(tierModels), [tierModels]);

  const selectedModel = selectedModelId ? MODELS.find((m) => m.id === selectedModelId) : null;
  const isAutoMode = !selectedModelId;

  // For Auto mode tagline: check if there's a saved default model to show in subtitle
  const savedDefaultId = localStorage.getItem('araviel-default-model');
  const savedDefaultModel =
    isAutoMode && savedDefaultId ? MODELS.find((m) => m.id === savedDefaultId) : null;

  // Featured models based on tier
  const featuredIds =
    userTier === ACCESS_TIERS.pro ? FEATURED_MODEL_IDS_PRO : FEATURED_MODEL_IDS_FREE;
  const featuredModels = featuredIds
    .map((id) => tierModels.find((m) => m.id === id))
    .filter(Boolean);

  // Active providers for the "All Models" view (only providers that have tier-accessible models)
  const activeProviders = PROVIDER_ORDER.filter((pid) => tierModelsByProvider[pid]?.length > 0);

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
      const isMobile = window.innerWidth <= 768;

      if (isMobile) {
        // Use fixed positioning on mobile to escape overflow: hidden on .app
        const availableAbove = rect.top - 12;
        const maxHeight = Math.min(availableAbove, window.innerHeight * 0.6);
        setDropdownDir('up');
        setMobileDropdownStyle({
          position: 'fixed',
          bottom: window.innerHeight - rect.top + 6 + 'px',
          left: Math.max(12, Math.min(rect.left, window.innerWidth - 292)) + 'px',
          maxHeight: maxHeight + 'px',
          overflowY: 'auto',
        });
      } else {
        setDropdownDir(spaceBelow < 380 ? 'up' : 'down');
        setMobileDropdownStyle({});
      }
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

  const handleMoreModels = () => {
    setShowAllModels(true);
  };

  const handleBackToFeatured = () => {
    setShowAllModels(false);
  };

  // Trigger label and provider accent — only reflect the explicitly selected model, not the
  // saved default. When in Auto mode the trigger always shows "Auto".
  const displayProvider = !isAutoMode && selectedModel ? PROVIDERS[selectedModel.provider] : null;
  const triggerLabel = isAutoMode ? 'Auto' : selectedModel?.name ?? 'Auto';

  return (
    <div className={styles.wrapper}>
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''}`}
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
          style={mobileDropdownStyle}
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
                {activeProviders.map((providerId) => {
                  const provider = PROVIDERS[providerId];
                  const providerModels = tierModelsByProvider[providerId];
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
                            className={`${styles.modelOption} ${
                              isSelected ? styles.modelOptionSelected : ''
                            }`}
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
                    className={`${styles.modelOption} ${
                      isSelected ? styles.modelOptionSelected : ''
                    }`}
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
