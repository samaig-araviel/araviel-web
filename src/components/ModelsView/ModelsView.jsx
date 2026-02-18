import { useState, useRef, useEffect } from 'react';
import { MODELS, PROVIDERS, PROVIDER_ORDER, SPEED_TIERS, formatTokens } from '../../data/models';
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

function DefaultModelCard({ model, onSetDefault }) {
  if (!model) {
    return (
      <div className={styles.defaultCard}>
        <div className={styles.defaultCardInner}>
          <div className={styles.defaultCardHeader}>
            <span className={styles.defaultLabel}>Default Model</span>
          </div>
          <div className={styles.defaultCardBody}>
            <span className={styles.autoGlyph}>{'\u2726'}</span>
            <div className={styles.defaultCardInfo}>
              <span className={styles.defaultCardName}>Auto</span>
              <span className={styles.defaultCardDesc}>Best model selected for each task</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const provider = PROVIDERS[model.provider];

  return (
    <div className={styles.defaultCard}>
      <div className={styles.defaultCardInner}>
        <div className={styles.defaultCardHeader}>
          <span className={styles.defaultLabel}>Default Model</span>
          <button
            className={styles.defaultRemoveBtn}
            onClick={() => onSetDefault(null)}
            title="Remove default and revert to Auto"
          >
            Remove
          </button>
        </div>
        <div className={styles.defaultCardBody}>
          <div
            className={styles.defaultProviderLogo}
            style={{
              '--chip-bg': provider.accentBg,
              '--chip-text': provider.accentText,
              '--chip-bg-dark': provider.accentBgDark,
            }}
          >
            <span>{provider.logoChar}</span>
          </div>
          <div className={styles.defaultCardInfo}>
            <div className={styles.defaultCardNameRow}>
              <span className={styles.defaultCardName}>{model.name}</span>
              <StarIcon filled={true} />
            </div>
            <span className={styles.defaultCardDesc}>{model.tagline}</span>
          </div>
        </div>
        <div className={styles.defaultCardMeta}>
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
      </div>
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
            const count = providerModelMap[pid].length;
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

function ModelCard({ model, isDefault, onSetDefault }) {
  const [expanded, setExpanded] = useState(false);
  const provider = PROVIDERS[model.provider];

  const handleStarClick = (e) => {
    e.stopPropagation();
    onSetDefault(isDefault ? null : model.id);
  };

  return (
    <div
      className={`${styles.card} ${expanded ? styles.cardExpanded : ''} ${
        isDefault ? styles.cardDefault : ''
      }`}
    >
      {/* Card Header -- always visible */}
      <button
        className={styles.cardHeader}
        onClick={() => setExpanded(!expanded)}
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

          <button
            className={`${styles.starBtn} ${isDefault ? styles.starActive : ''}`}
            onClick={handleStarClick}
            title={isDefault ? 'Remove as default' : 'Set as default model'}
            aria-label={isDefault ? 'Remove as default' : 'Set as default model'}
          >
            <StarIcon filled={isDefault} />
          </button>

          <span className={`${styles.expandChevron} ${expanded ? styles.chevronUp : ''}`}>
            <ChevronDownIcon />
          </span>
        </div>
      </button>

      {/* Expanded detail panel */}
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
    </div>
  );
}

function ProviderSection({ providerId, models, defaultModelId, onSetDefault, startOpen }) {
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
        {models.map((model) => (
          <ModelCard
            key={model.id}
            model={model}
            isDefault={defaultModelId === model.id}
            onSetDefault={onSetDefault}
          />
        ))}
      </div>
    </div>
  );
}

export default function ModelsView() {
  const [activeFilter, setActiveFilter] = useState(PROVIDER_FILTER_ALL);
  const [defaultModelId, setDefaultModelId] = useState(getDefaultModel);

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
    providerModelMap[pid] = MODELS.filter((m) => m.provider === pid);
  }

  const totalModels = MODELS.length;

  return (
    <div className={styles.container}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Models</h1>
        <p className={styles.pageSubtitle}>
          {totalModels} AI models across {PROVIDER_ORDER.length} providers
        </p>
      </div>

      {/* Default model featured card */}
      <div className={styles.defaultSection}>
        <DefaultModelCard model={defaultModel} onSetDefault={handleSetDefault} />
      </div>

      {/* Filter dropdown + provider count */}
      <div className={styles.filterBar}>
        <FilterDropdown
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          providerModelMap={providerModelMap}
        />
      </div>

      {/* Model sections */}
      <div className={styles.content}>
        {filteredProviders.map((pid, idx) => (
          <ProviderSection
            key={pid}
            providerId={pid}
            models={providerModelMap[pid]}
            defaultModelId={defaultModelId}
            onSetDefault={handleSetDefault}
            startOpen={idx === 0}
          />
        ))}
      </div>
    </div>
  );
}
