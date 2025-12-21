import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from './store';
import { setTheme, setSidebarOpen } from './store/uiSlice';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import {
  CreateProjectModal,
  RenameProjectModal,
  DeleteProjectModal,
  FeedbackModal,
  FileLimitModal,
} from './components/Modals';
import './styles/global.css';
import styles from './App.module.css';

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const { theme, sidebarOpen } = useAppSelector((state) => state.ui);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('araviel-theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      dispatch(setTheme(savedTheme));
    }
  }, [dispatch]);

  // Apply theme class to body
  useEffect(() => {
    document.body.classList.remove('light-mode', 'dark-mode');
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    }
  }, [theme]);

  // Handle mobile sidebar backdrop click
  const handleBackdropClick = () => {
    dispatch(setSidebarOpen(false));
  };

  return (
    <div className={styles.app}>
      <Sidebar />

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className={`mobile-backdrop ${sidebarOpen ? 'active' : ''}`}
          onClick={handleBackdropClick}
        />
      )}

      <MainContent />

      {/* Modals */}
      <CreateProjectModal />
      <RenameProjectModal />
      <DeleteProjectModal />
      <FeedbackModal />
      <FileLimitModal />
    </div>
  );
};

export default App;
