'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Compass,
  Star,
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
import { cn, truncate, groupConversationsByDate } from '@/lib/utils';
import { SIDEBAR_NAV } from '@/lib/constants';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownDivider,
} from '@/components/ui/Dropdown';
import { ProfileMenu } from './ProfileMenu';
import type { Conversation, User } from '@/types';

interface SidebarProps {
  user: User;
  conversations: Conversation[];
  activeConversationId?: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onNewChat?: () => void;
  onSelectConversation?: (id: string) => void;
  onRenameConversation?: (id: string, title: string) => void;
  onDeleteConversation?: (id: string) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  Compass,
  Star,
};

export function Sidebar({
  user,
  conversations,
  activeConversationId,
  collapsed = false,
  onCollapsedChange,
  onNewChat,
  onSelectConversation,
  onRenameConversation,
  onDeleteConversation,
}: SidebarProps) {
  const pathname = usePathname();
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);

  const groupedChats = groupConversationsByDate(conversations);

  const renderChatGroup = (title: string, chats: Conversation[]) => {
    if (chats.length === 0) return null;

    return (
      <div key={title} className="mb-4">
        {!collapsed && (
          <h4 className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-text-muted">
            {title}
          </h4>
        )}
        <div className="space-y-0.5">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className="group relative"
              onMouseEnter={() => setHoveredChatId(chat.id)}
              onMouseLeave={() => setHoveredChatId(null)}
            >
              <button
                onClick={() => onSelectConversation?.(chat.id)}
                className={cn(
                  `
                  flex w-full items-center gap-3 rounded-lg px-3 py-2
                  text-sm text-text-secondary
                  transition-colors duration-150
                  hover:bg-background-tertiary hover:text-text-primary
                `,
                  activeConversationId === chat.id &&
                    'bg-accent-soft text-accent'
                )}
                title={collapsed ? chat.title : undefined}
              >
                <span
                  className={cn(
                    'h-2 w-2 shrink-0 rounded-full',
                    chat.messages[chat.messages.length - 1]?.model === 'claude' && 'bg-model-claude',
                    chat.messages[chat.messages.length - 1]?.model === 'gpt4' && 'bg-model-gpt4',
                    chat.messages[chat.messages.length - 1]?.model === 'gemini' && 'bg-model-gemini',
                    chat.messages[chat.messages.length - 1]?.model === 'perplexity' && 'bg-model-perplexity',
                    !chat.messages[chat.messages.length - 1]?.model && 'bg-text-muted'
                  )}
                />
                {!collapsed && (
                  <span className="flex-1 truncate text-left">
                    {truncate(chat.title, 28)}
                  </span>
                )}
              </button>

              {/* Chat actions on hover */}
              {!collapsed && hoveredChatId === chat.id && (
                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-0.5">
                  <Dropdown>
                    <DropdownTrigger>
                      <span className="flex h-6 w-6 items-center justify-center rounded text-text-muted hover:bg-border hover:text-text-primary">
                        <MoreHorizontal className="h-4 w-4" />
                      </span>
                    </DropdownTrigger>
                    <DropdownContent align="end">
                      <DropdownItem
                        icon={<Pencil className="h-4 w-4" />}
                        onClick={() => {
                          const newTitle = prompt('Rename conversation:', chat.title);
                          if (newTitle) onRenameConversation?.(chat.id, newTitle);
                        }}
                      >
                        Rename
                      </DropdownItem>
                      <DropdownDivider />
                      <DropdownItem
                        icon={<Trash2 className="h-4 w-4" />}
                        danger
                        onClick={() => onDeleteConversation?.(chat.id)}
                      >
                        Delete
                      </DropdownItem>
                    </DropdownContent>
                  </Dropdown>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <aside
      className={cn(
        `
        flex h-screen flex-col
        border-r border-border bg-background-secondary
        transition-all duration-300 ease-out
      `,
        collapsed ? 'w-[68px]' : 'w-[260px]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          {/* Logo */}
          <div className="relative h-8 w-8 shrink-0">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent to-purple-500 opacity-80" />
            <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-accent to-purple-400" />
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold text-text-primary">Araviel</span>
          )}
        </Link>
        <button
          onClick={() => onCollapsedChange?.(!collapsed)}
          className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-background-tertiary hover:text-text-primary"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <Button
          onClick={onNewChat}
          className={cn('w-full', collapsed && 'px-0')}
          size={collapsed ? 'icon' : 'md'}
        >
          <Plus className="h-5 w-5" />
          {!collapsed && <span>New chat</span>}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="px-3">
        {SIDEBAR_NAV.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                `
                flex items-center gap-3 rounded-lg px-3 py-2.5 mb-0.5
                text-sm font-medium text-text-secondary
                transition-colors duration-150
                hover:bg-background-tertiary hover:text-text-primary
              `,
                isActive && 'bg-accent-soft text-accent',
                collapsed && 'justify-center'
              )}
              title={collapsed ? item.label : undefined}
            >
              {Icon && <Icon className="h-5 w-5" />}
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.id === 'rewards' && (
                <span className="ml-auto rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
                  42
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-3 my-3 h-px bg-border" />

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-2">
        {!collapsed && conversations.length > 0 && (
          <h3 className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
            Recent
          </h3>
        )}

        {conversations.length === 0 ? (
          !collapsed && (
            <p className="px-3 text-sm text-text-muted">No conversations yet</p>
          )
        ) : (
          <>
            {renderChatGroup('Today', groupedChats.today)}
            {renderChatGroup('Yesterday', groupedChats.yesterday)}
            {renderChatGroup('Previous 7 Days', groupedChats.previous7Days)}
            {renderChatGroup('Older', groupedChats.older)}
          </>
        )}
      </div>

      {/* Profile Section */}
      <div className="border-t border-border p-3">
        <ProfileMenu user={user} collapsed={collapsed} />
      </div>
    </aside>
  );
}
