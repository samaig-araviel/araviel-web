'use client';

import * as React from 'react';
import {
  User,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectUser, selectSidebarOpen, selectTheme } from '@/store/selectors';
import { openDropdown, closeAllDropdowns, setTheme } from '@/store/slices/uiSlice';
import { Avatar } from '@/components/ui';
import type { ThemeMode } from '@/types';

interface ProfileMenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  hasSubmenu?: boolean;
  danger?: boolean;
}

const ProfileMenuItem: React.FC<ProfileMenuItemProps> = ({
  icon,
  label,
  onClick,
  hasSubmenu,
  danger,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
        'text-sm font-medium transition-all duration-200',
        danger
          ? 'text-red-400 hover:bg-red-500/10'
          : 'text-text-secondary hover:bg-background-tertiary hover:text-text-primary'
      )}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {hasSubmenu && <ChevronRight size={14} className="text-text-tertiary" />}
    </button>
  );
};

// Theme Selector Component
interface ThemeSelectorProps {
  currentTheme: ThemeMode;
  onSelect: (theme: ThemeMode) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onSelect,
}) => {
  const themes: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Light', icon: <Sun size={14} /> },
    { value: 'dark', label: 'Dark', icon: <Moon size={14} /> },
    { value: 'system', label: 'System', icon: <Monitor size={14} /> },
  ];

  return (
    <div className="flex gap-1 p-1 bg-background-tertiary rounded-lg">
      {themes.map((theme) => (
        <button
          key={theme.value}
          onClick={() => onSelect(theme.value)}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md',
            'text-xs font-medium transition-all duration-200',
            currentTheme === theme.value
              ? 'bg-background-secondary text-text-primary shadow-sm'
              : 'text-text-tertiary hover:text-text-secondary'
          )}
        >
          {theme.icon}
          <span>{theme.label}</span>
        </button>
      ))}
    </div>
  );
};

// Profile Dropdown Menu
interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const currentTheme = useAppSelector(selectTheme);

  const handleThemeChange = (theme: ThemeMode) => {
    dispatch(setTheme(theme));
  };

  const handleSettingsClick = () => {
    onClose();
    // Open settings modal
  };

  const handleHelpClick = () => {
    onClose();
    // Open help modal or page
  };

  const handleLogout = () => {
    onClose();
    // Handle logout
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'absolute bottom-full left-0 right-0 mb-2',
        'bg-background-secondary border border-border rounded-xl',
        'shadow-xl shadow-black/20',
        'animate-slideUp'
      )}
    >
      {/* User Info */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-3">
          <Avatar
            src={user.avatar}
            alt={user.name}
            fallback={user.name.charAt(0)}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">
              {user.name}
            </p>
            <p className="text-xs text-text-tertiary truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Theme Selector */}
      <div className="p-3 border-b border-border">
        <p className="text-xs text-text-tertiary font-medium mb-2">Theme</p>
        <ThemeSelector currentTheme={currentTheme} onSelect={handleThemeChange} />
      </div>

      {/* Menu Items */}
      <div className="p-2">
        <ProfileMenuItem
          icon={<Settings size={16} />}
          label="Settings"
          onClick={handleSettingsClick}
        />
        <ProfileMenuItem
          icon={<HelpCircle size={16} />}
          label="Help & Support"
          onClick={handleHelpClick}
        />
        <div className="my-2 border-t border-border" />
        <ProfileMenuItem
          icon={<LogOut size={16} />}
          label="Sign out"
          onClick={handleLogout}
          danger
        />
      </div>
    </div>
  );
};

// Main Profile Section
const ProfileSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector(selectSidebarOpen);
  const user = useAppSelector(selectUser);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const handleToggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleCloseDropdown = () => {
    setIsDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-profile-section]')) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isDropdownOpen]);

  if (!sidebarOpen) {
    return (
      <div className="px-1.5 py-2" data-profile-section>
        <button
          onClick={handleToggleDropdown}
          className={cn(
            'w-[38px] h-[38px] flex items-center justify-center rounded-lg',
            'text-text-secondary hover:text-text-primary',
            'hover:bg-background-tertiary transition-colors'
          )}
        >
          <Avatar
            src={user.avatar}
            alt={user.name}
            fallback={user.name.charAt(0)}
            size="sm"
          />
        </button>
      </div>
    );
  }

  return (
    <div className="relative px-2 py-2" data-profile-section>
      <ProfileDropdown isOpen={isDropdownOpen} onClose={handleCloseDropdown} />

      <button
        onClick={handleToggleDropdown}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
          'transition-all duration-200',
          'hover:bg-background-tertiary',
          'border border-transparent',
          isDropdownOpen && 'bg-background-tertiary border-border'
        )}
      >
        <Avatar
          src={user.avatar}
          alt={user.name}
          fallback={user.name.charAt(0)}
          size="sm"
        />
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium text-text-primary truncate">
            {user.name}
          </p>
          <p className="text-[10px] text-text-tertiary truncate">{user.email}</p>
        </div>
        <ChevronRight
          size={14}
          className={cn(
            'text-text-tertiary transition-transform',
            isDropdownOpen && 'rotate-90'
          )}
        />
      </button>
    </div>
  );
};

export { ProfileSection };
