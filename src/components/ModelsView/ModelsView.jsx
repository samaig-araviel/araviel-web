import { useState, useRef, useEffect, useCallback } from 'react';
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

function ProviderTabs({ activeFilter, onFilterChange, providerModelMap }) {
  const scrollRef = useRef(null);

  return (
    <div className={styles.tabsWrapper}>
      <div className={styles.tabsScroll} ref={scrollRef}>
        <button
          className={`${styles.tab} ${
            activeFilter === PROVIDER_FILTER_ALL ? styles.tabActive : ''
          }`}
          onClick={() => onFilterChange(PROVIDER_FILTER_ALL)}
        >
          All
          <span className={styles.tabCount}>{MODELS.length}</span>
        </button>
        {PROVIDER_ORDER.map((pid) => {
          const provider = PROVIDERS[pid];
          const count = providerModelMap[pid]?.length || 0;
          if (count === 0) return null;
          return (
            <button
              key={pid}
              className={`${styles.tab} ${activeFilter === pid ? styles.tabActive : ''}`}
              onClick={() => onFilterChange(pid)}
            >
              <span className={styles.tabDot} style={{ backgroundColor: provider.accentColor }} />
              {provider.name}
              <span className={styles.tabCount}>{count}</span>
            </button>
          );
        })}
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

  const providerModelMap = {};
  for (const pid of PROVIDER_ORDER) {
    const providerModels = MODELS.filter((m) => m.provider === pid);
    if (providerModels.length > 0) {
      providerModelMap[pid] = providerModels;
    }
  }

  const filteredModels =
    activeFilter === PROVIDER_FILTER_ALL
      ? MODELS
      : MODELS.filter((m) => m.provider === activeFilter);

  const totalModels = MODELS.length;

  return (
    <div className={styles.container}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Models</h1>
        <p className={styles.pageSubtitle}>
          {totalModels} AI models across {Object.keys(providerModelMap).length} providers
          {userTier === ACCESS_TIERS.free && (
            <span className={styles.tierHint}>
              {' \u2014 '}
              <span className={styles.proBadgeInline}>PRO</span> models require an upgrade
            </span>
          )}
        </p>
      </div>

      {/* Provider filter tabs */}
      <ProviderTabs
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        providerModelMap={providerModelMap}
      />

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
