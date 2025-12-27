/**
 * UI state type definitions
 */

export type ThemeMode = 'light' | 'dark' | 'system';

export type ModalType =
  | 'projectCreate'
  | 'projectDelete'
  | 'projectRename'
  | 'chatDelete'
  | 'chatRename'
  | 'fileLimit'
  | 'feedback'
  | null;

export type DropdownType =
  | 'profile'
  | 'topMenu'
  | 'attachment'
  | 'chatAttachment'
  | 'quality'
  | 'chatQuality'
  | 'model'
  | 'share'
  | 'projectMenu'
  | 'chatMenu'
  | null;

export interface ModalState {
  type: ModalType;
  data?: {
    id?: string;
    title?: string;
    feedbackType?: 'positive' | 'negative';
  };
}

export interface DropdownState {
  type: DropdownType;
  targetId?: string;
  position?: {
    top: number;
    left: number;
    right?: number;
  };
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export interface UIState {
  theme: ThemeMode;
  sidebarOpen: boolean;
  projectsDropdownOpen: boolean;
  recentsDropdownOpen: boolean;
  archivedDropdownOpen: boolean;
  activeModal: ModalState;
  activeDropdown: DropdownState;
  toasts: ToastMessage[];
  isMobile: boolean;
  scrolledFromBottom: boolean;
}
