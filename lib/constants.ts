import type { ModelInfo, QuickAction, DailyInsight } from '@/types';

// ===== MODEL INFORMATION =====
export const MODELS: Record<string, ModelInfo> = {
  claude: {
    id: 'claude',
    name: 'Claude',
    description: 'Writing & analysis',
    color: 'var(--model-claude)',
  },
  gpt4: {
    id: 'gpt4',
    name: 'GPT-4',
    description: 'Reasoning & code',
    color: 'var(--model-gpt)',
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    description: 'Research & facts',
    color: 'var(--model-gemini)',
  },
};

export const MODEL_LIST = Object.values(MODELS);

// ===== QUICK ACTIONS =====
export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'write',
    icon: 'PenLine',
    label: 'Write',
    description: 'Draft content',
    promptStarter: 'Help me write ',
  },
  {
    id: 'brainstorm',
    icon: 'Lightbulb',
    label: 'Brainstorm',
    description: 'Generate ideas',
    promptStarter: 'Give me ideas for ',
  },
  {
    id: 'code',
    icon: 'Code2',
    label: 'Code',
    description: 'Build & debug',
    promptStarter: 'Help me build ',
  },
  {
    id: 'research',
    icon: 'Search',
    label: 'Research',
    description: 'Find information',
    promptStarter: 'Find information about ',
  },
  {
    id: 'analyze',
    icon: 'BarChart3',
    label: 'Analyze',
    description: 'Understand data',
    promptStarter: 'Analyze this: ',
  },
  {
    id: 'learn',
    icon: 'GraduationCap',
    label: 'Learn',
    description: 'Explain concepts',
    promptStarter: 'Explain how ',
  },
];

// ===== DAILY PROMPTS =====
export const DAILY_PROMPTS: string[] = [
  'What are the key trends in AI that I should know about?',
  'Help me plan my week for maximum productivity',
  'What are some creative ways to solve this problem?',
  'Can you help me understand a complex topic simply?',
  'What questions should I be asking about my goals?',
  'Help me think through a difficult decision',
  'What are some unconventional approaches to this challenge?',
];

// ===== DAILY INSIGHTS =====
export const DAILY_INSIGHTS: DailyInsight[] = [
  {
    id: 'tip-1',
    type: 'tip',
    title: 'Pro Tip',
    content: 'Use Auto mode to let Araviel choose the best AI for your question.',
  },
  {
    id: 'tip-2',
    type: 'tip',
    title: 'Pro Tip',
    content: 'Press Enter to send, Shift+Enter for a new line.',
  },
  {
    id: 'feature-1',
    type: 'feature',
    title: 'Did you know?',
    content: 'You can organize your chats into projects for better context.',
  },
  {
    id: 'quote-1',
    type: 'quote',
    title: 'Daily Thought',
    content: '"Clarity is the counterbalance of profound thoughts." — Luc de Clapiers',
  },
  {
    id: 'quote-2',
    type: 'quote',
    title: 'Daily Thought',
    content: '"The only way to do great work is to love what you do." — Steve Jobs',
  },
];

// ===== KEYBOARD SHORTCUTS =====
export const KEYBOARD_SHORTCUTS = [
  { key: '⌘/Ctrl + N', action: 'New chat' },
  { key: '⌘/Ctrl + /', action: 'Toggle sidebar' },
  { key: 'Enter', action: 'Send message' },
  { key: 'Shift + Enter', action: 'New line' },
  { key: 'Escape', action: 'Close modal' },
];

// ===== NAVIGATION =====
export const SIDEBAR_NAV = [
  { id: 'home', label: 'Home', icon: 'Home', href: '/' },
  { id: 'projects', label: 'Projects', icon: 'FolderKanban', href: '/projects' },
  { id: 'settings', label: 'Settings', icon: 'Settings', href: '/settings' },
];

// ===== PROFILE MENU =====
export const PROFILE_MENU_ITEMS = [
  { id: 'settings', label: 'Settings', icon: 'Settings', href: '/settings' },
  { id: 'appearance', label: 'Appearance', icon: 'Palette' },
  { type: 'divider' as const },
  { id: 'signout', label: 'Sign out', icon: 'LogOut' },
];

// ===== PLACEHOLDER USER =====
export const DEFAULT_USER = {
  id: 'user-1',
  name: 'Sam',
  email: 'sam@araviel.com',
  plan: 'navigator' as const,
  xp: 420,
  streak: 7,
  preferences: {
    mood: 'focused' as const,
    tone: 'friendly' as const,
    interests: ['technology', 'productivity', 'design'],
    defaultModel: 'auto' as const,
    responseLength: 'balanced' as const,
    trustMode: false,
  },
  createdAt: new Date(),
};

// ===== PROJECTS =====
export const DEFAULT_PROJECTS = [
  { id: 'proj-1', name: 'Work', color: '#5C6AC4' },
  { id: 'proj-2', name: 'Personal', color: '#50C878' },
  { id: 'proj-3', name: 'Learning', color: '#F5A623' },
];

// ===== STORAGE KEYS =====
export const STORAGE_KEYS = {
  THEME: 'araviel-theme',
  CONVERSATIONS: 'araviel-conversations',
  USER_PREFERENCES: 'araviel-preferences',
  SIDEBAR_COLLAPSED: 'araviel-sidebar-collapsed',
  XP: 'araviel-xp',
  STREAK: 'araviel-streak',
  LAST_ACTIVE: 'araviel-last-active',
};

// ===== API ENDPOINTS =====
export const API_ENDPOINTS = {
  CHAT: '/api/chat',
  CONVERSATIONS: '/api/conversations',
};
