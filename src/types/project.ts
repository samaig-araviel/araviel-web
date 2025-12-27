/**
 * Project-related type definitions
 */

import type { ModelType } from './chat';

export interface Category {
  id: string;
  name: string;
  emoji: string;
  isCustom: boolean;
}

export interface Project {
  id: string;
  name: string;
  category: string;
  emoji: string;
  description: string;
  instructions: string;
  model: ModelType;
  webEnabled: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFormData {
  name: string;
  category: string;
  emoji: string;
  description: string;
  instructions: string;
  model: ModelType;
  webEnabled: boolean;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'work', name: 'Work', emoji: '💼', isCustom: false },
  { id: 'personal', name: 'Personal', emoji: '✨', isCustom: false },
  { id: 'research', name: 'Research', emoji: '🔬', isCustom: false },
  { id: 'creative', name: 'Creative', emoji: '🎨', isCustom: false },
];

export const EMOJI_OPTIONS = [
  '💼', '✨', '🔬', '🎨', '📚', '💡', '🎯', '🚀', '⚡', '🌟',
  '🎭', '🎪', '🎬', '🎸', '🎮', '🏆', '💻', '📱', '🔧', '🔨',
];

export interface ProjectState {
  projects: Project[];
  categories: Category[];
  currentProjectId: string | null;
}
