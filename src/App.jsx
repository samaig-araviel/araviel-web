import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectEffectiveTheme } from './store/slices/themeSlice';
import { selectActiveItem } from './store/slices/sidebarSlice';
import { SpeedInsights } from '@vercel/speed-insights/react';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import ModelsView from './components/ModelsView';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import './App.css';

export default function App() {
  const effectiveTheme = useSelector(selectEffectiveTheme);
  const activeItem = useSelector(selectActiveItem);

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

  return (
    <div className="app">
      <Sidebar />
      {activeItem === 'models' ? (
        <ModelsView />
      ) : activeItem === 'analytics' ? (
        <AnalyticsDashboard />
      ) : (
        <MainContent />
      )}
      <SpeedInsights />
    </div>
  );
}
