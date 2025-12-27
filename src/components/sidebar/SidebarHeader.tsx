'use client';

import * as React from 'react';
import { LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectSidebarOpen } from '@/store/selectors';
import { toggleSidebar } from '@/store/slices/uiSlice';

const LogoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'w-7 h-7 bg-gradient-to-br from-accent-primary to-accent-hover',
      'rounded-md flex items-center justify-center relative flex-shrink-0',
      className
    )}
  >
    <span className="absolute w-1.5 h-1.5 bg-background-secondary rounded-full left-2" />
    <span className="absolute w-1.5 h-1.5 bg-background-secondary rounded-full right-2" />
  </div>
);

const SidebarHeader: React.FC = () => {
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector(selectSidebarOpen);

  const handleToggle = () => {
    dispatch(toggleSidebar());
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 px-4 py-3.5 flex-shrink-0 min-h-[60px]',
        !sidebarOpen && 'px-1.5 justify-center'
      )}
    >
      {sidebarOpen && (
        <>
          <LogoIcon />
          <h1 className="text-base font-semibold tracking-tight text-text-primary flex-1">
            Araviel
          </h1>
        </>
      )}
      <button
        onClick={handleToggle}
        className={cn(
          'w-7 h-7 flex items-center justify-center rounded-md',
          'text-text-secondary hover:text-text-primary',
          'hover:bg-background-tertiary transition-colors',
          'flex-shrink-0',
          !sidebarOpen && 'ml-0'
        )}
        aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <LayoutGrid size={14} />
      </button>
    </div>
  );
};

export { SidebarHeader, LogoIcon };
