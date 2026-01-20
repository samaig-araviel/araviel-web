'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { useChat } from '@/hooks/useChat';
import { useAppKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { WelcomeHero } from '@/components/home/WelcomeHero';
import { MainInput } from '@/components/home/MainInput';
import { QuickActions } from '@/components/home/QuickActions';
import { RecentChats } from '@/components/home/RecentChats';
import { DailyInsight } from '@/components/home/DailyInsight';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import type { QuickAction } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');

  const { user, sidebarCollapsed, setSidebarCollapsed } = useAppStore();
  const {
    conversations,
    selectedModel,
    handleNewChat,
    handleSendMessage,
    handleModelChange,
    handleSelectConversation,
    handleRenameConversation,
    handleDeleteConversation,
  } = useChat();

  // Keyboard shortcuts
  useAppKeyboardShortcuts({
    onNewChat: handleNewChat,
    onToggleSidebar: () => setSidebarCollapsed(!sidebarCollapsed),
  });

  const handleSubmit = useCallback(
    async (message: string) => {
      await handleSendMessage(message);
      // Navigate to the chat view after sending
      const { activeConversationId } = useAppStore.getState();
      if (activeConversationId) {
        router.push(`/chat/${activeConversationId}`);
      }
    },
    [handleSendMessage, router]
  );

  const handleQuickActionSelect = useCallback((action: QuickAction) => {
    setInputValue(action.promptStarter);
  }, []);

  const handleConversationSelect = useCallback(
    (id: string) => {
      handleSelectConversation(id);
      router.push(`/chat/${id}`);
    },
    [handleSelectConversation, router]
  );

  const handleViewAllChats = useCallback(() => {
    router.push('/chats');
  }, [router]);

  return (
    <div className="flex h-screen bg-background-primary">
      {/* Sidebar - Desktop */}
      <div className="hidden md:block">
        <Sidebar
          user={user}
          conversations={conversations}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          onNewChat={handleNewChat}
          onSelectConversation={handleConversationSelect}
          onRenameConversation={handleRenameConversation}
          onDeleteConversation={handleDeleteConversation}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {/* Theme Toggle - Top Right */}
        <div className="absolute right-4 top-4 z-10">
          <ThemeToggle />
        </div>

        <div className="flex h-full flex-col overflow-y-auto pb-20 md:pb-0">
          <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 md:px-6 md:py-16">
            {/* Welcome Hero */}
            <div className="mb-10 pt-8 md:pt-16">
              <WelcomeHero userName={user.name} />
            </div>

            {/* Main Input */}
            <div className="mb-10">
              <MainInput
                value={inputValue}
                onChange={setInputValue}
                onSubmit={handleSubmit}
                selectedModel={selectedModel}
                onModelChange={handleModelChange}
                autoFocus
              />
            </div>

            {/* Quick Actions */}
            <div className="mb-10">
              <QuickActions onSelect={handleQuickActionSelect} />
            </div>

            {/* Recent Chats and Daily Insight */}
            <div className="grid gap-6 md:grid-cols-2">
              <RecentChats
                conversations={conversations}
                onSelect={handleConversationSelect}
                onViewAll={handleViewAllChats}
                maxItems={4}
              />
              <DailyInsight />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNav
        onNewChat={handleNewChat}
        onProfileClick={() => {}}
      />
    </div>
  );
}
