'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/store/hooks';
import { selectSidebarOpen } from '@/store/selectors';
import { SidebarHeader } from './SidebarHeader';
import { NewChatButton } from './NewChatButton';
import { SidebarNav } from './SidebarNav';
import { ProjectsSection } from './ProjectsSection';
import { RecentChatsSection } from './RecentChatsSection';
import { ProfileSection } from './ProfileSection';

const Sidebar: React.FC = () => {
  const isOpen = useAppSelector(selectSidebarOpen);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen',
        'flex flex-col',
        'bg-background-secondary border-r border-border',
        'transition-all duration-300 ease-in-out',
        isOpen ? 'w-64' : 'w-[54px]'
      )}
    >
      {/* Header */}
      <SidebarHeader />

      {/* New Chat Button */}
      <NewChatButton />

      {/* Navigation */}
      <SidebarNav />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
        {/* Projects Section */}
        <ProjectsSection />

        {/* Recent Chats Section */}
        <RecentChatsSection />
      </div>

      {/* Profile Section (Bottom) */}
      <div className="mt-auto border-t border-border">
        <ProfileSection />
      </div>
    </aside>
  );
};

export { Sidebar };
