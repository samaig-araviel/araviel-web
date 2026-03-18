import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectShowUpgradeModal,
  selectUpgradeContext,
  selectUpgradeLoading,
  selectCurrentTier,
  selectBillingCycle,
  hideUpgradeModal,
  initiateUpgrade,
  clearUpgradeLoading,
} from '../../store/slices/subscriptionSlice';
import { setActiveItem } from '../../store/slices/sidebarSlice';
import { getTierById, getDisplayPrice, SubscriptionTier } from '../../config/subscription';
import styles from './UpgradeModal.module.css';

const CONTEXT_MESSAGES = {
  credit_limit: "You've used all your credits for this window.",
  model_gated: 'This model is available on a higher plan.',
  feature_gated: 'This feature is available on a higher plan.',
};

function getDefaultSuggestedTier(currentTier) {
  if (currentTier === SubscriptionTier.Free) return SubscriptionTier.Lite;
  if (currentTier === SubscriptionTier.Lite) return SubscriptionTier.Pro;
  return SubscriptionTier.Pro;
}

export default function UpgradeModal() {
  const dispatch = useDispatch();
  const show = useSelector(selectShowUpgradeModal);
  const context = useSelector(selectUpgradeContext);
  const currentTier = useSelector(selectCurrentTier);
  const billingCycle = useSelector(selectBillingCycle);
  const upgradeLoading = useSelector(selectUpgradeLoading);

  useEffect(() => {
    if (!show) return;
    const handle = (e) => {
      if (e.key === 'Escape') dispatch(hideUpgradeModal());
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [show, dispatch]);

  if (!show) return null;

  const suggestedTierId = context?.suggestedTier || getDefaultSuggestedTier(currentTier);
  const suggestedTier = getTierById(suggestedTierId);
  if (!suggestedTier) return null;

  const price = getDisplayPrice(suggestedTier, billingCycle);
  const contextMessage =
    context?.message || CONTEXT_MESSAGES[context?.reason] || 'Upgrade your plan for more access.';
  const isLoading = upgradeLoading === suggestedTierId;

  const handleUpgrade = () => {
    dispatch(initiateUpgrade(suggestedTierId));
    // Stripe integration placeholder — log intent and clear
    console.log(
      `[Araveil] Upgrade initiated: ${currentTier} → ${suggestedTierId} (${billingCycle})`
    );
    setTimeout(() => {
      dispatch(clearUpgradeLoading());
    }, 1500);
  };

  const handleViewPlans = () => {
    dispatch(hideUpgradeModal());
    dispatch(setActiveItem('pricing'));
  };

  return (
    <div className={styles.overlay} onClick={() => dispatch(hideUpgradeModal())}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Upgrade to ${suggestedTier.name}`}
      >
        {/* Context message */}
        <div className={styles.context}>
          {context?.reason === 'model_gated' && context?.modelName && (
            <p className={styles.contextModel}>
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
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              {context.modelName}
            </p>
          )}
          <p className={styles.contextMessage}>{contextMessage}</p>
        </div>

        {/* Suggested tier */}
        <div className={styles.tierPreview}>
          <div className={styles.tierPreviewHeader}>
            <h3 className={styles.tierPreviewName}>{suggestedTier.name}</h3>
            <span className={styles.tierPreviewTagline}>{suggestedTier.tagline}</span>
          </div>

          <div className={styles.tierPreviewPrice}>
            <span className={styles.tierPreviewAmount}>£{price.toFixed(2)}</span>
            <span className={styles.tierPreviewUnit}>/month</span>
          </div>

          <ul className={styles.tierPreviewFeatures}>
            <li>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {suggestedTier.dailyCredits} credits/day
            </li>
            <li>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {suggestedTier.modelCount} models across {suggestedTier.providerCount} providers
            </li>
            {suggestedTier.firstMonthBonusCredits > 0 && (
              <li className={styles.bonusLine}>
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
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                First month: {suggestedTier.firstMonthBonusCredits} credits/day
              </li>
            )}
          </ul>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.upgradeBtn} onClick={handleUpgrade} disabled={isLoading}>
            {isLoading ? 'Processing...' : `Upgrade to ${suggestedTier.name}`}
          </button>
          <button className={styles.viewPlansBtn} onClick={handleViewPlans}>
            View all plans
          </button>
          <button className={styles.dismissBtn} onClick={() => dispatch(hideUpgradeModal())}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
