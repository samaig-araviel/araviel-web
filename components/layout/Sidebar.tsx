'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  MessageSquare,
  Moon,
  Sun,
} from 'lucide-react';
import { cn, truncate, groupConversationsByDate } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import type { Conversation, User, Project } from '@/types';

interface SidebarProps {
  user: User;
  conversations: Conversation[];
  projects: Project[];
  activeConversationId?: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onNewChat?: () => void;
  onSelectConversation?: (id: string) => void;
  onRenameConversation?: (id: string, title: string) => void;
  onDeleteConversation?: (id: string) => void;
}

const navItems = [
  { id: 'home', label: 'Home', icon: Home, href: '/' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
];

export function Sidebar({
  user,
  conversations,
  projects,
  activeConversationId,
  collapsed = false,
  onCollapsedChange,
  onNewChat,
  onSelectConversation,
  onRenameConversation,
  onDeleteConversation,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useAppStore();
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const groupedChats = groupConversationsByDate(conversations);

  const handleRenameStart = (chat: Conversation) => {
    setRenameId(chat.id);
    setRenameValue(chat.title);
    setOpenMenuId(null);
  };

  const handleRenameSubmit = (id: string) => {
    if (renameValue.trim()) {
      onRenameConversation?.(id, renameValue.trim());
    }
    setRenameId(null);
    setRenameValue('');
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      handleRenameSubmit(id);
    } else if (e.key === 'Escape') {
      setRenameId(null);
      setRenameValue('');
    }
  };

  const toggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    } else {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  };

  const renderChatGroup = (title: string, chats: Conversation[]) => {
    if (chats.length === 0) return null;

    return (
      <div key={title} className="mb-3">
        {!collapsed && (
          <h4 className="mb-1.5 px-3 text-xs font-medium text-text-muted">
            {title}
          </h4>
        )}
        <div className="space-y-0.5">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className="group relative"
              onMouseEnter={() => setHoveredChatId(chat.id)}
              onMouseLeave={() => {
                setHoveredChatId(null);
                if (openMenuId === chat.id) setOpenMenuId(null);
              }}
            >
              {renameId === chat.id ? (
                <div className="px-2">
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => handleRenameSubmit(chat.id)}
                    onKeyDown={(e) => handleRenameKeyDown(e, chat.id)}
                    className="w-full rounded-md border border-accent bg-background-secondary px-2 py-1.5 text-sm text-text-primary focus:outline-none"
                    autoFocus
                  />
                </div>
              ) : (
                <button
                  onClick={() => {
                    onSelectConversation?.(chat.id);
                    router.push(`/chat/${chat.id}`);
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-background-tertiary hover:text-text-primary',
                    activeConversationId === chat.id && 'bg-accent-soft text-accent'
                  )}
                  title={collapsed ? chat.title : undefined}
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <span className="flex-1 truncate text-left">
                      {truncate(chat.title, 22)}
                    </span>
                  )}
                </button>
              )}

              {/* Chat menu */}
              {!collapsed && hoveredChatId === chat.id && renameId !== chat.id && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === chat.id ? null : chat.id);
                      }}
                      className="flex h-6 w-6 items-center justify-center rounded text-text-muted hover:bg-border hover:text-text-primary"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>

                    {openMenuId === chat.id && (
                      <div className="absolute right-0 top-full z-50 mt-1 w-32 animate-fade-in rounded-lg border border-border bg-background-secondary p-1 shadow-lg">
                        <button
                          onClick={() => handleRenameStart(chat)}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-secondary hover:bg-background-tertiary hover:text-text-primary"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Rename
                        </button>
                        <button
                          onClick={() => {
                            onDeleteConversation?.(chat.id);
                            setOpenMenuId(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-error hover:bg-error-soft"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
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
        'flex h-screen flex-col border-r border-border bg-background-secondary transition-all duration-200',
        collapsed ? 'w-[60px]' : 'w-[260px]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle px-3 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent">
            <span className="text-sm font-bold text-white">A</span>
          </div>
          {!collapsed && (
            <span className="text-base font-semibold text-text-primary">Araviel</span>
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
          <Plus className="h-4 w-4" />
          {!collapsed && <span>New chat</span>}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-background-tertiary hover:text-text-primary',
                isActive && 'bg-accent-soft text-accent',
                collapsed && 'justify-center'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-3 my-2 h-px bg-border-subtle" />

      {/* Projects Section */}
      {!collapsed && projects.length > 0 && (
        <div className="px-2">
          <button
            onClick={() => setProjectsExpanded(!projectsExpanded)}
            className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-text-muted hover:text-text-secondary"
          >
            <span>Projects</span>
            <ChevronDown
              className={cn('h-3.5 w-3.5 transition-transform', !projectsExpanded && '-rotate-90')}
            />
          </button>
          {projectsExpanded && (
            <div className="space-y-0.5">
              {projects.map((project) => (
                <button
                  key={project.id}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-background-tertiary hover:text-text-primary"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="truncate">{project.name}</span>
                  <span className="ml-auto text-xs text-text-muted">
                    {project.conversationIds.length}
                  </span>
                </button>
              ))}
            </div>
          )}
          <div className="mx-3 my-2 h-px bg-border-subtle" />
        </div>
      )}

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-2">
        {conversations.length === 0 ? (
          !collapsed && (
            <p className="px-3 py-4 text-center text-sm text-text-muted">
              No conversations yet
            </p>
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

      {/* Footer - User Profile */}
      <div className="border-t border-border-subtle p-3">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <Avatar
            src={user.avatar}
            alt={user.name}
            fallback={user.name}
            size="sm"
          />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-text-primary">
                {user.name}
              </div>
              <div className="truncate text-xs text-text-muted">{user.email}</div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={toggleTheme}
              className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-background-tertiary hover:text-text-primary"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
