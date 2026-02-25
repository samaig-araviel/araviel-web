import { useState, useRef, useEffect } from 'react';
import {
  MODELS,
  PROVIDERS,
  PROVIDER_ORDER,
  SPEED_TIERS,
  ACCESS_TIERS,
  getUserTier,
  formatTokens,
} from '../../data/models';
import { StarIcon, CheckCircleIcon, ChevronDownIcon } from '../Icons';
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

function CapabilityPill({ supported, label }) {
  return (
    <span
      className={`${styles.capabilityPill} ${
        supported ? styles.capSupported : styles.capUnsupported
      }`}
    >
      {supported ? '\u2713' : '\u2717'} {label}
    </span>
  );
}

function ProBadge() {
  return <span className={styles.proBadge}>PRO</span>;
}

function DefaultModelPill({ model, onClear }) {
  if (!model) {
    return (
      <div className={styles.defaultPill}>
        <span className={styles.defaultPillLabel}>Default</span>
        <span className={styles.defaultPillAutoIcon}>{'\u2726'}</span>
        <span className={styles.defaultPillName}>Auto</span>
      </div>
    );
  }

  const provider = PROVIDERS[model.provider];

  return (
    <div className={`${styles.defaultPill} ${styles.defaultPillActive}`}>
      <span className={styles.defaultPillLabel}>Default</span>
      <span className={styles.defaultPillDot} style={{ backgroundColor: provider.accentColor }} />
      <span className={styles.defaultPillName}>{model.name}</span>
      <StarIcon filled={true} />
      <button
        className={styles.defaultPillClear}
        onClick={onClear}
        title="Revert to Auto"
        aria-label="Remove default model"
      >
        {'\u2715'}
      </button>
    </div>
  );
}

