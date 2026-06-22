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
  getModelsForTier,
  getModelsByProvider,
  getFeaturedModelsForTier,
} from '../../data/models';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  CheckIcon,
  ChevronRightIcon,
  SearchIcon,
  CloseIcon,
} from '../Icons';
import styles from './ModelSelector.module.css';

const ROUTING_OPTIONS = [
  { id: 'default', label: 'Auto', tagline: 'Best model for each task' },
  { id: 'taskBased', label: 'Balanced', tagline: 'Optimized for the task' },
  { id: 'humanFactors', label: 'Quality', tagline: 'Uses context, tone and mood' },
];

const MOBILE_BREAKPOINT = 768;

function matchesModel(model, query) {
  if (model.name.toLowerCase().includes(query)) return true;
  if (model.tagline && model.tagline.toLowerCase().includes(query)) return true;
  const provider = PROVIDERS[model.provider];
  if (provider) {
    if (provider.name.toLowerCase().includes(query)) return true;
    if (provider.shortName && provider.shortName.toLowerCase().includes(query)) return true;
  }
  return false;
}

function matchesRouting(route, query) {
  return route.label.toLowerCase().includes(query) || route.tagline.toLowerCase().includes(query);
}

export default function ModelSelector({ imageOnly = false }) {
  const dispatch = useDispatch();
  const selectedModelId = useSelector(selectSelectedModelId);
  const autoStrategy = useSelector(selectAutoStrategy);

  const [isOpen, setIsOpen] = useState(false);
  const [dropdownDir, setDropdownDir] = useState('down');
  const [showAllModels, setShowAllModels] = useState(false);
  const [mobileDropdownStyle, setMobileDropdownStyle] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const searchInputRef = useRef(null);

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
    return getFeaturedModelsForTier(userTier, tierModels);
  }, [imageOnly, tierModels, userTier]);

  const activeProviders = PROVIDER_ORDER.filter((pid) => tierModelsByProvider[pid]?.length > 0);

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const isSearching = trimmedQuery.length > 0;

  const filteredRouting =
    isSearching && !imageOnly ? ROUTING_OPTIONS.filter((r) => matchesRouting(r, trimmedQuery)) : [];

  const filteredModelsByProvider = useMemo(() => {
    if (!isSearching) return null;
    const filtered = tierModels.filter((m) => matchesModel(m, trimmedQuery));
    return getModelsByProvider(filtered);
  }, [tierModels, trimmedQuery, isSearching]);

  const filteredProviders = filteredModelsByProvider
    ? PROVIDER_ORDER.filter((pid) => filteredModelsByProvider[pid]?.length > 0)
    : [];
  const hasResults = filteredRouting.length > 0 || filteredProviders.length > 0;

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
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key !== 'Escape') return;
      if (isSearching) {
        setSearchQuery('');
      } else if (showAllModels) {
        setShowAllModels(false);
      } else {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showAllModels, isSearching]);

  // Autofocus the search input on open — desktop only, to avoid popping the
  // mobile keyboard for users who just want to pick from the visible options.
  useEffect(() => {
    if (!isOpen) return;
    if (window.innerWidth <= MOBILE_BREAKPOINT) return;
    const frame = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen]);

  const handleTriggerClick = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;

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
      setSearchQuery('');
    }
    setIsOpen((prev) => !prev);
  };

  const handleModelSelect = (modelId) => {
    dispatch(setSelectedModel(modelId));
    setIsOpen(false);
    setShowAllModels(false);
    setSearchQuery('');
  };

  const handleRoutingSelect = (strategyId) => {
    dispatch(setSelectedModel(null));
    dispatch(setAutoStrategy(strategyId));
    setIsOpen(false);
    setShowAllModels(false);
    setSearchQuery('');
  };

  const handleSearchClear = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  const currentStrategy = isAutoMode
    ? ROUTING_OPTIONS.find((r) => r.id === (autoStrategy || 'default'))
    : null;
  const triggerLabel = isAutoMode
    ? currentStrategy?.label || 'Auto'
    : selectedModel?.name ?? 'Auto';

  const renderRoutingOption = (route) => {
    const isActive = isAutoMode && (autoStrategy || 'default') === route.id;
    return (
      <button
        key={route.id}
        className={`${styles.modelOption} ${isActive ? styles.modelOptionSelected : ''}`}
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
  };

  const renderModelOption = (model) => {
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
  };

  const renderProviderGroup = (providerId, groups) => {
    const provider = PROVIDERS[providerId];
    const providerModels = groups[providerId];
    if (!provider || !providerModels || providerModels.length === 0) return null;
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
        {providerModels.map(renderModelOption)}
      </div>
    );
  };

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
          <div className={styles.searchBar}>
            <span className={styles.searchIcon}>
              <SearchIcon />
            </span>
            <input
              ref={searchInputRef}
              type="text"
              className={styles.searchInput}
              placeholder="Search models or providers"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              aria-label="Search models"
            />
            {isSearching && (
              <button
                type="button"
                className={styles.searchClear}
                onClick={handleSearchClear}
                aria-label="Clear search"
              >
                <CloseIcon />
              </button>
            )}
          </div>

          {isSearching ? (
            <div className={styles.allModelsList}>
              {hasResults ? (
                <>
                  {filteredRouting.map(renderRoutingOption)}
                  {filteredRouting.length > 0 && filteredProviders.length > 0 && (
                    <div className={styles.divider} />
                  )}
                  {filteredProviders.map((pid) =>
                    renderProviderGroup(pid, filteredModelsByProvider)
                  )}
                </>
              ) : (
                <div className={styles.emptyState}>
                  No matches for &ldquo;{searchQuery.trim()}&rdquo;
                </div>
              )}
            </div>
          ) : showAllModels ? (
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
                {activeProviders.map((pid) => renderProviderGroup(pid, tierModelsByProvider))}
              </div>
            </>
          ) : (
            <>
              {ROUTING_OPTIONS.map(renderRoutingOption)}

              <div className={styles.divider} />

              {featuredModels.map(renderModelOption)}

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
