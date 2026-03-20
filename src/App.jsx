import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectEffectiveTheme } from './store/slices/themeSlice';
import { selectActiveItem } from './store/slices/sidebarSlice';
import { selectAuthLoading } from './store/slices/authSlice';
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
