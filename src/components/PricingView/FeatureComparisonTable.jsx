import { useState } from 'react';
import { FeatureCategory, COMPARISON_FEATURES, getAvailableTiers } from '../../config/subscription';
import styles from './PricingView.module.css';

const CATEGORIES = [
  FeatureCategory.Credits,
  FeatureCategory.Models,
  FeatureCategory.ADE,
  FeatureCategory.Features,
];

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

export default function FeatureComparisonTable({ currentTier, billingCycle }) {
  const [expandedCategories, setExpandedCategories] = useState(
    Object.fromEntries(CATEGORIES.map((c) => [c, true]))
  );
  const tiers = getAvailableTiers();

  const toggleCategory = (cat) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const getFeatureValue = (tier, featureName) => {
    const feature = tier.features.find((f) => f.name === featureName);
    return feature ? feature.value : false;
  };

  return (
    <div className={styles.comparisonTable}>
      <h2 className={styles.comparisonTitle}>Compare plans</h2>

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
            {tier.name}
          </div>
        ))}
      </div>

      {/* Category sections */}
      {CATEGORIES.map((category) => {
        const features = COMPARISON_FEATURES.filter((f) => f.category === category);
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
  );
}
