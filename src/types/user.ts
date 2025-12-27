/**
 * User-related type definitions
 */

import type { ModelType } from './chat';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  initials: string;
}

export interface UserSettings {
  defaultModel: ModelType;
  enableWebSearch: boolean;
  enableFileAttachments: boolean;
  maxFileSize: number; // in MB
  maxAttachments: number;
}

export interface UserState {
  user: User | null;
  settings: UserSettings;
  isAuthenticated: boolean;
}

export const DEFAULT_USER: User = {
  id: 'user-1',
  name: 'Sam Aigbotsua',
  email: 'saigbotsua@gmail.com',
  initials: 'S',
};

export const DEFAULT_SETTINGS: UserSettings = {
  defaultModel: 'Auto',
  enableWebSearch: true,
  enableFileAttachments: true,
  maxFileSize: 10,
  maxAttachments: 10,
};
