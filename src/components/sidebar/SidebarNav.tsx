'use client';

import * as React from 'react';
import { MessageSquare, BookOpen, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/store/hooks';
import { selectSidebarOpen } from '@/store/selectors';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
}

const navItems: NavItem[] = [
  {
    id: 'chats',
    label: 'Chats',
    icon: <MessageSquare size={18} />,
  },
  {
    id: 'library',
    label: 'Library',
    icon: <BookOpen size={18} />,
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: <Sparkles size={18} />,
  },
];

const SidebarNav: React.FC = () => {
  const sidebarOpen = useAppSelector(selectSidebarOpen);

  return (
    <nav
      className={cn(
        'flex flex-col gap-0.5 mb-4',
        sidebarOpen ? 'px-2' : 'px-1.5'
      )}
    >
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={item.onClick}
          className={cn(
            'flex items-center gap-2.5 rounded-lg',
            'text-text-secondary text-sm font-medium',
            'transition-all duration-200',
            'hover:bg-background-tertiary hover:text-text-primary',
            sidebarOpen
              ? 'px-3 py-2'
              : 'w-[38px] h-[38px] justify-center'
          )}
        >
          <span className="flex-shrink-0">{item.icon}</span>
          {sidebarOpen && <span>{item.label}</span>}
        </button>
      ))}
    </nav>
  );
};

export { SidebarNav };
