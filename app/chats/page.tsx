'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useChat } from '@/hooks/useChat';
import { formatRelativeTime, truncate, groupConversationsByDate } from '@/lib/utils';
import { MODELS } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { MobileNav } from '@/components/layout/MobileNav';

export default function ChatsPage() {
  const router = useRouter();
  const { user } = useAppStore();
  const {
    conversations,
    handleNewChat,
    handleSelectConversation,
    handleDeleteConversation,
  } = useChat();

  const grouped = groupConversationsByDate(conversations);

  const handleConversationClick = useCallback(
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

  const renderGroup = (title: string, items: typeof conversations) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-8">
        <h2 className="mb-3 text-sm font-medium text-text-muted">{title}</h2>
        <div className="space-y-2">
          {items.map((conversation) => {
            const lastMessage = conversation.messages[conversation.messages.length - 1];
            const model = lastMessage?.model ? MODELS[lastMessage.model] : null;

            return (
              <button
                key={conversation.id}
                onClick={() => handleConversationClick(conversation.id)}
                className="
                  group flex w-full items-center gap-4 rounded-xl
                  border border-border bg-background-secondary
                  p-4 text-left
                  transition-all duration-200
                  hover:border-text-muted hover:shadow-md
                "
              >
                {/* Model Indicator */}
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: model ? `${model.color}20` : 'var(--bg-tertiary)',
                  }}
                >
                  {model ? (
                    <span className="text-lg">{model.icon}</span>
                  ) : (
                    <MessageSquare className="h-5 w-5 text-text-muted" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="mb-1 truncate font-medium text-text-primary group-hover:text-accent transition-colors">
                    {truncate(conversation.title, 50)}
                  </h3>
                  <p className="text-sm text-text-muted">
                    {formatRelativeTime(conversation.updatedAt)}
                    {lastMessage && ` • ${conversation.messages.length} messages`}
                  </p>
                </div>

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConversation(conversation.id);
                  }}
                  className="
                    shrink-0 rounded-lg p-2
                    text-text-muted opacity-0
                    transition-all duration-200
                    hover:bg-error/10 hover:text-error
                    group-hover:opacity-100
                  "
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background-primary pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background-primary/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="rounded-lg p-2 text-text-muted hover:bg-background-tertiary hover:text-text-primary"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-semibold text-text-primary">All Chats</h1>
          </div>
          <Button onClick={handleNewChatClick} size="sm">
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-4 py-6">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-background-tertiary">
              <MessageSquare className="h-8 w-8 text-text-muted" />
            </div>
            <h2 className="mb-2 text-lg font-medium text-text-primary">
              No conversations yet
            </h2>
            <p className="mb-6 text-text-muted">
              Start a new chat to begin your journey with Araviel.
            </p>
            <Button onClick={handleNewChatClick}>
              <Plus className="h-4 w-4" />
              Start New Chat
            </Button>
          </div>
        ) : (
          <>
            {renderGroup('Today', grouped.today)}
            {renderGroup('Yesterday', grouped.yesterday)}
            {renderGroup('Previous 7 Days', grouped.previous7Days)}
            {renderGroup('Older', grouped.older)}
          </>
        )}
      </div>

      {/* Mobile Navigation */}
      <MobileNav
        onNewChat={handleNewChatClick}
        onProfileClick={() => {}}
      />
    </div>
  );
}
