import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectSelectedModelId,
  setSelectedModel as setReduxSelectedModel,
} from '../../store/slices/chatSlice';
import {
  MODELS,
  PROVIDERS,
  PROVIDER_ORDER,
  SPEED_TIERS,
  ACCESS_TIERS,
  getUserTier,
  formatTokens,
} from '../../data/models';
import { CloseIcon, SearchIcon, CheckIcon, FilterIcon, ChevronDownIcon } from '../Icons';
// updateUserTier removed — tier is now determined by subscription, not a manual toggle
import styles from './ModelsView.module.css';

// ── Helpers ──

const TIER_CONFIG = {
  [ACCESS_TIERS.free]: {
    label: 'Included',
    sublabel: 'Available on all plans',
  },
  [ACCESS_TIERS.lite]: {
    label: 'Lite',
    sublabel: 'Unlock with Lite plan',
  },
  [ACCESS_TIERS.pro]: {
    label: 'Pro',
    sublabel: 'Unlock with Pro plan',
  },
};

const TIER_ORDER = [ACCESS_TIERS.free, ACCESS_TIERS.lite, ACCESS_TIERS.pro];

// Which tier is "next" for upsell
const NEXT_TIER = {
  [ACCESS_TIERS.free]: ACCESS_TIERS.lite,
  [ACCESS_TIERS.lite]: ACCESS_TIERS.pro,
  [ACCESS_TIERS.pro]: null,
};

const TIER_DISPLAY = {
  [ACCESS_TIERS.free]: 'Free',
  [ACCESS_TIERS.lite]: 'Lite',
  [ACCESS_TIERS.pro]: 'Pro',
};

// ── Sub-components ──

function SpeedBadge({ tier }) {
  return (
    <span className={`${styles.speedBadge} ${styles[`speed_${tier}`]}`}>
      <span className={styles.speedDot} />
      {SPEED_TIERS[tier].label}
    </span>
  );
}

function CapabilityDot({ supported, label }) {
  return (
    <span
      className={`${styles.capDot} ${supported ? styles.capDotOn : styles.capDotOff}`}
      title={`${label}: ${supported ? 'Supported' : 'Not supported'}`}
    >
      <span className={styles.capDotIndicator} />
      <span className={styles.capDotLabel}>{label}</span>
    </span>
  );
}

function LiteBadge() {
  return <span className={styles.proBadge}>LITE</span>;
}

function ProBadge() {
  return <span className={styles.premiumBadge}>PRO</span>;
}

// ── Selected Model Pill (top of page) ──

function SelectedModelPill({ modelId, onSelect }) {
  if (!modelId) {
    return (
      <div className={styles.selectedPill}>
        <span className={styles.selectedPillAuto}>✦</span>
        <span className={styles.selectedPillLabel}>Auto</span>
        <span className={styles.selectedPillTag}>Default</span>
      </div>
    );
  }

  const model = MODELS.find((m) => m.id === modelId);
  if (!model) return null;
  const provider = PROVIDERS[model.provider];

  return (
    <div className={styles.selectedPill} onClick={() => onSelect(model)} role="button" tabIndex={0}>
      <span
        className={styles.selectedPillProvider}
        style={{
          '--chip-bg': provider.accentBg,
          '--chip-text': provider.accentText,
          '--chip-bg-dark': provider.accentBgDark,
        }}
      >
        {provider.logoChar}
      </span>
      <span className={styles.selectedPillLabel}>{model.name}</span>
      <span className={styles.selectedPillTag}>Default</span>
    </div>
  );
}

// ── Tier Filter ── (filters the model grid by tier, does NOT change the user's actual tier)

