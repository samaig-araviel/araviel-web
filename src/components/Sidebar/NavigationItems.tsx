import React from 'react';
import { MessageIcon, BookIcon, InsightsIcon } from '../Icons';
import styles from './NavigationItems.module.css';

interface NavigationItemsProps {
  isCollapsed: boolean;
}

const navItems = [
  { id: 'chats', label: 'Chats', icon: MessageIcon },
  { id: 'library', label: 'Library', icon: BookIcon },
  { id: 'insights', label: 'Insights', icon: InsightsIcon },
];

export const NavigationItems: React.FC<NavigationItemsProps> = ({ isCollapsed }) => {
  return (
    <nav className={`${styles.nav} ${isCollapsed ? styles.collapsed : ''}`}>
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <button key={item.id} className={styles.navItem}>
            <Icon size={18} />
            {!isCollapsed && <span>{item.label}</span>}
          </button>
        );
      })}
    </nav>
  );
};
