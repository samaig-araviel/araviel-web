import React from 'react';
import { GridIcon } from '../Icons';
import styles from './SidebarHeader.module.css';

interface SidebarHeaderProps {
  onToggle: () => void;
  isCollapsed: boolean;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ onToggle, isCollapsed }) => {
  return (
    <div className={`${styles.header} ${isCollapsed ? styles.collapsed : ''}`}>
      {!isCollapsed && (
        <>
          <div className={styles.logoIcon} />
          <h1 className={styles.title}>Araviel</h1>
        </>
      )}
      <button
        className={styles.toggleButton}
        onClick={onToggle}
        aria-label="Toggle sidebar"
      >
        <GridIcon size={14} />
      </button>
    </div>
  );
};
