import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useScrollRestoration from '../../hooks/useScrollRestoration';
import {
  selectCurrentTier,
  selectBillingCycle,
  selectCheckoutLoading,
  selectSubscriptionError,
  setBillingCycle,
  createCheckoutThunk,
  createPortalThunk,
} from '../../store/slices/subscriptionSlice';
import { selectIsAuthenticated } from '../../store/slices/authSlice';
import { getAvailableTiers, SubscriptionTier } from '../../config/subscription';
import BillingToggle from './BillingToggle';
import TierCard from './TierCard';
import { useToast } from '../Toast/Toast';
import styles from './PricingView.module.css';

export default function PricingView() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { showError } = useToast();
  const currentTier = useSelector(selectCurrentTier);
  const billingCycle = useSelector(selectBillingCycle);
  const checkoutLoading = useSelector(selectCheckoutLoading);
  const subscriptionError = useSelector(selectSubscriptionError);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const pageRef = useRef(null);
  useScrollRestoration(pageRef);
  const tiers = getAvailableTiers();

  const handleCtaClick = (tier) => {
    if (!isAuthenticated) {
      navigate('/signup', { state: { from: location.pathname + location.search } });
      return;
    }

    // Free tier or already on this plan — no action
    if (tier.monthlyPrice === 0 || currentTier === tier.id) return;

    // Existing paid subscriber changing plan → Stripe Billing Portal
    if (currentTier !== SubscriptionTier.Free) {
      dispatch(createPortalThunk());
      return;
    }

    // Free user subscribing → Stripe Checkout
    dispatch(createCheckoutThunk({ tier: tier.id, interval: billingCycle }));
  };

  // Show error toast when checkout or portal fails
  useEffect(() => {
    if (subscriptionError) {
      showError(subscriptionError);
    }
  }, [subscriptionError, showError]);

  return (
    <div ref={pageRef} className={styles.container}>
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
              isAuthenticated={isAuthenticated}
              onCtaClick={handleCtaClick}
              loading={checkoutLoading}
            />
          ))}
        </div>

        {/* Footer Note */}
        <div className={styles.footerNote}>
          <p>All plans include access to 6 AI providers.</p>
          <p>Prices shown in GBP. Cancel or change your plan anytime.</p>
        </div>
      </div>
    </div>
  );
}
