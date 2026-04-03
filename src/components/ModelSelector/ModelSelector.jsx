import { useState, useRef, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectSelectedModelId,
  setSelectedModel,
  selectAutoStrategy,
  setAutoStrategy,
} from '../../store/slices/chatSlice';
import { selectCurrentTier } from '../../store/slices/subscriptionSlice';
import {
  MODELS,
  PROVIDERS,
  PROVIDER_ORDER,
  ACCESS_TIERS,
  getModelsForTier,
  getModelsByProvider,
} from '../../data/models';
import { ChevronDownIcon, ChevronLeftIcon, CheckIcon, ChevronRightIcon } from '../Icons';
import styles from './ModelSelector.module.css';

// Featured models per tier — one per major provider
const FEATURED_MODEL_IDS_PRO = ['claude-opus-4-6', 'gpt-5.2', 'gemini-2.5-pro'];

const FEATURED_MODEL_IDS_FREE = ['claude-haiku-4-5-20251001', 'gpt-5-mini', 'gemini-2.5-flash'];

// Routing strategies shown as top-level options
const ROUTING_OPTIONS = [
  { id: 'default', label: 'Auto', tagline: 'Best model for each task' },
  { id: 'taskBased', label: 'Balanced', tagline: 'Optimized for the task' },
  { id: 'humanFactors', label: 'Quality', tagline: 'Uses context, tone and mood' },
];

export default function ModelSelector({ imageOnly = false }) {
  const dispatch = useDispatch();
  const selectedModelId = useSelector(selectSelectedModelId);
  const autoStrategy = useSelector(selectAutoStrategy);

  const [isOpen, setIsOpen] = useState(false);
  const [dropdownDir, setDropdownDir] = useState('down');
  const [showAllModels, setShowAllModels] = useState(false);
  const [mobileDropdownStyle, setMobileDropdownStyle] = useState({});
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  const userTier = useSelector(selectCurrentTier);
  const tierModels = useMemo(() => {
    const models = getModelsForTier(userTier);
    return imageOnly ? models.filter((m) => m.capabilities?.imageGeneration) : models;
  }, [userTier, imageOnly]);
  const tierModelsByProvider = useMemo(() => getModelsByProvider(tierModels), [tierModels]);

  const selectedModel = selectedModelId ? MODELS.find((m) => m.id === selectedModelId) : null;
  const isAutoMode = !selectedModelId;

  const featuredModels = useMemo(() => {
    if (imageOnly) return tierModels.slice(0, 3);
    const featuredIds =
      userTier === ACCESS_TIERS.pro ? FEATURED_MODEL_IDS_PRO : FEATURED_MODEL_IDS_FREE;
    return featuredIds.map((id) => tierModels.find((m) => m.id === id)).filter(Boolean);
  }, [imageOnly, tierModels, userTier]);

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

  const handleTriggerClick = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const isMobile = window.innerWidth <= 768;

      if (isMobile) {
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

  const handleRoutingSelect = (strategyId) => {
    dispatch(setSelectedModel(null));
    dispatch(setAutoStrategy(strategyId));
    setIsOpen(false);
  };

  // Determine trigger label
  const currentStrategy = isAutoMode
    ? ROUTING_OPTIONS.find((r) => r.id === (autoStrategy || 'default'))
    : null;
  const triggerLabel = isAutoMode
    ? currentStrategy?.label || 'Auto'
    : selectedModel?.name ?? 'Auto';

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
            <>
              <div className={styles.allModelsHeader}>
                <button
                  className={styles.backButton}
                  onClick={() => setShowAllModels(false)}
                  aria-label="Back"
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
            <>
              {/* Routing options */}
              {ROUTING_OPTIONS.map((route) => {
                const isActive = isAutoMode && (autoStrategy || 'default') === route.id;
                return (
                  <button
                    key={route.id}
                    className={`${styles.modelOption} ${
                      isActive ? styles.modelOptionSelected : ''
                    }`}
                    onClick={() => handleRoutingSelect(route.id)}
                    role="option"
                    aria-selected={isActive}
                  >
                    <div className={styles.modelOptionContent}>
                      <span className={styles.modelOptionName}>{route.label}</span>
                      <span className={styles.modelOptionTagline}>{route.tagline}</span>
                    </div>
                    {isActive && (
                      <span className={styles.checkmark}>
                        <CheckIcon />
                      </span>
                    )}
                  </button>
                );
              })}

              <div className={styles.divider} />

              {/* Featured models */}
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

              <button className={styles.moreModels} onClick={() => setShowAllModels(true)}>
                <span>More models</span>
                <ChevronRightIcon />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
