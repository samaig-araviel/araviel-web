'use client';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { formatRelativeTime, groupConversationsByDate } from '@/lib/utils';
import {
  ArrowLeft,
  MessageSquare,
  Plus,
  Trash2,
  Pin,
  Sparkles,
  Settings,
  Trophy,
} from 'lucide-react';

export default function ChatsPage() {
  const router = useRouter();
  const {
    conversations,
    projects,
    createConversation,
    setActiveConversation,
    deleteConversation,
  } = useAppStore();

  const grouped = groupConversationsByDate(
    conversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  );

  const getProjectInfo = (projectId?: string) => {
    if (!projectId) return null;
    return projects.find((p) => p.id === projectId);
  };

  const handleConversationClick = (id: string) => {
    setActiveConversation(id);
    router.push(`/chat/${id}`);
  };

  const handleNewChat = () => {
    const id = createConversation();
    router.push(`/chat/${id}`);
  };

  const renderGroup = (title: string, items: typeof conversations) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          {title}
        </h2>
        <div className="space-y-2">
          {items.map((conversation) => {
            const project = getProjectInfo(conversation.projectId);

            return (
              <button
                key={conversation.id}
                onClick={() => handleConversationClick(conversation.id)}
                className="group w-full card card-interactive p-4 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-muted)] group-hover:bg-[rgba(99,102,241,0.1)] group-hover:text-[var(--brand-primary)] transition-colors">
                    <MessageSquare className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {conversation.isPinned && (
                        <Pin className="w-3 h-3 text-[var(--brand-primary)]" />
                      )}
                      <h3 className="font-medium text-[var(--text-primary)] truncate">
                        {conversation.title}
                      </h3>
                      {project && (
                        <span
                          className="shrink-0 rounded px-2 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: `${project.color}15`,
                            color: project.color,
                          }}
                        >
                          {project.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {formatRelativeTime(new Date(conversation.updatedAt))}
                      {conversation.messages.length > 0 &&
                        ` · ${conversation.messages.length} messages`}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conversation.id);
                    }}
                    className="p-2 rounded-lg text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:bg-[var(--error-soft)] hover:text-[var(--error)] transition-all"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-[var(--border-primary)]">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="btn btn-ghost btn-icon"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">All Chats</h1>
          </div>
          <button onClick={handleNewChat} className="btn btn-primary btn-sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-6">
        {conversations.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-[var(--text-muted)]" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              No conversations yet
            </h2>
            <p className="text-[var(--text-secondary)] mb-6 max-w-sm mx-auto">
              Start a new chat to begin your journey with Araviel.
            </p>
            <button onClick={handleNewChat} className="btn btn-primary">
              <Plus className="w-4 h-4" />
              Start New Chat
            </button>
          </div>
        ) : (
          <>
            {renderGroup('Today', grouped.today)}
            {renderGroup('Yesterday', grouped.yesterday)}
            {renderGroup('Previous 7 Days', grouped.previous7Days)}
            {renderGroup('Older', grouped.older)}
          </>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden glass border-t border-[var(--border-primary)] pb-safe">
        <div className="flex items-center justify-around h-16">
          <button
            onClick={() => router.push('/')}
            className="flex flex-col items-center gap-1 p-2 text-[var(--text-muted)]"
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-xs">Home</span>
          </button>
          <button
            onClick={() => router.push('/chats')}
            className="flex flex-col items-center gap-1 p-2 text-[var(--brand-primary)]"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs">Chats</span>
          </button>
          <button
            onClick={() => router.push('/achievements')}
            className="flex flex-col items-center gap-1 p-2 text-[var(--text-muted)]"
          >
            <Trophy className="w-5 h-5" />
            <span className="text-xs">Rewards</span>
          </button>
          <button
            onClick={() => router.push('/settings')}
            className="flex flex-col items-center gap-1 p-2 text-[var(--text-muted)]"
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
