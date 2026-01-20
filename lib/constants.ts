import type { ModelInfo, QuickAction, DailyInsight } from '@/types';

// ===== MODEL INFORMATION =====
export const MODELS: Record<string, ModelInfo> = {
  claude: {
    id: 'claude',
    name: 'Claude Sonnet',
    description: 'Writing & analysis',
    color: '#F97316',
    icon: '🟠',
  },
  gpt4: {
    id: 'gpt4',
    name: 'GPT-4',
    description: 'Reasoning & code',
    color: '#22C55E',
    icon: '🟢',
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini Pro',
    description: 'Research & facts',
    color: '#3B82F6',
    icon: '🔵',
  },
  perplexity: {
    id: 'perplexity',
    name: 'Perplexity',
    description: 'Real-time search',
    color: '#8B5CF6',
    icon: '🟣',
  },
};

export const MODEL_LIST = Object.values(MODELS);

// ===== QUICK ACTIONS =====
export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'write',
    icon: '✍️',
    label: 'Write',
    promptStarter: 'Help me write ',
  },
  {
    id: 'brainstorm',
    icon: '💡',
    label: 'Brainstorm',
    promptStarter: 'Give me ideas for ',
  },
  {
    id: 'code',
    icon: '💻',
    label: 'Code',
    promptStarter: 'Help me build ',
  },
  {
    id: 'research',
    icon: '🔍',
    label: 'Research',
    promptStarter: 'Find information about ',
  },
  {
    id: 'analyze',
    icon: '📊',
    label: 'Analyze',
    promptStarter: 'Analyze this data: ',
  },
  {
    id: 'create',
    icon: '🎨',
    label: 'Create',
    promptStarter: 'Create an image of ',
  },
  {
    id: 'learn',
    icon: '📚',
    label: 'Learn',
    promptStarter: 'Explain how ',
  },
  {
    id: 'plan',
    icon: '🗓️',
    label: 'Plan',
    promptStarter: 'Help me plan ',
  },
];

// ===== DAILY INSIGHTS =====
export const DAILY_INSIGHTS: DailyInsight[] = [
  {
    id: 'tip-1',
    type: 'tip',
    title: 'Pro Tip',
    content: 'Use ⌘K to quickly search through your conversations and find any topic.',
    icon: '💡',
  },
  {
    id: 'tip-2',
    type: 'tip',
    title: 'Pro Tip',
    content: 'Try "Auto" mode to let Araviel choose the best AI for your question.',
    icon: '✨',
  },
  {
    id: 'feature-1',
    type: 'feature',
    title: 'New Feature',
    content: 'You can now attach files to your messages for better context.',
    icon: '📎',
  },
  {
    id: 'quote-1',
    type: 'quote',
    title: 'Daily Quote',
    content: '"The only way to do great work is to love what you do." — Steve Jobs',
    icon: '💬',
  },
  {
    id: 'quote-2',
    type: 'quote',
    title: 'Daily Quote',
    content: '"Clarity is the counterbalance of profound thoughts." — Luc de Clapiers',
    icon: '💬',
  },
];

// ===== KEYBOARD SHORTCUTS =====
export const KEYBOARD_SHORTCUTS = [
  { key: '⌘/Ctrl + K', action: 'Command palette / Search' },
  { key: '⌘/Ctrl + N', action: 'New chat' },
  { key: '⌘/Ctrl + /', action: 'Toggle sidebar' },
  { key: '⌘/Ctrl + ,', action: 'Settings' },
  { key: 'Enter', action: 'Send message' },
  { key: 'Shift + Enter', action: 'New line' },
  { key: 'Escape', action: 'Close modal/dropdown' },
  { key: '↑', action: 'Edit last message (when input empty)' },
];

// ===== NAVIGATION =====
export const SIDEBAR_NAV = [
  { id: 'home', label: 'Home', icon: 'Home', href: '/' },
  { id: 'discover', label: 'Discover', icon: 'Compass', href: '/discover' },
  { id: 'rewards', label: 'Rewards', icon: 'Star', href: '/rewards' },
];

// ===== PROFILE MENU =====
export const PROFILE_MENU_ITEMS = [
  { id: 'settings', label: 'Settings', icon: 'Settings' },
  { id: 'appearance', label: 'Appearance', icon: 'Palette' },
  { id: 'personalization', label: 'Personalization', icon: 'User' },
  { id: 'help', label: 'Help & Support', icon: 'HelpCircle' },
  { type: 'divider' as const },
  { id: 'signout', label: 'Sign out', icon: 'LogOut' },
];

// ===== PLACEHOLDER USER =====
export const DEFAULT_USER = {
  id: 'user-1',
  name: 'Sam',
  email: 'sam@araviel.com',
  plan: 'navigator' as const,
  preferences: {
    mood: 'focused' as const,
    tone: 'friendly' as const,
    interests: ['technology', 'productivity', 'design'],
    defaultModel: 'auto' as const,
    responseLength: 'balanced' as const,
  },
  createdAt: new Date(),
};

// ===== STORAGE KEYS =====
export const STORAGE_KEYS = {
  THEME: 'araviel-theme',
  CONVERSATIONS: 'araviel-conversations',
  USER_PREFERENCES: 'araviel-preferences',
  SIDEBAR_COLLAPSED: 'araviel-sidebar-collapsed',
};

// ===== API ENDPOINTS =====
export const API_ENDPOINTS = {
  CHAT: '/api/chat',
  CONVERSATIONS: '/api/conversations',
};
