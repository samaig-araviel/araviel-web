'use client';

import { ArrowRight, MessageSquare } from 'lucide-react';
import { cn, truncate, formatRelativeTime } from '@/lib/utils';
import { MODELS } from '@/lib/constants';
import { Card } from '@/components/ui/Card';
import type { Conversation } from '@/types';

interface RecentChatsProps {
  conversations: Conversation[];
  onSelect?: (id: string) => void;
  onViewAll?: () => void;
  maxItems?: number;
  className?: string;
}

export function RecentChats({
  conversations,
  onSelect,
  onViewAll,
  maxItems = 4,
  className,
}: RecentChatsProps) {
  const recentChats = conversations.slice(0, maxItems);

  if (conversations.length === 0) {
    return (
      <Card variant="bordered" padding="lg" className={className}>
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background-tertiary">
            <MessageSquare className="h-6 w-6 text-text-muted" />
          </div>
          <div>
            <p className="font-medium text-text-primary">No conversations yet</p>
            <p className="text-sm text-text-muted">
              Start a new chat to see your history here.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="bordered" padding="none" className={className}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="font-medium text-text-primary">Recent Conversations</h3>
        {conversations.length > maxItems && (
          <button
            onClick={onViewAll}
            className="
              flex items-center gap-1 text-sm text-accent
              transition-colors hover:text-accent-hover
            "
          >
            See all
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Chat List */}
      <div className="divide-y divide-border-subtle">
        {recentChats.map((chat) => {
          const lastMessage = chat.messages[chat.messages.length - 1];
          const model = lastMessage?.model ? MODELS[lastMessage.model] : null;

          return (
            <button
              key={chat.id}
              onClick={() => onSelect?.(chat.id)}
              className="
                flex w-full items-center gap-3 px-4 py-3
                text-left transition-colors
                hover:bg-background-tertiary
                group
              "
            >
              {/* Model indicator */}
              <span
                className={cn(
                  'h-2.5 w-2.5 shrink-0 rounded-full',
                  model ? '' : 'bg-text-muted'
                )}
                style={{ backgroundColor: model?.color }}
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-text-primary group-hover:text-accent transition-colors">
                  {truncate(chat.title, 40)}
                </p>
                <p className="text-sm text-text-muted">
                  {formatRelativeTime(chat.updatedAt)}
                </p>
              </div>

              {/* Arrow on hover */}
              <ArrowRight className="h-4 w-4 shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          );
        })}
      </div>
    </Card>
  );
}
