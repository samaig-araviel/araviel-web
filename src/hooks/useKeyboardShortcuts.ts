'use client';

import * as React from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectSidebarOpen, selectActiveModal } from '@/store/selectors';
import { toggleSidebar, closeModal } from '@/store/slices/uiSlice';
import { createNewChat } from '@/store/slices/chatSlice';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  when?: () => boolean;
}

/**
 * Custom hook for global keyboard shortcuts
 */
export function useKeyboardShortcuts() {
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector(selectSidebarOpen);
  const activeModal = useAppSelector(selectActiveModal);

  const shortcuts = React.useMemo<ShortcutConfig[]>(
    () => [
      {
        key: 'k',
        ctrl: true,
        action: () => dispatch(createNewChat()),
        description: 'New chat',
      },
      {
        key: 'b',
        ctrl: true,
        action: () => dispatch(toggleSidebar()),
        description: 'Toggle sidebar',
      },
      {
        key: 'Escape',
        action: () => {
          if (activeModal.type) {
            dispatch(closeModal());
          }
        },
        description: 'Close modal',
        when: () => activeModal.type !== null,
      },
    ],
    [dispatch, activeModal.type]
  );

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isInput && e.key !== 'Escape') return;

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl
          ? e.ctrlKey || e.metaKey
          : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const conditionMet = shortcut.when ? shortcut.when() : true;

        if (ctrlMatch && shiftMatch && altMatch && keyMatch && conditionMet) {
          e.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  return shortcuts;
}

/**
 * Hook for registering a single keyboard shortcut
 */
export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: {
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
    enabled?: boolean;
  } = {}
) {
  const { ctrl, meta, shift, alt, enabled = true } = options;

  React.useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isInput && key !== 'Escape') return;

      const ctrlMatch = ctrl ? e.ctrlKey : meta ? e.metaKey : !e.ctrlKey && !e.metaKey;
      const shiftMatch = shift ? e.shiftKey : !e.shiftKey;
      const altMatch = alt ? e.altKey : !e.altKey;
      const keyMatch = e.key.toLowerCase() === key.toLowerCase();

      if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, ctrl, meta, shift, alt, enabled]);
}
