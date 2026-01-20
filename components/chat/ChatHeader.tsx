'use client';

import { useState } from 'react';
import { Share2, MoreHorizontal, Pencil, Download, Trash2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownDivider,
} from '@/components/ui/Dropdown';

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
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);

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
        'flex h-14 items-center justify-between border-b border-border px-4',
        className
      )}
    >
      {/* Title */}
      <div className="flex items-center gap-2 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="
                rounded-md border border-accent bg-background-secondary
                px-2 py-1 text-sm text-text-primary
                focus:outline-none
              "
              autoFocus
            />
            <button
              onClick={handleSave}
              className="rounded p-1 text-success hover:bg-success/10"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={handleCancel}
              className="rounded p-1 text-error hover:bg-error/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="
              group flex items-center gap-2
              rounded-md px-2 py-1
              hover:bg-background-tertiary
            "
          >
            <h1 className="truncate text-sm font-medium text-text-primary">
              {title}
            </h1>
            <Pencil className="h-3.5 w-3.5 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Share Button */}
        <button
          onClick={onShare}
          className="
            flex items-center gap-1.5 rounded-lg px-3 py-1.5
            text-sm text-text-secondary
            transition-colors hover:bg-background-tertiary hover:text-text-primary
          "
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Share</span>
        </button>

        {/* More Menu */}
        <Dropdown>
          <DropdownTrigger>
            <span className="
              flex h-8 w-8 items-center justify-center rounded-lg
              text-text-secondary
              transition-colors hover:bg-background-tertiary hover:text-text-primary
            ">
              <MoreHorizontal className="h-5 w-5" />
            </span>
          </DropdownTrigger>
          <DropdownContent align="end">
            <DropdownItem
              icon={<Download className="h-4 w-4" />}
              onClick={onExport}
            >
              Export chat
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem
              icon={<Trash2 className="h-4 w-4" />}
              danger
              onClick={onDelete}
            >
              Delete chat
            </DropdownItem>
          </DropdownContent>
        </Dropdown>
      </div>
    </header>
  );
}
