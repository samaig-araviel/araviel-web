// ============================================
// Core Type Definitions for Araviel Platform
// ============================================

export type Theme = 'light' | 'dark';

export type ModelType = 'Auto' | 'Claude' | 'ChatGPT' | 'Gemini' | 'Perplexity';

export interface FileAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  preview?: string; // Base64 for images
}

export interface Message {
  id: string;
  type: 'query' | 'response';
  content: string;
  model?: ModelType;
  attachments?: FileAttachment[];
  timestamp: string;
}

export interface Chat {
  id: string;
  title: string;
  projectId: string | null;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectCategory {
  name: string;
  emoji: string;
  isCustom?: boolean;
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

export interface UserProfile {
  name: string;
  email: string;
  initials: string;
}

export interface Settings {
  theme: Theme;
  sidebarOpen: boolean;
  defaultModel: ModelType;
}

export interface UIState {
  theme: Theme;
  sidebarOpen: boolean;
  sidebarMobileOpen: boolean;
  activeDropdown: string | null;
  activeModal: ModalType | null;
  isStreaming: boolean;
}

export type ModalType =
  | 'createProject'
  | 'deleteProject'
  | 'renameProject'
  | 'deleteChat'
  | 'renameChat'
  | 'feedback'
  | 'fileLimit'
  | null;

export interface ModalData {
  projectId?: string;
  chatId?: string;
  feedbackType?: 'positive' | 'negative';
}

// Action button for welcome screen
export interface ActionButton {
  id: string;
  label: string;
  icon: string;
  prompt: string;
}

// Model option for dropdown
export interface ModelOption {
  id: ModelType;
  name: string;
  badge?: string;
  description: string;
}

// Default categories
export const DEFAULT_CATEGORIES: ProjectCategory[] = [
  { name: 'Work', emoji: '💼' },
  { name: 'Personal', emoji: '✨' },
  { name: 'Research', emoji: '🔬' },
  { name: 'Creative', emoji: '🎨' },
];

// Available models
export const MODEL_OPTIONS: ModelOption[] = [
  { id: 'Auto', name: 'Auto', badge: 'ADE', description: 'AI Decision Engine routes to optimal model' },
  { id: 'Claude', name: 'Claude Sonnet 4.5', description: 'Best for reasoning and complex tasks' },
  { id: 'ChatGPT', name: 'ChatGPT 4', description: 'Excellent for creative and analytical work' },
  { id: 'Gemini', name: 'Gemini 2.0 Pro', description: 'Great for research and multimodal tasks' },
  { id: 'Perplexity', name: 'Perplexity', description: 'Optimized for web search and research' },
];

// Action buttons for welcome screen
export const ACTION_BUTTONS: ActionButton[] = [
  { id: 'research', label: 'Research', icon: 'search', prompt: 'Research the latest developments in ' },
  { id: 'compare', label: 'Compare', icon: 'compare', prompt: 'Compare the differences between ' },
  { id: 'latest', label: 'Latest', icon: 'calendar', prompt: 'What are the latest updates on ' },
  { id: 'summarize', label: 'Summarize', icon: 'document', prompt: 'Summarize the key points of ' },
  { id: 'explain', label: 'Explain', icon: 'help', prompt: 'Explain in simple terms ' },
  { id: 'code', label: 'Code', icon: 'code', prompt: 'Write code to ' },
  { id: 'strategize', label: 'Strategize', icon: 'layers', prompt: 'Help me strategize ' },
  { id: 'create', label: 'Create', icon: 'edit', prompt: 'Create a ' },
  { id: 'write', label: 'Write', icon: 'write', prompt: 'Write a ' },
  { id: 'learn', label: 'Learn', icon: 'book', prompt: 'Teach me about ' },
];
