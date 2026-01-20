'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Share2, MoreHorizontal, Download, Trash2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatHeaderProps {
  title: string;
  onTitleChange?: (title: string) => void;
  onShare?: () => void;
  onExport?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function ChatHeader({
  title,
  onTitleChange,
  onShare,
  onExport,
  onDelete,
  className,
}: ChatHeaderProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSave = () => {
    if (editValue.trim() && editValue !== title) {
      onTitleChange?.(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <header
      className={cn(
        'flex h-14 items-center justify-between border-b border-border bg-background-secondary px-4',
        className
      )}
    >
      {/* Left side - Back button on mobile and Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => router.push('/')}
          className="rounded-lg p-2 text-text-muted transition-colors hover:bg-background-tertiary hover:text-text-primary md:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              className="rounded-md border border-accent bg-background-primary px-2 py-1 text-sm text-text-primary focus:outline-none"
              autoFocus
            />
            <button
              onClick={handleSave}
              className="rounded p-1 text-success hover:bg-success-soft"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={handleCancel}
              className="rounded p-1 text-error hover:bg-error-soft"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="truncate rounded-md px-2 py-1 text-sm font-medium text-text-primary transition-colors hover:bg-background-tertiary"
          >
            {title}
          </button>
        )}
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onShare}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-background-tertiary hover:text-text-primary"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Share</span>
        </button>

        {/* More Menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-background-tertiary hover:text-text-primary"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-1 w-40 animate-fade-in rounded-lg border border-border bg-background-secondary p-1 shadow-lg">
                <button
                  onClick={() => {
                    onExport?.();
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-background-tertiary hover:text-text-primary"
                >
                  <Download className="h-4 w-4" />
                  Export chat
                </button>
                <div className="my-1 h-px bg-border-subtle" />
                <button
                  onClick={() => {
                    onDelete?.();
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-error transition-colors hover:bg-error-soft"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete chat
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
