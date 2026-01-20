'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { formatRelativeTime, truncate, groupConversationsByDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { MobileNav } from '@/components/layout/MobileNav';

export default function ChatsPage() {
  const router = useRouter();
  const {
    conversations,
    projects,
    handleNewChat,
    handleSelectConversation,
    handleDeleteConversation,
  } = useChat();

  const grouped = groupConversationsByDate(conversations);

  const getProjectInfo = (projectId?: string) => {
    if (!projectId) return null;
    return projects.find((p) => p.id === projectId);
  };

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
      <div className="mb-6">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-text-muted">
          {title}
        </h2>
        <div className="space-y-2">
          {items.map((conversation) => {
            const project = getProjectInfo(conversation.projectId);

            return (
              <button
                key={conversation.id}
                onClick={() => handleConversationClick(conversation.id)}
                className="group flex w-full items-center gap-4 rounded-xl border border-border-subtle bg-background-secondary p-4 text-left transition-all hover:border-border hover:shadow-sm"
              >
                {/* Icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background-tertiary text-text-muted group-hover:bg-accent-soft group-hover:text-accent">
                  <MessageSquare className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-medium text-text-primary">
                      {truncate(conversation.title, 50)}
                    </h3>
                    {project && (
                      <span
                        className="shrink-0 rounded px-1.5 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: `${project.color}15`,
                          color: project.color,
                        }}
                      >
                        {project.name}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {formatRelativeTime(conversation.updatedAt)}
                    {conversation.messages.length > 0 && ` · ${conversation.messages.length} messages`}
                  </p>
                </div>

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConversation(conversation.id);
                  }}
                  className="shrink-0 rounded-lg p-2 text-text-muted opacity-0 transition-all hover:bg-error-soft hover:text-error group-hover:opacity-100"
                  title="Delete conversation"
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
      <header className="sticky top-0 z-10 border-b border-border bg-background-secondary">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="rounded-lg p-2 text-text-muted transition-colors hover:bg-background-tertiary hover:text-text-primary"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-text-primary">All Chats</h1>
          </div>
          <Button onClick={handleNewChatClick} size="sm">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Chat</span>
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-4 py-6">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-background-tertiary">
              <MessageSquare className="h-8 w-8 text-text-muted" />
            </div>
            <h2 className="mb-2 text-lg font-medium text-text-primary">
              No conversations yet
            </h2>
            <p className="mb-6 max-w-sm text-sm text-text-secondary">
              Start a new chat to begin your journey with Araviel. Your conversations will appear here.
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
      <MobileNav onNewChat={handleNewChatClick} />
    </div>
  );
}
