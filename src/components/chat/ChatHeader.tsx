'use client';

import * as React from 'react';
import {
  Menu,
  MoreVertical,
  Share2,
  Download,
  Trash2,
  Edit3,
  FolderPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectCurrentChat,
  selectSidebarOpen,
  selectCurrentProject,
} from '@/store/selectors';
import { toggleSidebar, openDropdown, openModal } from '@/store/slices/uiSlice';
import type { RootState } from '@/store';

const ChatHeader: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentChat = useAppSelector(selectCurrentChat);
  const sidebarOpen = useAppSelector(selectSidebarOpen);
  const currentProject = useAppSelector((state: RootState) => {
    if (!currentChat?.projectId) return null;
    return state.project.projects.find((p) => p.id === currentChat.projectId);
  });

  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  const handleMenuClick = () => {
    setShowMenu(!showMenu);
  };

  const handleRename = () => {
    setShowMenu(false);
    if (currentChat) {
      dispatch(openModal({ type: 'chatRename', targetId: currentChat.id }));
    }
  };

  const handleMoveToProject = () => {
    setShowMenu(false);
    if (currentChat) {
      dispatch(openModal({ type: 'chatMoveToProject', targetId: currentChat.id }));
    }
  };

  const handleShare = () => {
    setShowMenu(false);
    // TODO: Implement share functionality
  };

  const handleExport = () => {
    setShowMenu(false);
    // TODO: Implement export functionality
  };

  const handleDelete = () => {
    setShowMenu(false);
    if (currentChat) {
      dispatch(openModal({ type: 'chatDelete', targetId: currentChat.id }));
    }
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  return (
    <header
      className={cn(
        'flex items-center justify-between px-4 py-3',
        'border-b border-border bg-background-primary/80 backdrop-blur-xl',
        'sticky top-0 z-30'
      )}
    >
      {/* Left Section */}
      <div className="flex items-center gap-3">
        {/* Sidebar Toggle (visible when sidebar is closed) */}
        {!sidebarOpen && (
          <button
            onClick={handleToggleSidebar}
            className={cn(
              'flex items-center justify-center w-9 h-9 rounded-lg',
              'text-text-secondary hover:text-text-primary',
              'hover:bg-background-tertiary transition-all duration-200'
            )}
          >
            <Menu size={20} />
          </button>
        )}

        {/* Chat Title */}
        <div className="flex flex-col">
          <h1 className="text-sm font-semibold text-text-primary truncate max-w-[200px] sm:max-w-[300px] md:max-w-none">
            {currentChat?.title || 'New Chat'}
          </h1>
          {currentProject && (
            <span className="text-[10px] text-text-tertiary flex items-center gap-1">
              <span>{currentProject.emoji}</span>
              <span>{currentProject.name}</span>
            </span>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Share Button */}
        <button
          onClick={handleShare}
          className={cn(
            'hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
            'text-xs font-medium text-text-secondary',
            'hover:text-text-primary hover:bg-background-tertiary',
            'transition-all duration-200'
          )}
        >
          <Share2 size={14} />
          <span>Share</span>
        </button>

        {/* Menu Button */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={handleMenuClick}
            className={cn(
              'flex items-center justify-center w-9 h-9 rounded-lg',
              'text-text-secondary hover:text-text-primary',
              'hover:bg-background-tertiary transition-all duration-200',
              showMenu && 'bg-background-tertiary text-text-primary'
            )}
          >
            <MoreVertical size={18} />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div
              className={cn(
                'absolute right-0 top-full mt-2',
                'min-w-[180px] py-1.5',
                'bg-background-secondary border border-border rounded-xl',
                'shadow-xl shadow-black/20',
                'animate-slideDown z-50'
              )}
            >
              <button
                onClick={handleRename}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2',
                  'text-sm text-text-secondary hover:text-text-primary hover:bg-background-tertiary',
                  'transition-all duration-200'
                )}
              >
                <Edit3 size={14} />
                <span>Rename</span>
              </button>

              <button
                onClick={handleMoveToProject}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2',
                  'text-sm text-text-secondary hover:text-text-primary hover:bg-background-tertiary',
                  'transition-all duration-200'
                )}
              >
                <FolderPlus size={14} />
                <span>Move to project</span>
              </button>

              <button
                onClick={handleShare}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 sm:hidden',
                  'text-sm text-text-secondary hover:text-text-primary hover:bg-background-tertiary',
                  'transition-all duration-200'
                )}
              >
                <Share2 size={14} />
                <span>Share</span>
              </button>

              <button
                onClick={handleExport}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2',
                  'text-sm text-text-secondary hover:text-text-primary hover:bg-background-tertiary',
                  'transition-all duration-200'
                )}
              >
                <Download size={14} />
                <span>Export</span>
              </button>

              <div className="my-1.5 border-t border-border" />

              <button
                onClick={handleDelete}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2',
                  'text-sm text-red-400 hover:bg-red-500/10',
                  'transition-all duration-200'
                )}
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export { ChatHeader };
