'use client';

import { MessageSquare, ArrowRight } from 'lucide-react';
import { cn, formatRelativeTime, truncate } from '@/lib/utils';
import type { Conversation, Project } from '@/types';

interface RecentChatsProps {
  conversations: Conversation[];
  projects?: Project[];
  onSelect?: (id: string) => void;
  maxItems?: number;
  className?: string;
}

export function RecentChats({
  conversations,
  projects = [],
  onSelect,
  maxItems = 5,
  className,
}: RecentChatsProps) {
  const recentConversations = conversations
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, maxItems);

  const getProjectName = (projectId?: string) => {
    if (!projectId) return null;
    const project = projects.find((p) => p.id === projectId);
    return project?.name || null;
  };

  const getProjectColor = (projectId?: string) => {
    if (!projectId) return null;
    const project = projects.find((p) => p.id === projectId);
    return project?.color || null;
  };

  // Empty state
  if (recentConversations.length === 0) {
    return (
      <div className={cn('rounded-xl border border-border-subtle bg-background-secondary p-6', className)}>
        <h3 className="mb-4 text-sm font-medium text-text-primary">
          Continue where you left off
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-background-tertiary">
            <MessageSquare className="h-6 w-6 text-text-muted" />
          </div>
          <p className="text-sm text-text-secondary">No conversations yet</p>
          <p className="mt-1 text-xs text-text-muted">Start a chat to see it here</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border border-border-subtle bg-background-secondary', className)}>
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <h3 className="text-sm font-medium text-text-primary">
          Continue where you left off
        </h3>
      </div>

      <div className="divide-y divide-border-subtle">
        {recentConversations.map((conversation) => {
          const projectName = getProjectName(conversation.projectId);
          const projectColor = getProjectColor(conversation.projectId);

          return (
            <button
              key={conversation.id}
              onClick={() => onSelect?.(conversation.id)}
              className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-background-tertiary"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background-tertiary text-text-muted group-hover:bg-accent-soft group-hover:text-accent">
                <MessageSquare className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-text-primary">
                    {truncate(conversation.title, 40)}
                  </span>
                  {projectName && (
                    <span
                      className="shrink-0 rounded px-1.5 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: `${projectColor}15`,
                        color: projectColor || undefined,
                      }}
                    >
                      {projectName}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-text-muted">
                  {formatRelativeTime(conversation.updatedAt)}
                  {conversation.messages.length > 0 && (
                    <span> · {conversation.messages.length} messages</span>
                  )}
                </div>
              </div>

              <ArrowRight className="h-4 w-4 shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
