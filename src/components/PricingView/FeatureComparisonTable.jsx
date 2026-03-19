import { useState, useMemo } from 'react';
import { FeatureCategory, COMPARISON_FEATURES, getAvailableTiers } from '../../config/subscription';
import styles from './PricingView.module.css';

const CATEGORIES = [
  FeatureCategory.Credits,
  FeatureCategory.Models,
  FeatureCategory.ADE,
  FeatureCategory.Features,
];

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function FeatureValue({ value }) {
  if (value === true) {
    return (
      <svg
        className={styles.tableCheck}
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }
  if (value === false) {
    return (
      <svg
        className={styles.tableX}
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    );
  }
  return <span className={styles.tableValue}>{value}</span>;
}

export default function FeatureComparisonTable({ currentTier }) {
  const [expandedCategories, setExpandedCategories] = useState(
    Object.fromEntries(CATEGORIES.map((c) => [c, true]))
  );
  const [searchQuery, setSearchQuery] = useState('');
  const tiers = getAvailableTiers();

  const toggleCategory = (cat) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const getFeatureValue = (tier, featureName) => {
    const feature = tier.features.find((f) => f.name === featureName);
    return feature ? feature.value : false;
  };

  // Filter features based on search query
  const filteredFeaturesByCategory = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return null; // null means show all (unfiltered)

    const result = {};
    CATEGORIES.forEach((category) => {
      const features = COMPARISON_FEATURES.filter(
        (f) =>
          f.category === category &&
          (f.name.toLowerCase().includes(query) ||
            tiers.some(() => {
              const feat = tiers.some((tier) => {
                const val = getFeatureValue(tier, f.name);
                return typeof val === 'string' && val.toLowerCase().includes(query);
              });
              return feat;
            }))
      );
      if (features.length > 0) {
        result[category] = features;
      }
    });
    return result;
  }, [searchQuery, tiers]);

  const hasResults =
    !filteredFeaturesByCategory || Object.keys(filteredFeaturesByCategory).length > 0;

  return (
    <div className={styles.comparisonSection}>
      {/* Header row with title and search */}
      <div className={styles.comparisonHeader}>
        <h2 className={styles.comparisonTitle}>Compare plans</h2>
        <div className={styles.searchWrapper}>
          <SearchIcon />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search features"
          />
          {searchQuery && (
            <button
              className={styles.searchClear}
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className={styles.comparisonTable}>
        {/* Sticky tier header */}
        <div className={styles.tableHeader}>
          <div className={styles.tableHeaderLabel}>Features</div>
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`${styles.tableHeaderTier} ${
                currentTier === tier.id ? styles.tableHeaderTierCurrent : ''
              }`}
            >
              <span className={styles.tableHeaderTierName}>{tier.name}</span>
              <button
                className={`${styles.tableHeaderCta} ${
                  currentTier === tier.id ? styles.tableHeaderCtaCurrent : ''
                } ${
                  tier.highlighted && currentTier !== tier.id
                    ? styles.tableHeaderCtaHighlighted
                    : ''
                }`}
                disabled={currentTier === tier.id}
              >
                {currentTier === tier.id ? 'Current' : tier.ctaText.replace('Upgrade to ', '')}
              </button>
            </div>
          ))}
        </div>

        {!hasResults && (
          <div className={styles.noResults}>
            <p>No features match "{searchQuery}"</p>
          </div>
        )}

        {/* Category sections */}
        {CATEGORIES.map((category) => {
          const allFeatures = COMPARISON_FEATURES.filter((f) => f.category === category);
          const features = filteredFeaturesByCategory
            ? filteredFeaturesByCategory[category]
            : allFeatures;

          if (!features || features.length === 0) return null;

          const isExpanded = expandedCategories[category];

          return (
            <div key={category} className={styles.tableSection}>
              <button
                className={styles.tableSectionHeader}
                onClick={() => toggleCategory(category)}
                aria-expanded={isExpanded}
              >
                <span>{category}</span>
                <svg
                  className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ''}`}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {isExpanded && (
                <div className={styles.tableSectionBody}>
                  {features.map((feature) => (
                    <div key={feature.name} className={styles.tableRow}>
                      <div className={styles.tableRowLabel}>{feature.name}</div>
                      {tiers.map((tier) => (
                        <div
                          key={tier.id}
                          className={`${styles.tableRowValue} ${
                            currentTier === tier.id ? styles.tableRowValueCurrent : ''
                          }`}
                        >
                          <FeatureValue value={getFeatureValue(tier, feature.name)} />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
