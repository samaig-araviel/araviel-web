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
import { StarIcon, CloseIcon, SearchIcon, CheckIcon } from '../Icons';
import styles from './ModelsView.module.css';

// ── Helpers ──

function getDefaultModel() {
  return localStorage.getItem('araviel-default-model') || null;
}

function saveDefaultModel(modelId) {
  if (modelId) {
    localStorage.setItem('araviel-default-model', modelId);
  } else {
    localStorage.removeItem('araviel-default-model');
  }
}

const TIER_CONFIG = {
  [ACCESS_TIERS.free]: {
    label: 'Included',
    sublabel: 'Available on all plans',
    gradient: 'var(--tier-free-gradient)',
    accentColor: 'var(--tier-free-accent)',
  },
  [ACCESS_TIERS.pro]: {
    label: 'Pro',
    sublabel: 'Unlock with Pro plan',
    gradient: 'var(--tier-pro-gradient)',
    accentColor: 'var(--tier-pro-accent)',
  },
  [ACCESS_TIERS.premium]: {
    label: 'Premium',
    sublabel: 'Unlock with Premium plan',
    gradient: 'var(--tier-premium-gradient)',
    accentColor: 'var(--tier-premium-accent)',
  },
};

const TIER_ORDER = [ACCESS_TIERS.free, ACCESS_TIERS.pro, ACCESS_TIERS.premium];

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

function ProBadge() {
  return <span className={styles.proBadge}>PRO</span>;
}

function PremiumBadge() {
  return <span className={styles.premiumBadge}>PREMIUM</span>;
}

// ── Active Model Banner (shows chat model) ──

