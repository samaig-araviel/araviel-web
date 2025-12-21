import React from 'react';
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

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  const handleToggle = () => {
    if (isMobile) {
      dispatch(closeMobileSidebar());
    } else {
      dispatch(toggleSidebar());
    }
  };

  const sidebarClasses = [
    styles.sidebar,
    !sidebarOpen && !isMobile ? styles.collapsed : '',
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
        <SidebarHeader onToggle={handleToggle} isCollapsed={!sidebarOpen && !isMobile} />
        <NewChatButton isCollapsed={!sidebarOpen && !isMobile} />
        <ProjectsSection isCollapsed={!sidebarOpen && !isMobile} />
        <NavigationItems isCollapsed={!sidebarOpen && !isMobile} />
        <RecentsSection isCollapsed={!sidebarOpen && !isMobile} />
        <ProfileSection isCollapsed={!sidebarOpen && !isMobile} />
      </aside>
    </>
  );
};
