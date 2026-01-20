'use client';

import { Settings, Palette, User as UserIcon, HelpCircle, LogOut, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownDivider,
} from '@/components/ui/Dropdown';
import type { User } from '@/types';

interface ProfileMenuProps {
  user: User;
  collapsed?: boolean;
  onSettings?: () => void;
  onAppearance?: () => void;
  onPersonalization?: () => void;
  onHelp?: () => void;
  onSignOut?: () => void;
}

const iconMap = {
  Settings,
  Palette,
  User: UserIcon,
  HelpCircle,
  LogOut,
};

export function ProfileMenu({
  user,
  collapsed = false,
  onSettings,
  onAppearance,
  onPersonalization,
  onHelp,
  onSignOut,
}: ProfileMenuProps) {
  const menuItems = [
    { id: 'settings', label: 'Settings', icon: 'Settings', onClick: onSettings },
    { id: 'appearance', label: 'Appearance', icon: 'Palette', onClick: onAppearance },
    { id: 'personalization', label: 'Personalization', icon: 'User', onClick: onPersonalization },
    { id: 'help', label: 'Help & Support', icon: 'HelpCircle', onClick: onHelp },
  ];

  return (
    <Dropdown>
      <DropdownTrigger className="w-full">
        <div
          className={cn(
            `
            flex items-center gap-3 rounded-lg px-2 py-2
            text-left transition-colors duration-150
            hover:bg-background-tertiary
          `,
            collapsed && 'justify-center px-0'
          )}
        >
          <Avatar
            src={user.avatar}
            alt={user.name}
            fallback={user.name}
            size="sm"
            status="online"
          />
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-text-primary">
                  {user.name}
                </p>
                <p className="truncate text-xs text-text-muted capitalize">
                  {user.plan}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 text-text-muted" />
            </>
          )}
        </div>
      </DropdownTrigger>

      <DropdownContent align={collapsed ? 'center' : 'start'} side="top" className="w-56">
        <DropdownLabel>
          <div className="truncate">{user.email}</div>
        </DropdownLabel>
        <DropdownDivider />

        {menuItems.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          return (
            <DropdownItem
              key={item.id}
              icon={Icon && <Icon className="h-4 w-4" />}
              onClick={item.onClick}
            >
              {item.label}
            </DropdownItem>
          );
        })}

        <DropdownDivider />

        <DropdownItem
          icon={<LogOut className="h-4 w-4" />}
          onClick={onSignOut}
          danger
        >
          Sign out
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}
