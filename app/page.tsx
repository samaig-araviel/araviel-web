'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { useChat } from '@/hooks/useChat';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { WelcomeHero } from '@/components/home/WelcomeHero';
import { MainInput } from '@/components/home/MainInput';
import { QuickActions } from '@/components/home/QuickActions';
import { RecentChats } from '@/components/home/RecentChats';
import { PromptOfTheDay } from '@/components/home/PromptOfTheDay';
import { UserStats } from '@/components/home/UserStats';
import type { QuickAction } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');

  const { user, sidebarCollapsed, setSidebarCollapsed, checkAndUpdateStreak } = useAppStore();
  const {
    conversations,
    projects,
    selectedModel,
    handleNewChat,
    handleSendMessage,
    handleModelChange,
    handleSelectConversation,
    handleRenameConversation,
    handleDeleteConversation,
  } = useChat();

  // Check streak on mount
  useEffect(() => {
    checkAndUpdateStreak();
  }, [checkAndUpdateStreak]);

  const handleSubmit = useCallback(
    async (message: string) => {
      await handleSendMessage(message);
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

  const handlePromptSelect = useCallback((prompt: string) => {
    setInputValue(prompt);
  }, []);

  const handleConversationSelect = useCallback(
    (id: string) => {
      handleSelectConversation(id);
      router.push(`/chat/${id}`);
    },
    [handleSelectConversation, router]
  );

  return (
    <div className="flex h-screen bg-background-primary">
      {/* Sidebar - Desktop */}
      <div className="hidden md:block">
        <Sidebar
          user={user}
          conversations={conversations}
          projects={projects}
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
        <div className="flex h-full flex-col overflow-y-auto pb-20 md:pb-0">
          <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 md:px-6 md:py-12">
            {/* Welcome Hero */}
            <div className="mb-8 pt-4 md:pt-8">
              <WelcomeHero userName={user.name} />
            </div>

            {/* Primary Action Card - Main Input */}
            <div className="mb-8">
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
            <div className="mb-8">
              <QuickActions onSelect={handleQuickActionSelect} />
            </div>

            {/* Continue Section and Stats */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Recent Chats - Takes 2 columns */}
              <div className="lg:col-span-2">
                <RecentChats
                  conversations={conversations}
                  projects={projects}
                  onSelect={handleConversationSelect}
                  maxItems={5}
                />
              </div>

              {/* Right Column - Prompt of Day and Stats */}
              <div className="space-y-6">
                <PromptOfTheDay onSelect={handlePromptSelect} />
                <UserStats xp={user.xp} streak={user.streak} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNav onNewChat={handleNewChat} />
    </div>
  );
}
