'use client';

import { useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { useChat } from '@/hooks/useChat';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageList } from '@/components/chat/MessageList';
import { ChatInput } from '@/components/chat/ChatInput';

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id as string;

  const { user, sidebarCollapsed, setSidebarCollapsed, setActiveConversation } = useAppStore();
  const {
    conversations,
    projects,
    activeConversation,
    selectedModel,
    isGenerating,
    handleNewChat,
    handleSendMessage,
    handleModelChange,
    handleSelectConversation,
    handleRenameConversation,
    handleDeleteConversation,
    stopGenerating,
  } = useChat();

  // Set active conversation when page loads
  useEffect(() => {
    if (conversationId) {
      setActiveConversation(conversationId);
    }
  }, [conversationId, setActiveConversation]);

  const handleConversationSelect = useCallback(
    (id: string) => {
      handleSelectConversation(id);
      router.push(`/chat/${id}`);
    },
    [handleSelectConversation, router]
  );

  const handleNewChatClick = useCallback(() => {
    const id = handleNewChat();
    router.push(`/chat/${id}`);
  }, [handleNewChat, router]);

  const handleDelete = useCallback(() => {
    if (conversationId) {
      handleDeleteConversation(conversationId);
      router.push('/');
    }
  }, [conversationId, handleDeleteConversation, router]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: activeConversation?.title || 'Araviel Chat',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }, [activeConversation?.title]);

  const handleExport = useCallback(() => {
    if (!activeConversation) return;

    const content = activeConversation.messages
      .map((m) => `${m.role === 'user' ? 'You' : 'AI'}: ${m.content}`)
      .join('\n\n---\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeConversation.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeConversation]);

  // Loading state
  if (!activeConversation && conversations.length > 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-primary">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-accent-soft" />
          <div className="text-sm text-text-muted">Loading conversation...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background-primary">
      {/* Sidebar - Desktop */}
      <div className="hidden md:block">
        <Sidebar
          user={user}
          conversations={conversations}
          projects={projects}
          activeConversationId={conversationId}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          onNewChat={handleNewChatClick}
          onSelectConversation={handleConversationSelect}
          onRenameConversation={handleRenameConversation}
          onDeleteConversation={handleDeleteConversation}
        />
      </div>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Chat Header */}
        {activeConversation && (
          <ChatHeader
            title={activeConversation.title}
            onTitleChange={(title) => handleRenameConversation(conversationId, title)}
            onShare={handleShare}
            onExport={handleExport}
            onDelete={handleDelete}
          />
        )}

        {/* Messages */}
        <MessageList
          messages={activeConversation?.messages || []}
          user={user}
          isGenerating={isGenerating}
          activeModel={
            activeConversation?.messages.length
              ? activeConversation.messages[activeConversation.messages.length - 1]?.model
              : undefined
          }
          className="flex-1 pb-20 md:pb-0"
        />

        {/* Chat Input */}
        <ChatInput
          onSubmit={handleSendMessage}
          onStop={stopGenerating}
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
          isGenerating={isGenerating}
        />
      </main>

      {/* Mobile Navigation */}
      <MobileNav onNewChat={handleNewChatClick} />
    </div>
  );
}
