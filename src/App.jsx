import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectEffectiveTheme } from './store/slices/themeSlice';
import { selectActiveItem, setActiveItem } from './store/slices/sidebarSlice';
import { selectAuthLoading, selectAuthUser } from './store/slices/authSlice';
import { fetchSubscriptionThunk } from './store/slices/subscriptionSlice';
import { subscribeToCreditPackChanges } from './services/credits';
import { SpeedInsights } from '@vercel/speed-insights/react';
import useAuthListener from './hooks/useAuthListener';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import ModelsView from './components/ModelsView';
import ImageGalleryView from './components/ImageGalleryView';
import ConversationsView from './components/ConversationsView';
import ProjectsView from './components/ProjectsView';
import SettingsView from './components/SettingsView';
import PricingView from './components/PricingView/PricingView';
import SubscriptionView from './components/SubscriptionView/SubscriptionView';
import StatusDashboard from './components/StatusDashboard';
import UpgradeModal from './components/UpgradeModal/UpgradeModal';
import styles from './components/Auth/AuthModal.module.css';
import './App.css';

export default function App() {
  const dispatch = useDispatch();

  // Initialize auth listener — subscribes to Supabase auth state changes
  useAuthListener();

  const effectiveTheme = useSelector(selectEffectiveTheme);
  const activeItem = useSelector(selectActiveItem);
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
      const url = new URL(window.location.href);
      url.searchParams.delete('checkout');
      url.searchParams.delete('type');
      window.history.replaceState({}, '', url.pathname + (url.search || ''));

      // For pack purchases: subscribe to Realtime changes on credit_packs table
      // so balance updates as soon as the Stripe webhook inserts the new pack
      if (checkoutType === 'pack' && user?.id) {
        dispatch(setActiveItem('usage'));
        unsubPackRef.current?.();
        unsubPackRef.current = subscribeToCreditPackChanges(user.id, () => {
          dispatch(fetchSubscriptionThunk());
          unsubPackRef.current?.();
          unsubPackRef.current = null;
        });
      } else if (checkoutType === 'pack') {
        // No user id available — fall back to a delayed fetch
        setTimeout(() => {
          dispatch(fetchSubscriptionThunk());
          dispatch(setActiveItem('usage'));
        }, 3000);
      } else {
        // For subscriptions, refresh immediately
        dispatch(fetchSubscriptionThunk());
      }
    }

    // Portal/cancel return: /?view=settings, /?view=pricing, or /?view=usage
    const view = params.get('view');
    if (view === 'settings' || view === 'pricing' || view === 'usage') {
      dispatch(setActiveItem(view));
      const url = new URL(window.location.href);
      url.searchParams.delete('view');
      window.history.replaceState({}, '', url.pathname + (url.search || ''));

      // Refresh subscription after portal return
      if (view === 'settings') {
        dispatch(fetchSubscriptionThunk());
      }
    }
    return () => {
      unsubPackRef.current?.();
      unsubPackRef.current = null;
    };
  }, [dispatch, user?.id]);

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
      {activeItem === 'conversations' ? (
        <ConversationsView />
      ) : activeItem === 'projects' ? (
        <ProjectsView />
      ) : activeItem === 'models' ? (
        <ModelsView />
      ) : activeItem === 'gallery' ? (
        <ImageGalleryView />
      ) : activeItem === 'usage' ? (
        <SettingsView initialSection="usage" />
      ) : activeItem === 'personalisation' ? (
        <SettingsView initialSection="personalization" />
      ) : activeItem === 'settings' ? (
        <SettingsView />
      ) : activeItem === 'pricing' ? (
        <PricingView />
      ) : activeItem === 'subscription' ? (
        <SubscriptionView />
      ) : activeItem === 'status' ? (
        <StatusDashboard />
      ) : (
        <MainContent />
      )}
      <UpgradeModal />
      <SpeedInsights />
    </div>
  );
}
