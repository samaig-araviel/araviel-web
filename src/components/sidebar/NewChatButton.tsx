'use client';

import * as React from 'react';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectSidebarOpen } from '@/store/selectors';
import { clearCurrentChat } from '@/store/slices/chatSlice';

interface NewChatButtonProps {
  onClick?: () => void;
}

const NewChatButton: React.FC<NewChatButtonProps> = ({ onClick }) => {
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector(selectSidebarOpen);

  const handleClick = () => {
    dispatch(clearCurrentChat());
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex items-center gap-2.5 rounded-lg',
        'bg-gradient-to-br from-accent-primary/10 to-accent-hover/5',
        'border border-accent-primary/30',
        'text-text-primary text-sm font-medium',
        'transition-all duration-200',
        'hover:from-accent-primary/15 hover:to-accent-hover/8',
        'hover:border-accent-primary',
        'hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(217,120,70,0.2)]',
        sidebarOpen
          ? 'px-3 py-2 mx-3 mb-4'
          : 'w-[38px] h-[38px] mx-1.5 mb-3 justify-center'
      )}
    >
      <MessageSquare
        size={16}
        className="flex-shrink-0 text-accent-primary"
      />
      {sidebarOpen && <span>New chat</span>}
    </button>
  );
};

export { NewChatButton };
