import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../store';
import { setCurrentChat, selectCurrentChatId } from '../../store/chatSlice';
import { selectProjectById } from '../../store/projectSlice';
import { openModal } from '../../store/uiSlice';
import {
  ClockIcon,
  ChevronDownIcon,
  MoreVerticalIcon,
  EditIcon,
  TrashIcon,
} from '../Icons';
import { Dropdown, DropdownItem, DropdownDivider } from '../Common';
import { formatTimeAgo } from '../../utils/formatters';
import styles from './RecentsSection.module.css';

interface RecentsSectionProps {
  isCollapsed: boolean;
}

export const RecentsSection: React.FC<RecentsSectionProps> = ({ isCollapsed }) => {
  const dispatch = useAppDispatch();
  const [isExpanded, setIsExpanded] = useState(true);
  const [displayCount, setDisplayCount] = useState(10);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const allChats = useAppSelector((state) => state.chat.chats);
  const currentChatId = useAppSelector(selectCurrentChatId);

  const sortedChats = [...allChats]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const visibleChats = sortedChats.slice(0, displayCount);
  const hasMore = sortedChats.length > displayCount;

  if (isCollapsed) {
    return null;
  }

  const handleChatAction = (action: string, chatId: string) => {
    setActiveMenu(null);
    switch (action) {
      case 'rename':
        dispatch(openModal({ type: 'renameChat', data: { chatId } }));
        break;
      case 'delete':
        dispatch(openModal({ type: 'deleteChat', data: { chatId } }));
        break;
    }
  };

  return (
    <div className={styles.section}>
      <button
        className={`${styles.header} ${isExpanded ? styles.active : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <ClockIcon size={18} />
        <span>Recents</span>
        <ChevronDownIcon
          size={12}
          className={`${styles.arrow} ${isExpanded ? styles.expanded : ''}`}
        />
      </button>

      {isExpanded && (
        <div className={styles.content}>
          {visibleChats.length === 0 ? (
            <div className={styles.empty}>No recent chats</div>
          ) : (
            <>
              <div className={styles.chatList}>
                {visibleChats.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === currentChatId}
                    activeMenu={activeMenu}
                    setActiveMenu={setActiveMenu}
                    onSelect={() => dispatch(setCurrentChat(chat.id))}
                    onAction={handleChatAction}
                  />
                ))}
              </div>

              {hasMore && (
                <button
                  className={styles.showMore}
                  onClick={() => setDisplayCount((prev) => prev + 10)}
                >
                  Show more ({sortedChats.length - displayCount} remaining)
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

interface ChatItemProps {
  chat: {
    id: string;
    title: string;
    projectId: string | null;
    updatedAt: string;
  };
  isActive: boolean;
  activeMenu: string | null;
  setActiveMenu: (id: string | null) => void;
  onSelect: () => void;
  onAction: (action: string, chatId: string) => void;
}

const ChatItem: React.FC<ChatItemProps> = ({
  chat,
  isActive,
  activeMenu,
  setActiveMenu,
  onSelect,
  onAction,
}) => {
  const project = useAppSelector((state) =>
    chat.projectId ? selectProjectById(state, chat.projectId) : undefined
  );
  const showMenu = activeMenu === chat.id;

  const displayTitle =
    chat.title.length > 40 ? chat.title.substring(0, 37) + '...' : chat.title;

  return (
    <div className={styles.chatWrapper}>
      <button
        className={`${styles.chatItem} ${isActive ? styles.active : ''}`}
        onClick={onSelect}
      >
        <div className={styles.chatTitle} title={chat.title}>
          {displayTitle || 'Untitled conversation'}
        </div>
        <div className={styles.chatMeta}>
          {project && (
            <>
              <span className={styles.chatProject}>
                {project.emoji} {project.name.length > 15 ? project.name.substring(0, 12) + '...' : project.name}
              </span>
              <span>•</span>
            </>
          )}
          <span className={styles.chatTime}>{formatTimeAgo(new Date(chat.updatedAt))}</span>
        </div>
      </button>

      <div className={styles.menuWrapper}>
        <button
          className={styles.menuBtn}
          onClick={(e) => {
            e.stopPropagation();
            setActiveMenu(showMenu ? null : chat.id);
          }}
        >
          <MoreVerticalIcon size={14} />
        </button>

        <Dropdown
          isOpen={showMenu}
          onClose={() => setActiveMenu(null)}
          position="bottom"
          align="end"
        >
          <DropdownItem
            icon={<EditIcon size={16} />}
            onClick={() => onAction('rename', chat.id)}
          >
            Rename
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem
            icon={<TrashIcon size={16} />}
            onClick={() => onAction('delete', chat.id)}
            danger
          >
            Delete
          </DropdownItem>
        </Dropdown>
      </div>
    </div>
  );
};
