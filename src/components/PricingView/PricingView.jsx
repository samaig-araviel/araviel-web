import { useSelector, useDispatch } from 'react-redux';
import {
  selectCurrentTier,
  selectBillingCycle,
  setBillingCycle,
} from '../../store/slices/subscriptionSlice';
import { setActiveItem } from '../../store/slices/sidebarSlice';
import { getAvailableTiers } from '../../config/subscription';
import BillingToggle from './BillingToggle';
import TierCard from './TierCard';
import FeatureComparisonTable from './FeatureComparisonTable';
import styles from './PricingView.module.css';

export default function PricingView() {
  const dispatch = useDispatch();
  const currentTier = useSelector(selectCurrentTier);
  const billingCycle = useSelector(selectBillingCycle);
  const tiers = getAvailableTiers();

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        {/* Header */}
        <div className={styles.header}>
          <button
            className={styles.backBtn}
            onClick={() => dispatch(setActiveItem('home'))}
            aria-label="Back to chat"
          >
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
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
        </div>

        {/* Hero */}
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>Choose your plan</h1>
          <p className={styles.heroSubtitle}>
            Access every major AI model through one subscription. Powered by the Araveil Decision
            Engine.
          </p>
          <BillingToggle
            billingCycle={billingCycle}
            onChange={(cycle) => dispatch(setBillingCycle(cycle))}
          />
        </div>

        {/* Tier Cards */}
        <div className={styles.tiersGrid}>
          {tiers.map((tier) => (
            <TierCard
              key={tier.id}
              tier={tier}
              billingCycle={billingCycle}
              currentTier={currentTier}
            />
          ))}
        </div>

        {/* Feature Comparison Table */}
        <FeatureComparisonTable currentTier={currentTier} />

        {/* Footer Note */}
        <div className={styles.footerNote}>
          <p>All plans include access to 6 AI providers.</p>
          <p>Prices shown in GBP. Cancel or change your plan anytime.</p>
        </div>
      </div>
    </div>
  );
}
