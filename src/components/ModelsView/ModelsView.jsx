import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  MODELS,
  PROVIDERS,
  PROVIDER_ORDER,
  SPEED_TIERS,
  ACCESS_TIERS,
  getUserTier,
  formatTokens,
} from '../../data/models';
import { StarIcon, CloseIcon, ChevronDownIcon } from '../Icons';
import styles from './ModelsView.module.css';

const PROVIDER_FILTER_ALL = 'all';

function getDefaultModel() {
  return localStorage.getItem('araviel-default-model') || null;
}

function saveDefaultModel(modelId) {
  localStorage.setItem('araviel-default-model', modelId);
}

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

// ── Provider Filter Dropdown ──

function ProviderFilterDropdown({ activeFilter, onFilterChange, providerModelMap }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const activeProvider = activeFilter !== PROVIDER_FILTER_ALL ? PROVIDERS[activeFilter] : null;
  const activeLabel = activeProvider ? activeProvider.name : 'All Providers';
  const activeCount =
    activeFilter !== PROVIDER_FILTER_ALL
      ? providerModelMap[activeFilter]?.length || 0
      : MODELS.length;

  return (
    <div className={styles.filterDropdown} ref={dropdownRef}>
      <button
        className={`${styles.filterTrigger} ${open ? styles.filterTriggerOpen : ''}`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        {activeProvider && (
          <span
            className={styles.filterTriggerDot}
            style={{ backgroundColor: activeProvider.accentColor }}
          />
        )}
        <span className={styles.filterTriggerLabel}>{activeLabel}</span>
        <span className={styles.filterTriggerCount}>{activeCount}</span>
        <span
          className={`${styles.filterTriggerChevron} ${
            open ? styles.filterTriggerChevronOpen : ''
          }`}
        >
          <ChevronDownIcon />
        </span>
      </button>
      {open && (
        <div className={styles.filterMenu}>
          <button
            className={`${styles.filterMenuItem} ${
              activeFilter === PROVIDER_FILTER_ALL ? styles.filterMenuItemActive : ''
            }`}
            onClick={() => {
              onFilterChange(PROVIDER_FILTER_ALL);
              setOpen(false);
            }}
          >
            <span
              className={styles.filterMenuDot}
              style={{ backgroundColor: 'var(--text-muted)' }}
            />
            <span className={styles.filterMenuLabel}>All Providers</span>
            <span className={styles.filterMenuCount}>{MODELS.length}</span>
          </button>
          <div className={styles.filterMenuDivider} />
          {PROVIDER_ORDER.map((pid) => {
            const provider = PROVIDERS[pid];
            const count = providerModelMap[pid]?.length || 0;
            if (count === 0) return null;
            return (
              <button
                key={pid}
                className={`${styles.filterMenuItem} ${
                  activeFilter === pid ? styles.filterMenuItemActive : ''
                }`}
                onClick={() => {
                  onFilterChange(pid);
                  setOpen(false);
                }}
              >
                <span
                  className={styles.filterMenuDot}
                  style={{ backgroundColor: provider.accentColor }}
                />
                <span className={styles.filterMenuLabel}>{provider.name}</span>
                <span className={styles.filterMenuCount}>{count}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Provider Pills (quick filter) ──

function ProviderPills({ activeFilter, onFilterChange, providerModelMap }) {
  return (
    <div className={styles.providerPills}>
      <button
        className={`${styles.providerPill} ${
          activeFilter === PROVIDER_FILTER_ALL ? styles.providerPillActive : ''
        }`}
        onClick={() => onFilterChange(PROVIDER_FILTER_ALL)}
      >
        All
      </button>
      {PROVIDER_ORDER.map((pid) => {
        const provider = PROVIDERS[pid];
        const count = providerModelMap[pid]?.length || 0;
        if (count === 0) return null;
        return (
          <button
            key={pid}
            className={`${styles.providerPill} ${
              activeFilter === pid ? styles.providerPillActive : ''
            }`}
            onClick={() => onFilterChange(pid)}
          >
            <span
              className={styles.providerPillDot}
              style={{ backgroundColor: provider.accentColor }}
            />
            {provider.name}
          </button>
        );
      })}
    </div>
  );
}

// ── Default Model Card (hero) ──

function DefaultModelHero({ model, onSetDefault, onSelect }) {
  const provider = PROVIDERS[model.provider];
  return (
    <div className={styles.defaultHero} onClick={() => onSelect(model)}>
      <div className={styles.defaultHeroAccent} style={{ backgroundColor: provider.accentColor }} />
      <div className={styles.defaultHeroContent}>
        <div className={styles.defaultHeroLeft}>
          <span
            className={styles.defaultHeroProvider}
            style={{
              '--chip-bg': provider.accentBg,
              '--chip-text': provider.accentText,
              '--chip-bg-dark': provider.accentBgDark,
            }}
          >
            {provider.logoChar}
          </span>
          <div className={styles.defaultHeroInfo}>
            <div className={styles.defaultHeroTopRow}>
              <span className={styles.defaultHeroBadge}>Default Model</span>
              <SpeedBadge tier={model.speedTier} />
            </div>
            <h3 className={styles.defaultHeroName}>{model.name}</h3>
            <p className={styles.defaultHeroTagline}>{model.tagline}</p>
          </div>
        </div>
        <div className={styles.defaultHeroRight}>
          <div className={styles.defaultHeroStats}>
            <div className={styles.defaultHeroStat}>
              <span className={styles.defaultHeroStatLabel}>Input</span>
              <span className={styles.defaultHeroStatValue}>
                $
                {model.pricing.inputPerM < 1
                  ? model.pricing.inputPerM.toFixed(3)
                  : model.pricing.inputPerM.toFixed(2)}
                /M
              </span>
            </div>
            <div className={styles.defaultHeroStat}>
              <span className={styles.defaultHeroStatLabel}>Output</span>
              <span className={styles.defaultHeroStatValue}>
                $
                {model.pricing.outputPerM < 1
                  ? model.pricing.outputPerM.toFixed(3)
                  : model.pricing.outputPerM.toFixed(2)}
                /M
              </span>
            </div>
            <div className={styles.defaultHeroStat}>
              <span className={styles.defaultHeroStatLabel}>Context</span>
              <span className={styles.defaultHeroStatValue}>
                {formatTokens(model.context.inputTokens)}
              </span>
            </div>
          </div>
          <button
            className={styles.defaultHeroRemove}
            onClick={(e) => {
              e.stopPropagation();
              onSetDefault(null);
            }}
            title="Remove as default"
          >
            <StarIcon filled />
          </button>
        </div>
      </div>
    </div>
  );
}

function ModelGridCard({ model, isDefault, onSetDefault, isProLocked, onSelect }) {
  const provider = PROVIDERS[model.provider];

  const handleStarClick = (e) => {
    e.stopPropagation();
    if (isProLocked) return;
    onSetDefault(isDefault ? null : model.id);
  };

  return (
    <div
      className={`${styles.gridCard} ${isDefault ? styles.gridCardDefault : ''} ${
        isProLocked ? styles.gridCardLocked : ''
      }`}
      onClick={() => !isProLocked && onSelect(model)}
    >
      {/* Accent bar */}
      <div className={styles.gridCardAccent} style={{ backgroundColor: provider.accentColor }} />

      <div className={styles.gridCardContent}>
        {/* Top row: provider + badges */}
        <div className={styles.gridCardTop}>
          <span
            className={styles.gridCardProvider}
            style={{
              '--chip-bg': provider.accentBg,
              '--chip-text': provider.accentText,
              '--chip-bg-dark': provider.accentBgDark,
            }}
          >
            {provider.logoChar}
          </span>
          <div className={styles.gridCardBadges}>
            {model.badge && (
              <span
                className={styles.gridCardBadge}
                style={{
                  '--badge-bg': provider.accentBg,
                  '--badge-text': provider.accentText,
                  '--badge-bg-dark': provider.accentBgDark,
                }}
              >
                {model.badge}
              </span>
            )}
            {isProLocked && <ProBadge />}
            {isDefault && <span className={styles.gridCardDefaultBadge}>Default</span>}
          </div>
        </div>

        {/* Name + tagline */}
        <div className={styles.gridCardTitle}>
          <h3 className={styles.gridCardName}>{model.name}</h3>
          <p className={styles.gridCardTagline}>{model.tagline}</p>
        </div>

        {/* Quick stats */}
        <div className={styles.gridCardStats}>
          <SpeedBadge tier={model.speedTier} />
          <span className={styles.gridCardCtx}>{formatTokens(model.context.inputTokens)} ctx</span>
        </div>

        {/* Capability dots */}
        <div className={styles.gridCardCaps}>
          {model.capabilities.vision && <span className={styles.capTag}>Vision</span>}
          {model.capabilities.audio && <span className={styles.capTag}>Audio</span>}
          {model.capabilities.extendedThinking && <span className={styles.capTag}>Thinking</span>}
          {model.capabilities.webSearch && <span className={styles.capTag}>Web</span>}
        </div>

        {/* Price + star */}
        <div className={styles.gridCardFooter}>
          <span className={styles.gridCardPrice}>
            $
            {model.pricing.inputPerM < 1
              ? model.pricing.inputPerM.toFixed(3)
              : model.pricing.inputPerM.toFixed(2)}
            <span className={styles.gridCardPriceUnit}>/M in</span>
          </span>
          {!isProLocked && (
            <button
              className={`${styles.gridCardStar} ${isDefault ? styles.gridCardStarActive : ''}`}
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

function ModelDetailPanel({ model, isDefault, onSetDefault, onClose }) {
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

        {/* Default CTA */}
        <button
          className={`${styles.detailSetDefault} ${isDefault ? styles.detailSetDefaultActive : ''}`}
          onClick={() => onSetDefault(isDefault ? null : model.id)}
        >
          <StarIcon filled={isDefault} />
          {isDefault ? 'Remove as default model' : 'Set as default model'}
        </button>
      </div>
    </div>,
    document.body
  );
}

export default function ModelsView() {
  const [activeFilter, setActiveFilter] = useState(PROVIDER_FILTER_ALL);
  const [defaultModelId, setDefaultModelId] = useState(getDefaultModel);
  const [selectedModel, setSelectedModel] = useState(null);
  const userTier = getUserTier();

  const handleSetDefault = useCallback((modelId) => {
    setDefaultModelId(modelId);
    if (modelId) {
      saveDefaultModel(modelId);
    } else {
      localStorage.removeItem('araviel-default-model');
    }
  }, []);

  const providerModelMap = useMemo(() => {
    const map = {};
    for (const pid of PROVIDER_ORDER) {
      const providerModels = MODELS.filter((m) => m.provider === pid);
      if (providerModels.length > 0) {
        map[pid] = providerModels;
      }
    }
    return map;
  }, []);

  const filteredModels = useMemo(() => {
    const models =
      activeFilter === PROVIDER_FILTER_ALL
        ? MODELS
        : MODELS.filter((m) => m.provider === activeFilter);
    // Exclude the default model from the main grid since it's shown at top
    if (defaultModelId) {
      return models.filter((m) => m.id !== defaultModelId);
    }
    return models;
  }, [activeFilter, defaultModelId]);

  const defaultModel = useMemo(() => {
    if (!defaultModelId) return null;
    return MODELS.find((m) => m.id === defaultModelId) || null;
  }, [defaultModelId]);

  const totalModels = MODELS.length;

  return (
    <div className={styles.container}>
      {/* Sticky header with filter */}
      <div className={styles.headerBar}>
        <div className={styles.headerTop}>
          <div className={styles.headerTitleGroup}>
            <h1 className={styles.pageTitle}>Models</h1>
            <span className={styles.pageCount}>{totalModels} models</span>
          </div>
          <ProviderFilterDropdown
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            providerModelMap={providerModelMap}
          />
        </div>
        <ProviderPills
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          providerModelMap={providerModelMap}
        />
      </div>

      {/* Default model hero */}
      {defaultModel && activeFilter === PROVIDER_FILTER_ALL && (
        <div className={styles.defaultSection}>
          <DefaultModelHero
            model={defaultModel}
            onSetDefault={handleSetDefault}
            onSelect={setSelectedModel}
          />
        </div>
      )}

      {/* Model grid */}
      <div className={styles.modelGrid}>
        {filteredModels.map((model) => {
          const isProLocked =
            userTier === ACCESS_TIERS.free && model.accessTier === ACCESS_TIERS.pro;
          return (
            <ModelGridCard
              key={model.id}
              model={model}
              isDefault={defaultModelId === model.id}
              onSetDefault={handleSetDefault}
              isProLocked={isProLocked}
              onSelect={setSelectedModel}
            />
          );
        })}
      </div>

      {/* Detail panel */}
      {selectedModel && (
        <ModelDetailPanel
          model={selectedModel}
          isDefault={defaultModelId === selectedModel.id}
          onSetDefault={handleSetDefault}
          onClose={() => setSelectedModel(null)}
        />
      )}
    </div>
  );
}
