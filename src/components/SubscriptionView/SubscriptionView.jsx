import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  selectCurrentTier,
  selectBillingCycle,
  selectIsFirstMonth,
  selectPeriodEnd,
  selectCancelAtPeriodEnd,
  selectSubscriptionStatus,
  selectTextCredits,
  selectImageCredits,
  selectPortalLoading,
  fetchSubscriptionThunk,
  createPortalThunk,
} from '../../store/slices/subscriptionSlice';
import { selectIsAuthenticated } from '../../store/slices/authSlice';
import { getTierById, getDisplayPrice, SubscriptionTier } from '../../config/subscription';
import GuestGate from '../GuestGate/GuestGate';
import styles from './SubscriptionView.module.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusLabel(tier, cancelAtPeriodEnd) {
  if (tier === SubscriptionTier.Free) return { label: 'Free tier', className: styles.statusActive };
  if (cancelAtPeriodEnd) return { label: 'Cancelling', className: styles.statusCancelled };
  return { label: 'Active', className: styles.statusActive };
}

function getCreditColor(remaining, limit) {
  if (limit === 0) return styles.creditHealthy;
  const ratio = remaining / limit;
  if (ratio > 0.5) return styles.creditHealthy;
  if (ratio > 0.2) return styles.creditLow;
  return styles.creditCritical;
}

function getCreditPct(remaining, limit) {
  if (limit === 0) return 0;
  return Math.min(100, Math.round((remaining / limit) * 100));
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SubscriptionView() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentTier = useSelector(selectCurrentTier);
  const billingCycle = useSelector(selectBillingCycle);
  const isFirstMonth = useSelector(selectIsFirstMonth);
  const periodEnd = useSelector(selectPeriodEnd);
  const cancelAtPeriodEnd = useSelector(selectCancelAtPeriodEnd);
  const subscriptionStatus = useSelector(selectSubscriptionStatus);
  const textCredits = useSelector(selectTextCredits);
  const imageCredits = useSelector(selectImageCredits);
  const portalLoading = useSelector(selectPortalLoading);

  useEffect(() => {
    if (isAuthenticated && subscriptionStatus === 'idle') {
      dispatch(fetchSubscriptionThunk());
    }
  }, [isAuthenticated, subscriptionStatus, dispatch]);

  if (!isAuthenticated) {
    return (
      <div className={styles.container}>
        <div className={styles.inner}>
          <GuestGate
            title="View your subscription"
            description="Sign in to manage your plan, track usage, and view billing details."
            actionLabel="Sign in to continue"
          />
        </div>
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

  // Text credits
  const monthlyLimit = textCredits?.monthlyLimit || 0;
  const monthlyUsed = textCredits?.monthlyUsed || 0;
  const monthlyRemaining = Math.max(0, monthlyLimit - monthlyUsed);

  // 3-hour window
  const windowLimit = textCredits?.windowLimit || 0;
  const windowUsed = textCredits?.windowUsed || 0;
  const windowRemaining = Math.max(0, windowLimit - windowUsed);
  const windowResetAt = textCredits?.windowResetAt;

  // Image credits
  const imgRemaining = imageCredits?.remaining || 0;
  const imgLimit = imageCredits?.limit || 0;
  const packRemaining = imageCredits?.packRemaining || 0;
  const cycleResetsAt = imageCredits?.cycleResetsAt;

  const tierBadgeClass =
    currentTier === 'pro'
      ? styles.tierBadgePro
      : currentTier === 'lite'
      ? styles.tierBadgeLite
      : styles.tierBadgeFree;

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        {/* Header */}
        <div className={styles.header}>
          <button
            className={styles.backBtn}
            onClick={() => navigate('/')}
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
          <h1 className={styles.heroTitle}>My Subscription</h1>
          <p className={styles.heroSubtitle}>
            Manage your plan, monitor credit usage, and access billing.
          </p>
        </div>

        {subscriptionStatus === 'loading' ? (
          <div className={styles.loading}>
            <div className={styles.loadingSpinner} />
            <span>Loading subscription...</span>
          </div>
        ) : (
          <>
            {/* ── Plan overview ── */}
            <div className={styles.planCard}>
              <div className={styles.planCardHeader}>
                <div className={styles.planCardLeft}>
                  <span className={`${styles.tierBadge} ${tierBadgeClass}`}>{tierName}</span>
                  <span className={`${styles.statusBadge} ${status.className}`}>
                    {status.label}
                  </span>
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
                  <span className={styles.planDetailValue}>
                    {price === 0 ? 'Free' : `£${price}/mo`}
                  </span>
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
                  Your plan will be cancelled at the end of the current billing period. You can
                  reactivate anytime before then.
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
                <button
                  className={styles.secondaryBtn}
                  onClick={() => navigate('/settings/usage')}
                >
                  View Detailed Usage
                </button>
              </div>
            </div>

            {/* ── Credit usage ── */}
            <h2 className={styles.sectionTitle}>Credit Usage</h2>
            <div className={styles.creditsCard}>
              <div className={styles.creditSections}>
                {/* Text credits (monthly) */}
                <div className={styles.creditSection}>
                  <div className={styles.creditHeader}>
                    <span className={styles.creditLabel}>Text credits</span>
                    <span className={styles.creditCount}>
                      {monthlyRemaining} / {monthlyLimit} remaining
                    </span>
                  </div>
                  <div className={styles.creditBar}>
                    <div
                      className={`${styles.creditFill} ${getCreditColor(
                        monthlyRemaining,
                        monthlyLimit
                      )}`}
                      style={{ width: `${getCreditPct(monthlyRemaining, monthlyLimit)}%` }}
                    />
                  </div>
                </div>

                {/* 3-hour session window */}
                <div className={styles.creditSection}>
                  <div className={styles.creditHeader}>
                    <span className={styles.creditLabel}>Session window</span>
                    <span className={styles.creditCount}>
                      {windowRemaining} / {windowLimit} remaining
                    </span>
                  </div>
                  <div className={styles.creditBar}>
                    <div
                      className={`${styles.creditFill} ${getCreditColor(
                        windowRemaining,
                        windowLimit
                      )}`}
                      style={{ width: `${getCreditPct(windowRemaining, windowLimit)}%` }}
                    />
                  </div>
                  {windowResetAt && (
                    <span className={styles.creditMeta}>Resets at {formatTime(windowResetAt)}</span>
                  )}
                </div>

                <div className={styles.creditDivider} />

                {/* Image credits */}
                <div className={styles.creditSection}>
                  <div className={styles.creditHeader}>
                    <span className={styles.creditLabel}>Image credits</span>
                    <span className={styles.creditCount}>
                      {imgRemaining} / {imgLimit} remaining
                    </span>
                  </div>
                  <div className={styles.creditBar}>
                    <div
                      className={`${styles.creditFill} ${getCreditColor(imgRemaining, imgLimit)}`}
                      style={{ width: `${getCreditPct(imgRemaining, imgLimit)}%` }}
                    />
                  </div>
                  {cycleResetsAt && (
                    <span className={styles.creditMeta}>Resets {formatDate(cycleResetsAt)}</span>
                  )}
                </div>

                {/* Pack credits */}
                {packRemaining > 0 && (
                  <div className={styles.packCredits}>
                    <span>Credit pack balance</span>
                    <span className={styles.packCreditsValue}>{packRemaining} credits</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