function ActiveModelBanner({ model, defaultModelId, onSetDefault, onSelect }) {
  const provider = PROVIDERS[model.provider];
  const isDefault = defaultModelId === model.id;

  return (
    <div className={styles.activeBanner} onClick={() => onSelect(model)}>
      <div className={styles.activeBannerGlow} style={{ '--glow-color': provider.accentColor }} />
      <div className={styles.activeBannerContent}>
        <div className={styles.activeBannerLeft}>
          <div className={styles.activeBannerIndicator}>
            <span className={styles.activeBannerPulse} />
            <span className={styles.activeBannerLabel}>Active in chat</span>
          </div>
          <div className={styles.activeBannerMain}>
            <span
              className={styles.activeBannerProvider}
              style={{
                '--chip-bg': provider.accentBg,
                '--chip-text': provider.accentText,
                '--chip-bg-dark': provider.accentBgDark,
              }}
            >
              {provider.logoChar}
            </span>
            <div className={styles.activeBannerInfo}>
              <h3 className={styles.activeBannerName}>{model.name}</h3>
              <p className={styles.activeBannerTagline}>{model.tagline}</p>
            </div>
          </div>
        </div>
        <div className={styles.activeBannerRight}>
          <div className={styles.activeBannerStats}>
            <SpeedBadge tier={model.speedTier} />
            <span className={styles.activeBannerCtx}>
              {formatTokens(model.context.inputTokens)} ctx
            </span>
          </div>
          {!isDefault && (
            <button
              className={styles.activeBannerSetDefault}
              onClick={(e) => {
                e.stopPropagation();
                onSetDefault(model.id);
              }}
              title="Set as default model"
            >
              <StarIcon filled={false} />
              <span>Set default</span>
            </button>
          )}
          {isDefault && (
            <span className={styles.activeBannerDefaultBadge}>
              <StarIcon filled />
              Default
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Provider Filter Pills (single filter, no duplication) ──

function ProviderFilters({ activeFilter, onFilterChange, providerCounts }) {
  return (
    <div className={styles.filterRow}>
      <button
        className={`${styles.filterChip} ${activeFilter === 'all' ? styles.filterChipActive : ''}`}
        onClick={() => onFilterChange('all')}
      >
        All
        <span className={styles.filterChipCount}>{MODELS.length}</span>
      </button>
      {PROVIDER_ORDER.map((pid) => {
        const provider = PROVIDERS[pid];
        const count = providerCounts[pid] || 0;
        if (count === 0) return null;
        return (
          <button
            key={pid}
            className={`${styles.filterChip} ${
              activeFilter === pid ? styles.filterChipActive : ''
            }`}
            onClick={() => onFilterChange(pid)}
          >
            <span
              className={styles.filterChipDot}
              style={{ backgroundColor: provider.accentColor }}
            />
            {provider.shortName}
            <span className={styles.filterChipCount}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Model Card ──

function ModelCard({ model, isDefault, isChatModel, onSetDefault, isLocked, onSelect }) {
  const provider = PROVIDERS[model.provider];

  const handleStarClick = (e) => {
    e.stopPropagation();
    if (isLocked) return;
    onSetDefault(isDefault ? null : model.id);
  };

  return (
    <div
      className={`${styles.card} ${isDefault ? styles.cardDefault : ''} ${
        isChatModel ? styles.cardChatActive : ''
      } ${isLocked ? styles.cardLocked : ''}`}
      onClick={() => !isLocked && onSelect(model)}
    >
      <div className={styles.cardAccent} style={{ backgroundColor: provider.accentColor }} />
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
            {isChatModel && <span className={styles.cardActiveBadge}>Active</span>}
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
            {isLocked && model.accessTier === ACCESS_TIERS.pro && <ProBadge />}
            {isLocked && model.accessTier === ACCESS_TIERS.premium && <PremiumBadge />}
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

        {/* Footer: price + star */}
        <div className={styles.cardFooter}>
          <span className={styles.cardPrice}>
            $
            {model.pricing.inputPerM < 1
              ? model.pricing.inputPerM.toFixed(3)
              : model.pricing.inputPerM.toFixed(2)}
            <span className={styles.cardPriceUnit}>/M in</span>
          </span>
          {!isLocked && (
            <button
              className={`${styles.cardStar} ${isDefault ? styles.cardStarActive : ''}`}
              onClick={handleStarClick}
              title={isDefault ? 'Remove as default' : 'Set as default model'}
              aria-label={isDefault ? 'Remove as default' : 'Set as default model'}
            >
              <StarIcon filled={isDefault} />
            </button>
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

// ── Tier Section ──

function TierSection({
  tier,
  models,
  activeFilter,
  defaultModelId,
  chatModelId,
  userTier,
  onSetDefault,
  onSelect,
}) {
  const config = TIER_CONFIG[tier];
  const isLocked =
    (userTier === ACCESS_TIERS.free && tier !== ACCESS_TIERS.free) ||
    (userTier === ACCESS_TIERS.pro && tier === ACCESS_TIERS.premium);

  // Group by provider
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

  // If filtering by provider, don't show provider sub-headers
  const showProviderHeaders = activeFilter === 'all';
  const providerIds = Object.keys(groupedByProvider);

  if (models.length === 0) return null;

  return (
    <div className={`${styles.tierSection} ${isLocked ? styles.tierSectionLocked : ''}`}>
      <div className={styles.tierHeader}>
        <div className={styles.tierHeaderLeft}>
          <span className={styles.tierBadge} style={{ '--tier-accent': config.accentColor }}>
            {config.label}
          </span>
          <span className={styles.tierSublabel}>{config.sublabel}</span>
        </div>
        <span className={styles.tierCount}>{models.length} models</span>
      </div>

      {showProviderHeaders ? (
        providerIds.map((pid) => (
          <div key={pid} className={styles.providerGroup}>
            <ProviderGroupHeader providerId={pid} count={groupedByProvider[pid].length} />
            <div className={styles.modelGrid}>
              {groupedByProvider[pid].map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  isDefault={defaultModelId === model.id}
                  isChatModel={chatModelId === model.id}
                  onSetDefault={onSetDefault}
                  isLocked={isLocked}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className={styles.modelGrid}>
          {models.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              isDefault={defaultModelId === model.id}
              isChatModel={chatModelId === model.id}
              onSetDefault={onSetDefault}
              isLocked={isLocked}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Model Detail Panel ──

function ModelDetailPanel({
  model,
  isDefault,
  isChatModel,
  onSetDefault,
  onSetChatModel,
  onClose,
}) {
  const provider = PROVIDERS[model.provider];
  const panelRef = useRef(null);

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
          {isDefault && <span className={styles.detailDefaultBadge}>Default Model</span>}
          {isChatModel && <span className={styles.detailChatBadge}>Active in Chat</span>}
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

        {/* Actions */}
        <div className={styles.detailActions}>
          <button
            className={`${styles.detailActionBtn} ${
              isChatModel ? styles.detailActionBtnActive : ''
            }`}
            onClick={() => {
              onSetChatModel(isChatModel ? null : model.id);
              onClose();
            }}
          >
            <CheckIcon />
            {isChatModel ? 'Active in chat' : 'Use in chat'}
          </button>
          <button
            className={`${styles.detailDefaultBtn} ${
              isDefault ? styles.detailDefaultBtnActive : ''
            }`}
            onClick={() => onSetDefault(isDefault ? null : model.id)}
          >
            <StarIcon filled={isDefault} />
            {isDefault ? 'Remove default' : 'Set as default'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Main ModelsView ──

export default function ModelsView() {
  const dispatch = useDispatch();
  const chatModelId = useSelector(selectSelectedModelId);

  const [activeFilter, setActiveFilter] = useState('all');
  const [defaultModelId, setDefaultModelId] = useState(getDefaultModel);
  const [selectedModel, setSelectedModel] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef(null);
  const userTier = getUserTier();

  // Sync: when default model changes, also update Redux if no explicit chat model is set
  const handleSetDefault = useCallback((modelId) => {
    setDefaultModelId(modelId);
    saveDefaultModel(modelId);
  }, []);

  // Set the chat model (Redux-synced)
  const handleSetChatModel = useCallback(
    (modelId) => {
      dispatch(setReduxSelectedModel(modelId));
    },
    [dispatch]
  );

  // Provider counts (for filter chips)
  const providerCounts = useMemo(() => {
    const counts = {};
    for (const pid of PROVIDER_ORDER) {
      counts[pid] = MODELS.filter((m) => m.provider === pid).length;
    }
    return counts;
  }, []);

  // Filter models by provider and search
  const filteredModels = useMemo(() => {
    let models = MODELS;

    // Provider filter
    if (activeFilter !== 'all') {
      models = models.filter((m) => m.provider === activeFilter);
    }

    // Search filter
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
  }, [activeFilter, searchQuery]);

  // Group filtered models by tier
  const modelsByTier = useMemo(() => {
    const grouped = {};
    for (const tier of TIER_ORDER) {
      grouped[tier] = filteredModels.filter((m) => m.accessTier === tier);
    }
    return grouped;
  }, [filteredModels]);

  // Active chat model object
  const chatModel = useMemo(() => {
    if (!chatModelId) return null;
    return MODELS.find((m) => m.id === chatModelId) || null;
  }, [chatModelId]);

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

  return (
    <div className={styles.container}>
      {/* Sticky header */}
      <div className={styles.headerBar}>
        <div className={styles.headerTop}>
          <div className={styles.headerTitleGroup}>
            <h1 className={styles.pageTitle}>Models</h1>
            <span className={styles.pageCount}>{MODELS.length}</span>
          </div>

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
        </div>

        <ProviderFilters
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          providerCounts={providerCounts}
        />
      </div>

      {/* Active chat model banner */}
      {chatModel && !searchQuery && activeFilter === 'all' && (
        <div className={styles.bannerSection}>
          <ActiveModelBanner
            model={chatModel}
            defaultModelId={defaultModelId}
            onSetDefault={handleSetDefault}
            onSelect={setSelectedModel}
          />
        </div>
      )}

      {/* Tier sections */}
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
              }}
            >
              Reset filters
            </button>
          </div>
        ) : (
          TIER_ORDER.map((tier) => (
            <TierSection
              key={tier}
              tier={tier}
              models={modelsByTier[tier]}
              activeFilter={activeFilter}
              defaultModelId={defaultModelId}
              chatModelId={chatModelId}
              userTier={userTier}
              onSetDefault={handleSetDefault}
              onSelect={setSelectedModel}
            />
          ))
        )}
      </div>

      {/* Detail panel */}
      {selectedModel && (
        <ModelDetailPanel
          model={selectedModel}
          isDefault={defaultModelId === selectedModel.id}
          isChatModel={chatModelId === selectedModel.id}
          onSetDefault={handleSetDefault}
          onSetChatModel={handleSetChatModel}
          onClose={() => setSelectedModel(null)}
        />
      )}
    </div>
  );
}
