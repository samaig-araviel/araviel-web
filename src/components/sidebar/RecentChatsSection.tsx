'use client';

import * as React from 'react';
import { Clock, ChevronDown, MessageCircle, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectOrphanChats,
  selectSidebarOpen,
  selectRecentsDropdownOpen,
} from '@/store/selectors';
import { toggleRecentsDropdown, openDropdown } from '@/store/slices/uiSlice';
import { setCurrentChat } from '@/store/slices/chatSlice';
import type { Chat } from '@/types';
import type { RootState } from '@/store';

// Chat Item Component
interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
  onSelect: () => void;
  onMenuClick: (e: React.MouseEvent) => void;
}

const ChatItem: React.FC<ChatItemProps> = ({
  chat,
  isActive,
  onSelect,
  onMenuClick,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="group flex items-center gap-1">
      <button
        onClick={onSelect}
        className={cn(
          'flex-1 flex items-center gap-2.5 px-3 py-2 rounded-lg',
          'text-left transition-all duration-200',
          'border border-transparent',
          isActive
            ? 'bg-gradient-to-br from-accent-primary/15 to-accent-hover/10 border-accent-primary/30 text-text-primary'
            : 'text-text-secondary hover:bg-background-tertiary hover:text-text-primary'
        )}
      >
        <MessageCircle size={14} className="flex-shrink-0 text-text-tertiary" />
        <div className="flex-1 min-w-0">
          <span className="block text-sm font-medium truncate">
            {chat.title}
          </span>
          <span className="block text-[10px] text-text-tertiary">
            {formatDate(chat.updatedAt)}
          </span>
        </div>
      </button>
      <button
        onClick={onMenuClick}
        className={cn(
          'w-7 h-7 flex items-center justify-center rounded-md',
          'text-text-secondary opacity-0 group-hover:opacity-100',
          'hover:bg-background-tertiary hover:text-text-primary',
          'transition-all duration-200'
        )}
      >
        <MoreVertical size={14} />
      </button>
    </div>
  );
};

// Main Recent Chats Section
const RecentChatsSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector(selectSidebarOpen);
  const isRecentsOpen = useAppSelector(selectRecentsDropdownOpen);
  const currentChatId = useAppSelector(
    (state: RootState) => state.chat.currentChatId
  );
  const orphanChats = useAppSelector(selectOrphanChats);

  const handleToggleRecents = () => {
    dispatch(toggleRecentsDropdown());
  };

  const handleChatSelect = (chatId: string) => {
    dispatch(setCurrentChat(chatId));
  };

  const handleChatMenuClick = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    dispatch(
      openDropdown({
        type: 'chatMenu',
        targetId: chatId,
        position: { top: rect.bottom + 4, left: rect.left },
      })
    );
  };

  if (!sidebarOpen) {
    return (
      <div className="px-1.5 mb-2">
        <button
          onClick={handleToggleRecents}
          className={cn(
            'w-[38px] h-[38px] flex items-center justify-center rounded-lg',
            'text-text-secondary hover:text-text-primary',
            'hover:bg-background-tertiary transition-colors'
          )}
        >
          <Clock size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="px-2 mb-2">
      {/* Recent Chats Header */}
      <button
        onClick={handleToggleRecents}
        className={cn(
          'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg',
          'text-text-secondary text-sm font-medium',
          'transition-all duration-200',
          'hover:bg-background-tertiary hover:text-text-primary',
          isRecentsOpen && 'text-text-primary'
        )}
      >
        <Clock size={18} />
        <span className="flex-1 text-left">Recent</span>
        <ChevronDown
          size={12}
          className={cn(
            'transition-transform duration-200',
            isRecentsOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Recent Chats Dropdown */}
      {isRecentsOpen && (
        <div className="pt-1">
          {orphanChats.length === 0 ? (
            <p className="text-xs text-text-tertiary text-center py-3">
              No recent chats
            </p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {orphanChats.slice(0, 10).map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isActive={chat.id === currentChatId}
                  onSelect={() => handleChatSelect(chat.id)}
                  onMenuClick={(e) => handleChatMenuClick(e, chat.id)}
                />
              ))}
              {orphanChats.length > 10 && (
                <button
                  className={cn(
                    'w-full text-center py-2 text-xs text-text-tertiary',
                    'hover:text-accent-primary transition-colors'
                  )}
                >
                  View all ({orphanChats.length})
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { RecentChatsSection };
