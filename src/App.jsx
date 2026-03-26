import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectEffectiveTheme } from './store/slices/themeSlice';
import { selectActiveItem, setActiveItem } from './store/slices/sidebarSlice';
import { selectAuthLoading } from './store/slices/authSlice';
import { fetchSubscriptionThunk } from './store/slices/subscriptionSlice';
import { setUserTier } from './data/models';
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

    // Post-checkout: /?checkout=success
    if (params.get('checkout') === 'success') {
      const url = new URL(window.location.href);
      url.searchParams.delete('checkout');
      window.history.replaceState({}, '', url.pathname + (url.search || ''));

      // Refresh subscription state from server
      dispatch(fetchSubscriptionThunk()).then((action) => {
        if (action.payload?.tier) {
          setUserTier(action.payload.tier);
        }
      });

      // Notify components (Toast listener in Sidebar/MainContent can pick this up)
      window.dispatchEvent(new CustomEvent('araviel-subscription-activated'));
    }

    // Portal/cancel return: /?view=settings or /?view=pricing
    const view = params.get('view');
    if (view === 'settings' || view === 'pricing') {
      dispatch(setActiveItem(view));
      const url = new URL(window.location.href);
      url.searchParams.delete('view');
      window.history.replaceState({}, '', url.pathname + (url.search || ''));

      // Refresh subscription after portal return
      if (view === 'settings') {
        dispatch(fetchSubscriptionThunk()).then((action) => {
          if (action.payload?.tier) {
            setUserTier(action.payload.tier);
          }
        });
      }
    }
  }, [dispatch]);

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
      ) : activeItem === 'settings' ? (
        <SettingsView />
      ) : activeItem === 'pricing' ? (
        <PricingView />
      ) : (
        <MainContent />
      )}
      <UpgradeModal />
      <SpeedInsights />
    </div>
  );
}