function TierFilter({ activeTier, onTierChange }) {
  const ALL_OPTION = 'all';
  return (
    <div className={styles.devSwitcher}>
      <span className={styles.devSwitcherLabel}>Plan</span>
      <button
        className={`${styles.devSwitcherBtn} ${
          activeTier === ALL_OPTION ? styles.devSwitcherBtnActive : ''
        }`}
        onClick={() => onTierChange(ALL_OPTION)}
      >
        All
      </button>
      {TIER_ORDER.map((tier) => (
        <button
          key={tier}
          className={`${styles.devSwitcherBtn} ${
            activeTier === tier ? styles.devSwitcherBtnActive : ''
          }`}
          onClick={() => onTierChange(tier)}
        >
          {TIER_DISPLAY[tier]}
        </button>
      ))}
    </div>
  );
}

// ── Provider Filter Dropdown ──

function ProviderFilterDropdown({ activeFilter, onFilterChange, providerCounts }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const activeProvider = activeFilter !== 'all' ? PROVIDERS[activeFilter] : null;
  const totalCount = MODELS.length;

  return (
    <div className={styles.filterDropdown} ref={dropdownRef}>
      <button
        className={`${styles.filterTrigger} ${isOpen ? styles.filterTriggerOpen : ''} ${
          activeFilter !== 'all' ? styles.filterTriggerActive : ''
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={styles.filterTriggerIcon}>
          <FilterIcon />
        </span>
        <span className={styles.filterTriggerLabel}>
          {activeProvider ? activeProvider.shortName : 'All providers'}
        </span>
        <span
          className={`${styles.filterTriggerChevron} ${
            isOpen ? styles.filterTriggerChevronOpen : ''
          }`}
        >
          <ChevronDownIcon />
        </span>
      </button>

      {isOpen && (
        <div className={styles.filterMenu}>
          <button
            className={`${styles.filterMenuItem} ${
              activeFilter === 'all' ? styles.filterMenuItemActive : ''
            }`}
            onClick={() => {
              onFilterChange('all');
              setIsOpen(false);
            }}
          >
            <span className={styles.filterMenuLabel}>All providers</span>
            <span className={styles.filterMenuCount}>{totalCount}</span>
            {activeFilter === 'all' && (
              <span className={styles.filterMenuCheck}>
                <CheckIcon />
              </span>
            )}
          </button>
          <div className={styles.filterMenuDivider} />
          {PROVIDER_ORDER.map((pid) => {
            const provider = PROVIDERS[pid];
            const count = providerCounts[pid] || 0;
            if (count === 0) return null;
            return (
              <button
                key={pid}
                className={`${styles.filterMenuItem} ${
                  activeFilter === pid ? styles.filterMenuItemActive : ''
                }`}
                onClick={() => {
                  onFilterChange(pid);
                  setIsOpen(false);
                }}
              >
                <span className={styles.filterMenuDot}>{provider.logoChar}</span>
                <span className={styles.filterMenuLabel}>{provider.name}</span>
                <span className={styles.filterMenuCount}>{count}</span>
                {activeFilter === pid && (
                  <span className={styles.filterMenuCheck}>
                    <CheckIcon />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Model Card ──

function ModelCard({ model, isSelected, isLocked, onSelect }) {
  const provider = PROVIDERS[model.provider];

  return (
    <div
      className={`${styles.card} ${isSelected ? styles.cardSelected : ''} ${
        isLocked ? styles.cardLocked : ''
      }`}
      onClick={() => onSelect(model)}
    >
      <div className={styles.cardBody}>
        {/* Header: provider chip + badges */}
        <div className={styles.cardHeader}>
          <span
            className={styles.cardProviderChip}
            style={{
              '--chip-bg': provider.accentBg,
              '--chip-text': provider.accentText,
              '--chip-bg-dark': provider.accentBgDark,
            }}
          >
            {provider.logoChar}
          </span>
          <div className={styles.cardBadges}>
            {isSelected && <span className={styles.cardSelectedBadge}>Selected</span>}
            {model.badge && (
              <span
                className={styles.cardBadge}
                style={{
                  '--badge-bg': provider.accentBg,
                  '--badge-text': provider.accentText,
                  '--badge-bg-dark': provider.accentBgDark,
                }}
              >
                {model.badge}
              </span>
            )}
            {isLocked && model.accessTier === ACCESS_TIERS.lite && <LiteBadge />}
            {isLocked && model.accessTier === ACCESS_TIERS.pro && <ProBadge />}
          </div>
        </div>

        {/* Title */}
        <div className={styles.cardTitle}>
          <h3 className={styles.cardName}>{model.name}</h3>
          <p className={styles.cardTagline}>{model.tagline}</p>
        </div>

        {/* Stats */}
        <div className={styles.cardStats}>
          <SpeedBadge tier={model.speedTier} />
          <span className={styles.cardCtx}>{formatTokens(model.context.inputTokens)} ctx</span>
        </div>

        {/* Capabilities */}
        <div className={styles.cardCaps}>
          {model.capabilities.vision && <span className={styles.capTag}>Vision</span>}
          {model.capabilities.audio && <span className={styles.capTag}>Audio</span>}
          {model.capabilities.extendedThinking && <span className={styles.capTag}>Thinking</span>}
          {model.capabilities.webSearch && <span className={styles.capTag}>Web</span>}
          {model.capabilities.imageGeneration && <span className={styles.capTag}>Image Gen</span>}
          {model.capabilities.tts && <span className={styles.capTag}>TTS</span>}
        </div>

        {/* Footer: price */}
        <div className={styles.cardFooter}>
          <span className={styles.cardPrice}>
            $
            {model.pricing.inputPerM < 1
              ? model.pricing.inputPerM.toFixed(3)
              : model.pricing.inputPerM.toFixed(2)}
            <span className={styles.cardPriceUnit}>/M in</span>
          </span>
          {isSelected && (
            <span className={styles.cardCheckmark}>
              <CheckIcon />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Provider Group Header ──

function ProviderGroupHeader({ providerId, count }) {
  const provider = PROVIDERS[providerId];
  return (
    <div className={styles.providerGroupHeader}>
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
      <span className={styles.providerGroupName}>{provider.name}</span>
      <span className={styles.providerGroupCount}>{count}</span>
      <span className={styles.providerGroupLine} />
    </div>
  );
}

// ── Model Group (renders provider-grouped or flat grid) ──

function ModelGroup({ models, activeFilter, selectedModelId, isLocked, onSelect }) {
  const groupedByProvider = useMemo(() => {
    const groups = {};
    for (const pid of PROVIDER_ORDER) {
      const providerModels = models.filter((m) => m.provider === pid);
      if (providerModels.length > 0) {
        groups[pid] = providerModels;
      }
    }
    return groups;
  }, [models]);

  const showProviderHeaders = activeFilter === 'all';
  const providerIds = Object.keys(groupedByProvider);

  if (models.length === 0) return null;

  if (showProviderHeaders) {
    return providerIds.map((pid) => (
      <div key={pid} className={styles.providerGroup}>
        <ProviderGroupHeader providerId={pid} count={groupedByProvider[pid].length} />
        <div className={styles.modelGrid}>
          {groupedByProvider[pid].map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              isSelected={selectedModelId === model.id}
              isLocked={isLocked}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    ));
  }

  return (
    <div className={styles.modelGrid}>
      {models.map((model) => (
        <ModelCard
          key={model.id}
          model={model}
          isSelected={selectedModelId === model.id}
          isLocked={isLocked}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

// ── Upgrade Banner ──

function UpgradeBanner({ currentTier, lockedCount }) {
  const nextTier = NEXT_TIER[currentTier];
  if (!nextTier || lockedCount === 0) return null;

  const nextLabel = TIER_DISPLAY[nextTier];
  const isLiteUpgrade = nextTier === ACCESS_TIERS.lite;

  return (
    <div
      className={`${styles.upgradeBanner} ${
        isLiteUpgrade ? styles.upgradeBannerPro : styles.upgradeBannerPremium
      }`}
    >
      <div className={styles.upgradeBannerGlow} />
      <div className={styles.upgradeBannerContent}>
        <div className={styles.upgradeBannerText}>
          <span className={styles.upgradeBannerIcon}>{isLiteUpgrade ? '✦' : '◆'}</span>
          <div>
            <h3 className={styles.upgradeBannerTitle}>
              Unlock {lockedCount} more model{lockedCount !== 1 ? 's' : ''} with {nextLabel}
            </h3>
            <p className={styles.upgradeBannerDesc}>
              {isLiteUpgrade
                ? 'Access Claude Sonnet, GPT-5, Gemini 2.5 Pro, and more powerful models for deeper reasoning and richer outputs.'
                : 'Get the most powerful models including Claude Opus, GPT-5.2 Pro, Sora 2, and deep research capabilities.'}
            </p>
          </div>
        </div>
        <button className={styles.upgradeBannerBtn}>Upgrade to {nextLabel}</button>
      </div>
    </div>
  );
}

// ── Model Detail Panel ──

function ModelDetailPanel({ model, isSelected, isLocked, userTier, onSetModel, onClose }) {
  const provider = PROVIDERS[model.provider];
  const panelRef = useRef(null);
  const nextTier = NEXT_TIER[userTier];

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return createPortal(
    <div className={styles.detailOverlay} onClick={onClose}>
      <div className={styles.detailPanel} ref={panelRef} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.detailHeader}>
          <div className={styles.detailHeaderLeft}>
            <span
              className={styles.detailProviderIcon}
              style={{
                '--chip-bg': provider.accentBg,
                '--chip-text': provider.accentText,
                '--chip-bg-dark': provider.accentBgDark,
              }}
            >
              {provider.logoChar}
            </span>
            <div>
              <h2 className={styles.detailName}>{model.name}</h2>
              <p className={styles.detailTagline}>{model.tagline}</p>
            </div>
          </div>
          <button className={styles.detailCloseBtn} onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        {/* Badges row */}
        <div className={styles.detailBadges}>
          <SpeedBadge tier={model.speedTier} />
          {model.badge && (
            <span
              className={styles.detailBadge}
              style={{
                '--badge-bg': provider.accentBg,
                '--badge-text': provider.accentText,
                '--badge-bg-dark': provider.accentBgDark,
              }}
            >
              {model.badge}
            </span>
          )}
          {isSelected && <span className={styles.detailSelectedBadge}>Selected Model</span>}
          {isLocked && model.accessTier === ACCESS_TIERS.lite && <LiteBadge />}
          {isLocked && model.accessTier === ACCESS_TIERS.pro && <ProBadge />}
        </div>

        {/* Description */}
        <p className={styles.detailDescription}>{model.description}</p>

        {/* Stats grid */}
        <div className={styles.detailStatsGrid}>
          <div className={styles.detailStat}>
            <span className={styles.detailStatLabel}>Input</span>
            <span className={styles.detailStatValue}>
              $
              {model.pricing.inputPerM < 1
                ? model.pricing.inputPerM.toFixed(3)
                : model.pricing.inputPerM.toFixed(2)}
              <span className={styles.detailStatUnit}>/M</span>
            </span>
          </div>
          <div className={styles.detailStat}>
            <span className={styles.detailStatLabel}>Output</span>
            <span className={styles.detailStatValue}>
              $
              {model.pricing.outputPerM < 1
                ? model.pricing.outputPerM.toFixed(3)
                : model.pricing.outputPerM.toFixed(2)}
              <span className={styles.detailStatUnit}>/M</span>
            </span>
          </div>
          <div className={styles.detailStat}>
            <span className={styles.detailStatLabel}>Context</span>
            <span className={styles.detailStatValue}>
              {formatTokens(model.context.inputTokens)}
            </span>
          </div>
          <div className={styles.detailStat}>
            <span className={styles.detailStatLabel}>Max Output</span>
            <span className={styles.detailStatValue}>
              {formatTokens(model.context.outputTokens)}
            </span>
          </div>
        </div>

        {/* Capabilities */}
        <div className={styles.detailSection}>
          <span className={styles.detailSectionLabel}>Capabilities</span>
          <div className={styles.detailCaps}>
            <CapabilityDot supported={model.capabilities.vision} label="Vision" />
            <CapabilityDot supported={model.capabilities.audio} label="Audio" />
            <CapabilityDot supported={model.capabilities.extendedThinking} label="Thinking" />
            <CapabilityDot supported={model.capabilities.webSearch} label="Web Search" />
            <CapabilityDot supported={model.capabilities.functionCalling} label="Functions" />
            <CapabilityDot supported={model.capabilities.streaming} label="Streaming" />
          </div>
        </div>

        {/* Best for */}
        <div className={styles.detailSection}>
          <span className={styles.detailSectionLabel}>Best for</span>
          <div className={styles.detailBestFor}>
            {model.bestFor.map((tag) => (
              <span key={tag} className={styles.detailBestForTag}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Action button */}
        {isLocked ? (
          <div className={styles.detailLockedAction}>
            <span className={styles.detailLockedLabel}>
              Requires {TIER_DISPLAY[model.accessTier]} plan
            </span>
            {nextTier && (
              <button className={styles.detailUpgradeBtn}>
                Upgrade to {TIER_DISPLAY[model.accessTier]}
              </button>
            )}
          </div>
        ) : (
          <button
            className={`${styles.detailSelectBtn} ${
              isSelected ? styles.detailSelectBtnActive : ''
            }`}
            onClick={() => {
              onSetModel(isSelected ? null : model.id);
              onClose();
            }}
          >
            <CheckIcon />
            {isSelected ? 'Selected — click to switch to Auto' : 'Use this model'}
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}

// ── Main ModelsView ──

export default function ModelsView() {
  const dispatch = useDispatch();
  const selectedModelId = useSelector(selectSelectedModelId);

  const [activeFilter, setActiveFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all'); // 'all' | 'free' | 'lite' | 'pro'
  const [detailModel, setDetailModel] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef(null);
  const userTier = getUserTier(); // Read-only — determined by user's subscription

  // Single unified action: set the model (Redux + localStorage)
  const handleSetModel = useCallback(
    (modelId) => {
      dispatch(setReduxSelectedModel(modelId));
    },
    [dispatch]
  );

  // Provider counts
  const providerCounts = useMemo(() => {
    const counts = {};
    for (const pid of PROVIDER_ORDER) {
      counts[pid] = MODELS.filter((m) => m.provider === pid).length;
    }
    return counts;
  }, []);

  // Filter models by provider, tier filter, and search
  const filteredModels = useMemo(() => {
    let models = MODELS;

    if (activeFilter !== 'all') {
      models = models.filter((m) => m.provider === activeFilter);
    }

    // Tier filter — show only models available at the selected tier
    if (tierFilter !== 'all') {
      models = models.filter((m) => {
        if (tierFilter === ACCESS_TIERS.pro) return true; // Pro sees all
        if (tierFilter === ACCESS_TIERS.lite) return m.accessTier !== ACCESS_TIERS.pro;
        return m.accessTier === ACCESS_TIERS.free; // Free tier only
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      models = models.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.tagline.toLowerCase().includes(q) ||
          m.provider.toLowerCase().includes(q) ||
          PROVIDERS[m.provider].name.toLowerCase().includes(q) ||
          m.bestFor.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    return models;
  }, [activeFilter, tierFilter, searchQuery]);

  // Check if a model is accessible for the current tier
  const isAccessible = useCallback(
    (model) => {
      if (userTier === ACCESS_TIERS.pro) return true;
      if (userTier === ACCESS_TIERS.lite) return model.accessTier !== ACCESS_TIERS.pro;
      return model.accessTier === ACCESS_TIERS.free;
    },
    [userTier]
  );

  // Split models into available and locked
  const { availableModels, lockedModels } = useMemo(() => {
    const available = [];
    const locked = [];
    for (const m of filteredModels) {
      if (isAccessible(m)) {
        available.push(m);
      } else {
        locked.push(m);
      }
    }
    return { availableModels: available, lockedModels: locked };
  }, [filteredModels, isAccessible]);

  // Group locked models by tier for display
  const lockedByTier = useMemo(() => {
    const groups = {};
    for (const tier of TIER_ORDER) {
      const tierModels = lockedModels.filter((m) => m.accessTier === tier);
      if (tierModels.length > 0) {
        groups[tier] = tierModels;
      }
    }
    return groups;
  }, [lockedModels]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  // Check if detail model is locked
  const isDetailLocked = detailModel ? !isAccessible(detailModel) : false;

  return (
    <div className={styles.container}>
      {/* Sticky header */}
      <div className={styles.headerBar}>
        <div className={styles.headerTop}>
          <div className={styles.headerTitleGroup}>
            <h1 className={styles.pageTitle}>Models</h1>
            <span className={styles.pageCount}>{MODELS.length}</span>
          </div>

          <div className={styles.headerActions}>
            {/* Tier Filter */}
            <TierFilter activeTier={tierFilter} onTierChange={setTierFilter} />

            {/* Search */}
            <div className={styles.searchWrapper}>
              <span className={styles.searchIcon}>
                <SearchIcon />
              </span>
              <input
                ref={searchRef}
                type="text"
                className={styles.searchInput}
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search models"
              />
              {searchQuery && (
                <button
                  className={styles.searchClear}
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <CloseIcon />
                </button>
              )}
              <kbd className={styles.searchKbd}>⌘K</kbd>
            </div>

            {/* Filter dropdown */}
            <ProviderFilterDropdown
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              providerCounts={providerCounts}
            />
          </div>
        </div>

        {/* Selected model pill */}
        <div className={styles.pillRow}>
          <SelectedModelPill modelId={selectedModelId} onSelect={setDetailModel} />
        </div>
      </div>

      {/* Content */}
      <div className={styles.tiersContainer}>
        {filteredModels.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>No models found</p>
            <p className={styles.emptyDesc}>
              Try adjusting your search or filter to find what you&#39;re looking for.
            </p>
            <button
              className={styles.emptyResetBtn}
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('all');
                setTierFilter('all');
              }}
            >
              Reset filters
            </button>
          </div>
        ) : (
          <>
            {/* Available Models Section */}
            {availableModels.length > 0 && (
              <div className={styles.availableSection}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionHeaderLeft}>
                    <span className={styles.sectionTitle}>Your Models</span>
                    <span className={styles.sectionCount}>{availableModels.length}</span>
                  </div>
                  <span className={styles.sectionSublabel}>
                    {userTier === ACCESS_TIERS.pro
                      ? 'All models included with Pro'
                      : `Included with your ${TIER_DISPLAY[userTier]} plan`}
                  </span>
                </div>
                <ModelGroup
                  models={availableModels}
                  activeFilter={activeFilter}
                  selectedModelId={selectedModelId}
                  isLocked={false}
                  onSelect={setDetailModel}
                />
              </div>
            )}

            {/* Upgrade Banner */}
            <UpgradeBanner currentTier={userTier} lockedCount={lockedModels.length} />

            {/* Locked Models Section */}
            {lockedModels.length > 0 && (
              <div className={styles.lockedSection}>
                {Object.entries(lockedByTier).map(([tier, models]) => (
                  <div key={tier} className={styles.lockedTierGroup}>
                    <div className={styles.tierHeader}>
                      <div className={styles.tierHeaderLeft}>
                        <span className={`${styles.tierBadge} ${styles[`tier_${tier}`]}`}>
                          {TIER_CONFIG[tier].label}
                        </span>
                        <span className={styles.tierSublabel}>{TIER_CONFIG[tier].sublabel}</span>
                      </div>
                      <span className={styles.tierCount}>{models.length} models</span>
                    </div>
                    <ModelGroup
                      models={models}
                      activeFilter={activeFilter}
                      selectedModelId={selectedModelId}
                      isLocked={true}
                      onSelect={setDetailModel}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail panel */}
      {detailModel && (
        <ModelDetailPanel
          model={detailModel}
          isSelected={selectedModelId === detailModel.id}
          isLocked={isDetailLocked}
          userTier={userTier}
          onSetModel={handleSetModel}
          onClose={() => setDetailModel(null)}
        />
      )}
    </div>
  );
}
