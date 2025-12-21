import React, { useState } from 'react';
import { Avatar } from '../Common';
import { Dropdown, DropdownItem, DropdownDivider } from '../Common';
import {
  ChevronUpIcon,
  SettingsIcon,
  UserIcon,
  HelpIcon,
  LogOutIcon,
} from '../Icons';
import styles from './ProfileSection.module.css';

interface ProfileSectionProps {
  isCollapsed: boolean;
}

// TODO: Replace with actual user data from auth
const mockUser = {
  name: 'Sam Aigbotsua',
  email: 'saigbotsua@gmail.com',
  initials: 'S',
};

export const ProfileSection: React.FC<ProfileSectionProps> = ({ isCollapsed }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (action: string) => {
    setIsOpen(false);
    switch (action) {
      case 'settings':
        console.log('Opening Settings...');
        break;
      case 'personalization':
        console.log('Opening Personalization...');
        break;
      case 'help':
        console.log('Opening Help...');
        break;
      case 'logout':
        console.log('Logging out...');
        break;
    }
  };

  return (
    <div className={styles.section}>
      <button
        className={`${styles.trigger} ${isOpen ? styles.active : ''} ${
          isCollapsed ? styles.collapsed : ''
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Avatar name={mockUser.name} size="md" variant="primary" />
        {!isCollapsed && (
          <>
            <div className={styles.info}>
              <div className={styles.name}>{mockUser.name}</div>
              <div className={styles.email}>{mockUser.email}</div>
            </div>
            <ChevronUpIcon
              size={16}
              className={`${styles.arrow} ${isOpen ? styles.rotated : ''}`}
            />
          </>
        )}
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        position="top"
        align="start"
        className={styles.dropdown}
      >
        <div className={styles.dropdownHeader}>
          <Avatar name={mockUser.name} size="md" variant="primary" />
          <div className={styles.dropdownInfo}>
            <div className={styles.dropdownName}>{mockUser.name}</div>
            <div className={styles.dropdownEmail}>{mockUser.email}</div>
          </div>
        </div>

        <DropdownItem
          icon={<SettingsIcon size={18} />}
          onClick={() => handleAction('settings')}
        >
          Settings
        </DropdownItem>
        <DropdownItem
          icon={<UserIcon size={18} />}
          onClick={() => handleAction('personalization')}
        >
          Personalization
        </DropdownItem>
        <DropdownItem
          icon={<HelpIcon size={18} />}
          onClick={() => handleAction('help')}
        >
          Help
        </DropdownItem>

        <DropdownDivider />

        <DropdownItem
          icon={<LogOutIcon size={18} />}
          onClick={() => handleAction('logout')}
          danger
        >
          Log out
        </DropdownItem>
      </Dropdown>
    </div>
  );
};
