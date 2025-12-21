import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { toggleMobileSidebar, setTheme } from '../../store/uiSlice';
import { Dropdown } from '../Common';
import {
  GridIcon,
  MoreHorizontalIcon,
  SunIcon,
  MoonIcon,
  MonitorIcon,
} from '../Icons';
import styles from './TopBar.module.css';

const TopBar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { theme } = useAppSelector((state) => state.ui);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    if (newTheme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      dispatch(setTheme(isDark ? 'dark' : 'light'));
    } else {
      dispatch(setTheme(newTheme));
    }
    setShowThemeMenu(false);
    setShowMenu(false);
  };

  return (
    <header className={`${styles.topBar} ${isScrolled ? styles.scrolled : ''}`}>
      <button
        className={styles.sidebarButton}
        onClick={() => dispatch(toggleMobileSidebar())}
        aria-label="Open sidebar"
      >
        <GridIcon size={16} />
      </button>

      <div className={styles.actions}>
        <div className={styles.menuWrapper}>
          <button
            className={styles.menuButton}
            onClick={() => setShowMenu(!showMenu)}
            aria-label="More options"
          >
            <MoreHorizontalIcon size={16} />
          </button>

          <Dropdown isOpen={showMenu} onClose={() => setShowMenu(false)} align="end">
            <div className={styles.themeMenuItem} onClick={(e) => e.stopPropagation()}>
              <div
                className={styles.themeItem}
                onClick={() => setShowThemeMenu(!showThemeMenu)}
              >
                {theme === 'dark' ? <MoonIcon size={18} /> : <SunIcon size={18} />}
                <span>Theme</span>
                <span className={styles.themeArrow}>›</span>
              </div>

              {showThemeMenu && (
                <div className={styles.themeSubmenu}>
                  <button
                    className={styles.themeOption}
                    onClick={() => handleThemeChange('light')}
                  >
                    <SunIcon size={16} />
                    <span>Light</span>
                  </button>
                  <button
                    className={styles.themeOption}
                    onClick={() => handleThemeChange('dark')}
                  >
                    <MoonIcon size={16} />
                    <span>Dark</span>
                  </button>
                  <button
                    className={styles.themeOption}
                    onClick={() => handleThemeChange('system')}
                  >
                    <MonitorIcon size={16} />
                    <span>System</span>
                  </button>
                </div>
              )}
            </div>
          </Dropdown>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