function FilterDropdown({ activeFilter, onFilterChange, providerModelMap }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const totalModels = MODELS.length;
  const activeLabel =
    activeFilter === PROVIDER_FILTER_ALL ? 'All Providers' : PROVIDERS[activeFilter].name;
  const activeCount =
    activeFilter === PROVIDER_FILTER_ALL ? totalModels : providerModelMap[activeFilter].length;

  return (
    <div className={styles.filterDropdownWrap} ref={ref}>
      <button
        className={styles.filterDropdownTrigger}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className={styles.filterTriggerLabel}>
          {activeLabel}
          <span className={styles.filterTriggerCount}>{activeCount}</span>
        </span>
        <span className={`${styles.filterChevron} ${open ? styles.filterChevronOpen : ''}`}>
          <ChevronDownIcon />
        </span>
      </button>
      {open && (
        <div className={styles.filterDropdownMenu}>
          <button
            className={`${styles.filterOption} ${
              activeFilter === PROVIDER_FILTER_ALL ? styles.filterOptionActive : ''
            }`}
            onClick={() => {
              onFilterChange(PROVIDER_FILTER_ALL);
              setOpen(false);
            }}
          >
            <span className={styles.filterOptionLabel}>All Providers</span>
            <span className={styles.filterOptionCount}>{totalModels}</span>
          </button>
          {PROVIDER_ORDER.map((pid) => {
            const provider = PROVIDERS[pid];
            const count = providerModelMap[pid]?.length || 0;
            if (count === 0) return null;
            return (
              <button
                key={pid}
                className={`${styles.filterOption} ${
                  activeFilter === pid ? styles.filterOptionActive : ''
                }`}
                onClick={() => {
                  onFilterChange(pid);
                  setOpen(false);
                }}
              >
                <span className={styles.filterOptionLeft}>
                  <span
                    className={styles.filterOptionDot}
                    style={{ backgroundColor: provider.accentColor }}
                  />
                  <span className={styles.filterOptionLabel}>{provider.name}</span>
                </span>
                <span className={styles.filterOptionCount}>{count}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ModelCard({ model, isDefault, onSetDefault, isProLocked }) {
  const [expanded, setExpanded] = useState(false);
  const provider = PROVIDERS[model.provider];

  const handleStarClick = (e) => {
    e.stopPropagation();
    if (isProLocked) return;
    onSetDefault(isDefault ? null : model.id);
  };

  const handleExpand = () => {
    if (isProLocked) return;
    setExpanded(!expanded);
  };

  return (
    <div
      className={`${styles.card} ${expanded ? styles.cardExpanded : ''} ${
        isDefault ? styles.cardDefault : ''
      } ${isProLocked ? styles.cardProLocked : ''}`}
    >
      {/* Card Header -- always visible */}
      <button
        className={`${styles.cardHeader} ${isProLocked ? styles.cardHeaderLocked : ''}`}
        onClick={handleExpand}
        aria-expanded={expanded}
      >
        <div className={styles.cardHeaderLeft}>
          {/* Provider chip */}
          <span
            className={styles.providerChip}
            style={{
              '--chip-bg': provider.accentBg,
              '--chip-text': provider.accentText,
              '--chip-bg-dark': provider.accentBgDark,
            }}
          >
            {provider.shortName}
          </span>

          <div className={styles.cardTitleBlock}>
            <div className={styles.cardTitleRow}>
              <span className={styles.cardName}>{model.name}</span>
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
              {isProLocked && <ProBadge />}
              {isDefault && <span className={styles.defaultBadge}>Default</span>}
            </div>
            <p className={styles.cardTagline}>{model.tagline}</p>
          </div>
        </div>

        <div className={styles.cardHeaderRight}>
          <div className={styles.cardMeta}>
            <SpeedBadge tier={model.speedTier} />
            <span className={styles.metaChip}>{formatTokens(model.context.inputTokens)} ctx</span>
            <span className={styles.priceMeta}>
              $
              {model.pricing.inputPerM < 1
                ? model.pricing.inputPerM.toFixed(3)
                : model.pricing.inputPerM.toFixed(2)}
              <span className={styles.priceUnit}>/M in</span>
            </span>
          </div>

          {!isProLocked && (
            <button
              className={`${styles.starBtn} ${isDefault ? styles.starActive : ''}`}
              onClick={handleStarClick}
              title={isDefault ? 'Remove as default' : 'Set as default model'}
              aria-label={isDefault ? 'Remove as default' : 'Set as default model'}
            >
              <StarIcon filled={isDefault} />
            </button>
          )}

          {!isProLocked && (
            <span className={`${styles.expandChevron} ${expanded ? styles.chevronUp : ''}`}>
              <ChevronDownIcon />
            </span>
          )}
        </div>
      </button>

      {/* Expanded detail panel */}
      {!isProLocked && (
        <div className={`${styles.cardBody} ${expanded ? styles.cardBodyOpen : ''}`}>
          <div className={styles.cardBodyInner}>
            {/* Description */}
            <p className={styles.description}>{model.description}</p>

            {/* Stats row */}
            <div className={styles.statsGrid}>
              <div className={styles.statBlock}>
                <span className={styles.statLabel}>Input pricing</span>
                <span className={styles.statValue}>
                  $
                  {model.pricing.inputPerM < 1
                    ? model.pricing.inputPerM.toFixed(3)
                    : model.pricing.inputPerM.toFixed(2)}
                  <span className={styles.statUnit}> / M tokens</span>
                </span>
              </div>
              <div className={styles.statBlock}>
                <span className={styles.statLabel}>Output pricing</span>
                <span className={styles.statValue}>
                  $
                  {model.pricing.outputPerM < 1
                    ? model.pricing.outputPerM.toFixed(3)
                    : model.pricing.outputPerM.toFixed(2)}
                  <span className={styles.statUnit}> / M tokens</span>
                </span>
              </div>
              <div className={styles.statBlock}>
                <span className={styles.statLabel}>Context window</span>
                <span className={styles.statValue}>
                  {formatTokens(model.context.inputTokens)}
                  <span className={styles.statUnit}> tokens</span>
                </span>
              </div>
              <div className={styles.statBlock}>
                <span className={styles.statLabel}>Max output</span>
                <span className={styles.statValue}>
                  {formatTokens(model.context.outputTokens)}
                  <span className={styles.statUnit}> tokens</span>
                </span>
              </div>
            </div>

            {/* Capabilities */}
            <div className={styles.capabilitiesSection}>
              <span className={styles.sectionLabel}>Capabilities</span>
              <div className={styles.capabilityPills}>
                <CapabilityPill supported={model.capabilities.vision} label="Vision" />
                <CapabilityPill supported={model.capabilities.audio} label="Audio" />
                <CapabilityPill
                  supported={model.capabilities.extendedThinking}
                  label="Extended Thinking"
                />
                <CapabilityPill supported={model.capabilities.webSearch} label="Web Search" />
                <CapabilityPill
                  supported={model.capabilities.functionCalling}
                  label="Function Calling"
                />
                <CapabilityPill supported={model.capabilities.streaming} label="Streaming" />
              </div>
            </div>

            {/* Best for */}
            <div className={styles.bestForSection}>
              <span className={styles.sectionLabel}>Best for</span>
              <div className={styles.bestForTags}>
                {model.bestFor.map((tag) => (
                  <span key={tag} className={styles.bestForTag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Set default CTA */}
            <div className={styles.defaultCta}>
              <button
                className={`${styles.setDefaultBtn} ${isDefault ? styles.setDefaultActive : ''}`}
                onClick={() => onSetDefault(isDefault ? null : model.id)}
              >
                <StarIcon filled={isDefault} />
                {isDefault ? 'Default model \u2014 click to remove' : 'Set as default model'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProviderSection({
  providerId,
  models,
  defaultModelId,
  onSetDefault,
  startOpen,
  userTier,
}) {
  const [open, setOpen] = useState(startOpen);
  const provider = PROVIDERS[providerId];

  return (
    <div className={styles.providerSection}>
      <button className={styles.providerHeader} onClick={() => setOpen(!open)} aria-expanded={open}>
        <div className={styles.providerHeaderLeft}>
          <div
            className={styles.providerLogoWrap}
            style={{
              '--chip-bg': provider.accentBg,
              '--chip-text': provider.accentText,
              '--chip-bg-dark': provider.accentBgDark,
            }}
          >
            <span className={styles.providerLogo}>{provider.logoChar}</span>
          </div>
          <span className={styles.providerName}>{provider.name}</span>
          <span className={styles.providerCount}>
            {models.length} model{models.length !== 1 ? 's' : ''}
          </span>
        </div>
        <span className={`${styles.providerChevron} ${open ? styles.providerChevronOpen : ''}`}>
          <ChevronDownIcon />
        </span>
      </button>
      <div className={`${styles.modelList} ${open ? styles.modelListOpen : ''}`}>
        {models.map((model) => {
          const isProLocked =
            userTier === ACCESS_TIERS.free && model.accessTier === ACCESS_TIERS.pro;
          return (
            <ModelCard
              key={model.id}
              model={model}
              isDefault={defaultModelId === model.id}
              onSetDefault={onSetDefault}
              isProLocked={isProLocked}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function ModelsView() {
  const [activeFilter, setActiveFilter] = useState(PROVIDER_FILTER_ALL);
  const [defaultModelId, setDefaultModelId] = useState(getDefaultModel);
  const userTier = getUserTier();

  const handleSetDefault = (modelId) => {
    setDefaultModelId(modelId);
    if (modelId) {
      saveDefaultModel(modelId);
    } else {
      localStorage.removeItem('araviel-default-model');
    }
  };

  const defaultModel = MODELS.find((m) => m.id === defaultModelId);

  const filteredProviders = activeFilter === PROVIDER_FILTER_ALL ? PROVIDER_ORDER : [activeFilter];

  const providerModelMap = {};
  for (const pid of PROVIDER_ORDER) {
    const providerModels = MODELS.filter((m) => m.provider === pid);
    if (providerModels.length > 0) {
      providerModelMap[pid] = providerModels;
    }
  }

  // Only show providers that have models
  const visibleProviders = filteredProviders.filter((pid) => providerModelMap[pid]?.length > 0);

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

      {/* Toolbar: filter + default model pill */}
      <div className={styles.toolbar}>
        <FilterDropdown
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          providerModelMap={providerModelMap}
        />
        <DefaultModelPill model={defaultModel} onClear={() => handleSetDefault(null)} />
      </div>

      {/* Model sections */}
      <div className={styles.content}>
        {visibleProviders.map((pid, idx) => (
          <ProviderSection
            key={pid}
            providerId={pid}
            models={providerModelMap[pid]}
            defaultModelId={defaultModelId}
            onSetDefault={handleSetDefault}
            startOpen={idx === 0}
            userTier={userTier}
          />
        ))}
      </div>
    </div>
  );
}
