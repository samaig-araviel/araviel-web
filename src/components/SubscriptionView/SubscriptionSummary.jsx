import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  selectCurrentTier,
  selectBillingCycle,
  selectIsFirstMonth,
  selectPeriodEnd,
  selectCancelAtPeriodEnd,
  selectSubscriptionStatus,
  selectPortalLoading,
  fetchSubscriptionThunk,
  createPortalThunk,
} from '../../store/slices/subscriptionSlice';
import { selectIsAuthenticated } from '../../store/slices/authSlice';
import { getTierById, getDisplayPrice, SubscriptionTier } from '../../config/subscription';
import styles from './SubscriptionView.module.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusLabel(tier, cancelAtPeriodEnd) {
  if (tier === SubscriptionTier.Free) return { label: 'Free tier', className: styles.statusActive };
  if (cancelAtPeriodEnd) return { label: 'Cancelling', className: styles.statusCancelled };
  return { label: 'Active', className: styles.statusActive };
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Plan overview + quick actions — the shared body of the standalone
 * `/subscription` page and the `subscription` section inside Settings.
 * Keeps layout wrapping (headers, hero, page chrome) out of scope so host
 * components can place this in either a full-page or section context.
 *
 * Detailed credit usage lives on the dedicated Usage & credits page,
 * reachable via the "View detailed usage" quick action.
 *
 * Fetches subscription data on mount when the user is authenticated and no
 * load has happened yet. Subsequent mounts rely on the Redux cache.
 *
 * @param {object} props
 * @param {string} [props.usageLinkTo='/settings/usage'] - Route the "View
 *   detailed usage" button navigates to. Overridable for hosts that want to
 *   link elsewhere or omit the button entirely.
 * @param {boolean} [props.showUsageLink=true] - Whether to render the
 *   "View detailed usage" quick-action button.
 */
export default function SubscriptionSummary({
  usageLinkTo = '/settings/usage',
  showUsageLink = true,
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentTier = useSelector(selectCurrentTier);
  const billingCycle = useSelector(selectBillingCycle);
  const isFirstMonth = useSelector(selectIsFirstMonth);
  const periodEnd = useSelector(selectPeriodEnd);
  const cancelAtPeriodEnd = useSelector(selectCancelAtPeriodEnd);
  const subscriptionStatus = useSelector(selectSubscriptionStatus);
  const portalLoading = useSelector(selectPortalLoading);

  useEffect(() => {
    if (isAuthenticated && subscriptionStatus === 'idle') {
      dispatch(fetchSubscriptionThunk());
    }
  }, [isAuthenticated, subscriptionStatus, dispatch]);

  if (subscriptionStatus === 'loading') {
    return (
      <div className={styles.loading} role="status" aria-live="polite">
        <div className={styles.loadingSpinner} aria-hidden="true" />
        <span>Loading subscription...</span>
      </div>
    );
  }

  const tierInfo = getTierById(currentTier);
  const tierName =
    tierInfo?.name || currentTier?.charAt(0).toUpperCase() + currentTier?.slice(1) || 'Free';
  const isFree = currentTier === SubscriptionTier.Free;
  const isPaid = !isFree;
  const status = getStatusLabel(currentTier, cancelAtPeriodEnd);
  const price = tierInfo ? getDisplayPrice(tierInfo, billingCycle) : 0;

  const tierBadgeClass =
    currentTier === 'pro'
      ? styles.tierBadgePro
      : currentTier === 'lite'
      ? styles.tierBadgeLite
      : styles.tierBadgeFree;

  return (
    <>
      {/* ── Plan overview ── */}
      <div className={styles.planCard}>
        <div className={styles.planCardHeader}>
          <div className={styles.planCardLeft}>
            <span className={`${styles.tierBadge} ${tierBadgeClass}`}>{tierName}</span>
            <span className={`${styles.statusBadge} ${status.className}`}>{status.label}</span>
          </div>
          {isFirstMonth && <span className={styles.firstMonthTag}>First month bonus</span>}
        </div>

        <div className={styles.planDetails}>
          <div className={styles.planDetailItem}>
            <span className={styles.planDetailLabel}>Plan</span>
            <span className={styles.planDetailValue}>{tierName}</span>
          </div>
          <div className={styles.planDetailItem}>
            <span className={styles.planDetailLabel}>Price</span>
            <span className={styles.planDetailValue}>{price === 0 ? 'Free' : `£${price}/mo`}</span>
          </div>
          {isPaid && (
            <div className={styles.planDetailItem}>
              <span className={styles.planDetailLabel}>Billing</span>
              <span className={styles.planDetailValue}>
                {billingCycle === 'annual' ? 'Annual' : 'Monthly'}
              </span>
            </div>
          )}
          {isPaid && periodEnd && (
            <div className={styles.planDetailItem}>
              <span className={styles.planDetailLabel}>
                {cancelAtPeriodEnd ? 'Expires' : 'Next billing'}
              </span>
              <span className={styles.planDetailValue}>{formatDate(periodEnd)}</span>
            </div>
          )}
          {isPaid && !cancelAtPeriodEnd && price > 0 && (
            <div className={styles.planDetailItem}>
              <span className={styles.planDetailLabel}>Next amount</span>
              <span className={styles.planDetailValue}>
                £{billingCycle === 'annual' ? tierInfo?.annualPricePerMonth * 12 : price}
              </span>
            </div>
          )}
        </div>

        {cancelAtPeriodEnd && (
          <div className={styles.cancelNotice}>
            Your plan will be cancelled at the end of the current billing period. You can reactivate
            anytime before then.
          </div>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <div className={styles.actionsCard}>
        <div className={styles.actions}>
          {isPaid && (
            <button
              className={styles.primaryBtn}
              onClick={() => dispatch(createPortalThunk())}
              disabled={portalLoading}
            >
              {portalLoading ? 'Opening...' : 'Manage Subscription'}
            </button>
          )}
          {(isFree || currentTier === SubscriptionTier.Lite) && (
            <button
              className={isFree ? styles.primaryBtn : styles.secondaryBtn}
              onClick={() => navigate('/plans')}
            >
              Upgrade Plan
            </button>
          )}
          {showUsageLink && (
            <button className={styles.secondaryBtn} onClick={() => navigate(usageLinkTo)}>
              View detailed usage
            </button>
          )}
        </div>
      </div>
    </>
  );
}
