import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../store';
import { toggleSidebar, closeMobileSidebar } from '../../store/uiSlice';
import { SidebarHeader } from './SidebarHeader';
import { NewChatButton } from './NewChatButton';
import { ProjectsSection } from './ProjectsSection';
import { NavigationItems } from './NavigationItems';
import { RecentsSection } from './RecentsSection';
import { ProfileSection } from './ProfileSection';
import styles from './Sidebar.module.css';

export const Sidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { sidebarOpen, sidebarMobileOpen } = useAppSelector((state) => state.ui);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isCollapsed = !sidebarOpen && !isMobile;

  const handleToggle = () => {
    if (isMobile) {
      dispatch(closeMobileSidebar());
    } else {
      dispatch(toggleSidebar());
    }
  };

  const sidebarClasses = [
    styles.sidebar,
    isCollapsed ? styles.collapsed : '',
    isMobile && sidebarMobileOpen ? styles.mobileOpen : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && sidebarMobileOpen && (
        <div
          className={styles.mobileBackdrop}
          onClick={() => dispatch(closeMobileSidebar())}
        />
      )}

      <aside className={sidebarClasses}>
        <SidebarHeader onToggle={handleToggle} isCollapsed={isCollapsed} />
        <NewChatButton isCollapsed={isCollapsed} />

        {/* Scrollable content area */}
        <div className={styles.scrollArea}>
          <ProjectsSection isCollapsed={isCollapsed} />
          <NavigationItems isCollapsed={isCollapsed} />
          <RecentsSection isCollapsed={isCollapsed} />
        </div>

        <ProfileSection isCollapsed={isCollapsed} />
      </aside>
    </>
  );
};
