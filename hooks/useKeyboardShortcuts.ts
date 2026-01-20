'use client';

import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  callback: () => void;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlOrMeta = shortcut.ctrl || shortcut.meta;
        const hasModifier = ctrlOrMeta
          ? event.ctrlKey || event.metaKey
          : true;
        const hasShift = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const hasAlt = shortcut.alt ? event.altKey : !event.altKey;
        const hasKey = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (hasModifier && hasShift && hasAlt && hasKey) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.callback();
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Pre-configured common shortcuts hook
export function useAppKeyboardShortcuts({
  onNewChat,
  onToggleSidebar,
  onOpenSettings,
  onSearch,
}: {
  onNewChat?: () => void;
  onToggleSidebar?: () => void;
  onOpenSettings?: () => void;
  onSearch?: () => void;
}) {
  const shortcuts: ShortcutConfig[] = [];

  if (onNewChat) {
    shortcuts.push({
      key: 'n',
      ctrl: true,
      callback: onNewChat,
    });
  }

  if (onToggleSidebar) {
    shortcuts.push({
      key: '/',
      ctrl: true,
      callback: onToggleSidebar,
    });
  }

  if (onOpenSettings) {
    shortcuts.push({
      key: ',',
      ctrl: true,
      callback: onOpenSettings,
    });
  }

  if (onSearch) {
    shortcuts.push({
      key: 'k',
      ctrl: true,
      callback: onSearch,
    });
  }

  useKeyboardShortcuts(shortcuts);
}
