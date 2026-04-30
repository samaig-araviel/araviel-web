import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Outlet, useNavigate } from 'react-router-dom';
import { selectEffectiveTheme } from './store/slices/themeSlice';
import { selectAuthLoading, selectAuthUser } from './store/slices/authSlice';
import { fetchSubscriptionThunk, setImageCredits } from './store/slices/subscriptionSlice';
import { setCreditBalance } from './store/slices/chatSlice';
import { subscribeToCreditPackChanges, fetchCreditBalance } from './services/credits';
import { SpeedInsights } from '@vercel/speed-insights/react';
import useAuthListener from './hooks/useAuthListener';
import useAnswerFont from './hooks/useAnswerFont';
import useUsageLimitWarnings from './hooks/useUsageLimitWarnings';
import Sidebar from './components/Sidebar';
import UpgradeModal from './components/UpgradeModal/UpgradeModal';
import AgeGate from './components/AgeGate/AgeGate';
import styles from './components/Auth/AuthModal.module.css';
import './App.css';

export default function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Initialize auth listener — subscribes to Supabase auth state changes
  useAuthListener();
  // Apply the answer-font CSS variable based on the user's saved preference.
  useAnswerFont();
  // Watch credit balances and warn when configured thresholds are crossed.
  useUsageLimitWarnings();

  const effectiveTheme = useSelector(selectEffectiveTheme);
  const authLoading = useSelector(selectAuthLoading);
  const user = useSelector(selectAuthUser);
  const unsubPackRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }, [effectiveTheme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      // Force re-render to update effective theme
      const event = new Event('themechange');
      window.dispatchEvent(event);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Handle URL params from Stripe redirects (checkout success, portal return)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Post-checkout: /?checkout=success (for subscriptions and packs)
    if (params.get('checkout') === 'success') {
      const checkoutType = params.get('type');

      // Refresh both subscription slice and image credit balance after pack purchase
      const refreshAllCredits = () => {
        dispatch(fetchSubscriptionThunk());
        fetchCreditBalance()
          .then((data) => {
            if (data.balance) {
              dispatch(setCreditBalance(data.balance));
              dispatch(
                setImageCredits({
                  used: data.balance.monthly?.used ?? 0,
                  limit: data.balance.monthly?.total ?? 5,
                  remaining: data.balance.monthly?.remaining ?? 0,
                  packRemaining: data.balance.packs?.remaining ?? 0,
                  cycleResetsAt: data.balance.cycleResetsAt ?? null,
                })
              );
            }
          })
          .catch(() => {});
      };

      // For pack purchases: subscribe to Realtime changes on credit_packs table
      // so balance updates as soon as the Stripe webhook inserts the new pack
      if (checkoutType === 'pack' && user?.id) {
        navigate('/settings/usage', { replace: true });
        unsubPackRef.current?.();
        unsubPackRef.current = subscribeToCreditPackChanges(user.id, () => {
          refreshAllCredits();
          unsubPackRef.current?.();
          unsubPackRef.current = null;
        });
      } else if (checkoutType === 'pack') {
        // No user id available — fall back to a delayed fetch
        setTimeout(() => {
          refreshAllCredits();
          navigate('/settings/usage', { replace: true });
        }, 3000);
      } else {
        // For subscriptions, refresh immediately
        refreshAllCredits();
        navigate('/', { replace: true });
      }
    }

    // Portal/cancel return: /?view=settings, /?view=pricing, or /?view=usage
    const view = params.get('view');
    if (view === 'settings') {
      navigate('/settings', { replace: true });
      dispatch(fetchSubscriptionThunk());
    } else if (view === 'pricing') {
      navigate('/plans', { replace: true });
    } else if (view === 'usage') {
      navigate('/settings/usage', { replace: true });
    }
    return () => {
      unsubPackRef.current?.();
      unsubPackRef.current = null;
    };
  }, [dispatch, navigate, user?.id]);

  // Show loading screen while checking initial auth session
  if (authLoading) {
    return (
      <div className={styles.loadingOverlay}>
        <div className={styles.loadingLogo}>A</div>
        <div className={styles.loadingSpinner} />
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar />
      <AgeGate>
        <Outlet />
      </AgeGate>
      <UpgradeModal />
      <SpeedInsights />
    </div>
  );
}
