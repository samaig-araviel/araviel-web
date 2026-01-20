import type { ModelInfo, QuickAction, DailyInsight, Achievement, Level, KeyboardShortcut } from '@/types';

// ============================================
// ARAVIEL CONSTANTS
// ============================================

// ===== AI MODEL INFORMATION =====
export const MODELS: Record<string, ModelInfo> = {
  claude: {
    id: 'claude',
    name: 'Claude',
    provider: 'Anthropic',
    description: 'Thoughtful analysis & creative writing',
    strengths: ['Writing', 'Analysis', 'Nuanced responses', 'Ethics'],
    color: 'var(--model-claude)',
    icon: 'Sparkles',
  },
  gpt4: {
    id: 'gpt4',
    name: 'GPT-4',
    provider: 'OpenAI',
    description: 'Powerful reasoning & code generation',
    strengths: ['Code', 'Logic', 'Math', 'Complex tasks'],
    color: 'var(--model-gpt)',
    icon: 'Cpu',
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    provider: 'Google',
    description: 'Research & factual information',
    strengths: ['Research', 'Facts', 'Multimodal', 'Current events'],
    color: 'var(--model-gemini)',
    icon: 'Globe',
  },
};

export const MODEL_LIST = Object.values(MODELS);

// ===== AUTO-ROUTING KEYWORDS =====
export const ROUTING_KEYWORDS = {
  claude: [
    'write', 'essay', 'story', 'creative', 'analyze', 'review', 'explain',
    'summarize', 'think', 'opinion', 'advice', 'help me understand',
  ],
  gpt4: [
    'code', 'function', 'debug', 'fix', 'algorithm', 'program', 'build',
    'calculate', 'math', 'logic', 'solve', '```', 'javascript', 'python',
    'typescript', 'react', 'api', 'database', 'sql',
  ],
  gemini: [
    'research', 'fact', 'what is', 'who is', 'when did', 'where is',
    'history', 'science', 'news', 'data', 'statistics', 'compare',
    'latest', 'current', 'trend',
  ],
};

// ===== QUICK ACTIONS =====
export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'write',
    icon: 'PenLine',
    label: 'Write',
    description: 'Draft content & stories',
    promptStarter: 'Help me write ',
    category: 'create',
  },
  {
    id: 'brainstorm',
    icon: 'Lightbulb',
    label: 'Brainstorm',
    description: 'Generate creative ideas',
    promptStarter: 'Give me creative ideas for ',
    category: 'create',
  },
  {
    id: 'code',
    icon: 'Code2',
    label: 'Code',
    description: 'Build & debug software',
    promptStarter: 'Help me code ',
    category: 'code',
  },
  {
    id: 'research',
    icon: 'Search',
    label: 'Research',
    description: 'Find accurate information',
    promptStarter: 'Research and explain ',
    category: 'analyze',
  },
  {
    id: 'analyze',
    icon: 'BarChart3',
    label: 'Analyze',
    description: 'Understand data & patterns',
    promptStarter: 'Analyze this for me: ',
    category: 'analyze',
  },
  {
    id: 'learn',
    icon: 'GraduationCap',
    label: 'Learn',
    description: 'Understand concepts clearly',
    promptStarter: 'Teach me about ',
    category: 'learn',
  },
];

// ===== DAILY PROMPTS =====
export const DAILY_PROMPTS: string[] = [
  'What emerging technology should I learn about today?',
  'Help me plan a productive and balanced week',
  'What are some creative solutions to common problems?',
  'Explain a complex topic in simple terms',
  'What questions should I be asking about my goals?',
  'Help me make a difficult decision step by step',
  'What unconventional approaches could solve this challenge?',
  'Summarize the key trends in my industry',
];

// ===== DAILY INSIGHTS =====
export const DAILY_INSIGHTS: DailyInsight[] = [
  {
    id: 'tip-auto',
    type: 'tip',
    title: 'Smart Routing',
    content: 'Araviel automatically picks the best AI for your question. Just ask naturally!',
  },
  {
    id: 'tip-shortcuts',
    type: 'tip',
    title: 'Power User',
    content: 'Press Cmd/Ctrl + K to open the command palette for quick actions.',
  },
  {
    id: 'feature-projects',
    type: 'feature',
    title: 'Stay Organized',
    content: 'Create projects to group related conversations and maintain context.',
  },
  {
    id: 'quote-1',
    type: 'quote',
    title: 'Daily Inspiration',
    content: '"The best way to predict the future is to create it." - Peter Drucker',
  },
  {
    id: 'stat-streak',
    type: 'stat',
    title: 'Keep Going!',
    content: 'Users with 7+ day streaks are 3x more productive. Keep your streak alive!',
  },
];

// ===== LEVELS =====
export const LEVELS: Level[] = [
  { level: 1, name: 'Newcomer', minXp: 0, maxXp: 100, badge: 'bronze', perks: ['Basic chat'] },
  { level: 2, name: 'Explorer', minXp: 100, maxXp: 250, badge: 'bronze', perks: ['Quick actions'] },
  { level: 3, name: 'Seeker', minXp: 250, maxXp: 500, badge: 'bronze', perks: ['Project creation'] },
  { level: 4, name: 'Adept', minXp: 500, maxXp: 1000, badge: 'silver', perks: ['Custom themes'] },
  { level: 5, name: 'Scholar', minXp: 1000, maxXp: 2000, badge: 'silver', perks: ['Priority routing'] },
  { level: 6, name: 'Sage', minXp: 2000, maxXp: 4000, badge: 'silver', perks: ['Advanced analytics'] },
  { level: 7, name: 'Master', minXp: 4000, maxXp: 7500, badge: 'gold', perks: ['Exclusive features'] },
  { level: 8, name: 'Virtuoso', minXp: 7500, maxXp: 12500, badge: 'gold', perks: ['Beta access'] },
  { level: 9, name: 'Legend', minXp: 12500, maxXp: 20000, badge: 'platinum', perks: ['Custom AI tuning'] },
  { level: 10, name: 'Transcendent', minXp: 20000, maxXp: Infinity, badge: 'diamond', perks: ['All perks'] },
];

// ===== ACHIEVEMENTS =====
export const ACHIEVEMENTS: Achievement[] = [
  // Conversation achievements
  {
    id: 'first-chat',
    name: 'First Steps',
    description: 'Start your first conversation',
    icon: 'MessageSquare',
    category: 'conversations',
    rarity: 'common',
    xpReward: 25,
    requirement: 1,
  },
  {
    id: 'chat-10',
    name: 'Getting Started',
    description: 'Have 10 conversations',
    icon: 'MessageCircle',
    category: 'conversations',
    rarity: 'common',
    xpReward: 50,
    requirement: 10,
  },
  {
    id: 'chat-50',
    name: 'Conversationalist',
    description: 'Have 50 conversations',
    icon: 'MessagesSquare',
    category: 'conversations',
    rarity: 'rare',
    xpReward: 150,
    requirement: 50,
  },
  {
    id: 'chat-100',
    name: 'Chatterbox',
    description: 'Have 100 conversations',
    icon: 'MessageSquarePlus',
    category: 'conversations',
    rarity: 'epic',
    xpReward: 300,
    requirement: 100,
  },
  // Streak achievements
  {
    id: 'streak-3',
    name: 'Consistent',
    description: 'Maintain a 3-day streak',
    icon: 'Flame',
    category: 'streaks',
    rarity: 'common',
    xpReward: 50,
    requirement: 3,
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: 'Zap',
    category: 'streaks',
    rarity: 'rare',
    xpReward: 150,
    requirement: 7,
  },
  {
    id: 'streak-30',
    name: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    icon: 'Trophy',
    category: 'streaks',
    rarity: 'epic',
    xpReward: 500,
    requirement: 30,
  },
  {
    id: 'streak-100',
    name: 'Century Club',
    description: 'Maintain a 100-day streak',
    icon: 'Crown',
    category: 'streaks',
    rarity: 'legendary',
    xpReward: 2000,
    requirement: 100,
  },
  // Exploration achievements
  {
    id: 'try-all-models',
    name: 'Model Explorer',
    description: 'Use all three AI models',
    icon: 'Compass',
    category: 'exploration',
    rarity: 'common',
    xpReward: 75,
    requirement: 3,
  },
  {
    id: 'first-project',
    name: 'Organizer',
    description: 'Create your first project',
    icon: 'FolderPlus',
    category: 'exploration',
    rarity: 'common',
    xpReward: 50,
    requirement: 1,
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Chat after midnight',
    icon: 'Moon',
    category: 'exploration',
    rarity: 'rare',
    xpReward: 100,
    requirement: 1,
  },
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Chat before 6 AM',
    icon: 'Sun',
    category: 'exploration',
    rarity: 'rare',
    xpReward: 100,
    requirement: 1,
  },
  // Mastery achievements
  {
    id: 'level-5',
    name: 'Rising Star',
    description: 'Reach level 5',
    icon: 'Star',
    category: 'mastery',
    rarity: 'rare',
    xpReward: 200,
    requirement: 5,
  },
  {
    id: 'level-10',
    name: 'Transcendent',
    description: 'Reach level 10',
    icon: 'Sparkles',
    category: 'mastery',
    rarity: 'legendary',
    xpReward: 1000,
    requirement: 10,
  },
  // Special achievements
  {
    id: 'code-wizard',
    name: 'Code Wizard',
    description: 'Have 25 coding conversations',
    icon: 'Code2',
    category: 'special',
    rarity: 'epic',
    xpReward: 250,
    requirement: 25,
  },
  {
    id: 'wordsmith',
    name: 'Wordsmith',
    description: 'Have 25 writing conversations',
    icon: 'PenLine',
    category: 'special',
    rarity: 'epic',
    xpReward: 250,
    requirement: 25,
  },
];

// ===== XP REWARDS =====
export const XP_REWARDS = {
  MESSAGE_SENT: 5,
  CONVERSATION_COMPLETE: 10,
  DAILY_LOGIN: 25,
  STREAK_BONUS: 10, // per day in streak
  ACHIEVEMENT_MULTIPLIER: 1,
  QUICK_ACTION_USED: 5,
};

// ===== KEYBOARD SHORTCUTS =====
export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { key: '⌘/Ctrl + N', label: 'New chat', action: 'newChat', category: 'chat' },
  { key: '⌘/Ctrl + K', label: 'Command palette', action: 'commandPalette', category: 'general' },
  { key: '⌘/Ctrl + /', label: 'Toggle sidebar', action: 'toggleSidebar', category: 'navigation' },
  { key: '⌘/Ctrl + ,', label: 'Settings', action: 'settings', category: 'navigation' },
  { key: 'Enter', label: 'Send message', action: 'send', category: 'chat' },
  { key: 'Shift + Enter', label: 'New line', action: 'newLine', category: 'chat' },
  { key: 'Escape', label: 'Close modal', action: 'closeModal', category: 'general' },
  { key: '↑', label: 'Previous message', action: 'prevMessage', category: 'chat' },
];

// ===== NAVIGATION =====
export const SIDEBAR_NAV = [
  { id: 'home', label: 'Home', icon: 'Home', href: '/' },
  { id: 'chats', label: 'Chats', icon: 'MessageSquare', href: '/chats' },
  { id: 'projects', label: 'Projects', icon: 'FolderKanban', href: '/projects' },
  { id: 'achievements', label: 'Achievements', icon: 'Trophy', href: '/achievements' },
  { id: 'settings', label: 'Settings', icon: 'Settings', href: '/settings' },
];

// ===== DEFAULT USER =====
export const DEFAULT_USER = {
  id: 'user-1',
  name: 'User',
  email: 'user@araviel.ai',
  plan: 'free' as const,
  xp: 0,
  level: 1,
  streak: 0,
  totalMessages: 0,
  achievements: [],
  preferences: {
    mood: 'focused' as const,
    tone: 'friendly' as const,
    interests: ['technology', 'productivity'],
    defaultModel: 'auto' as const,
    responseLength: 'balanced' as const,
    autoRouting: true,
    soundEffects: true,
    animations: true,
  },
  createdAt: new Date(),
  lastActiveAt: new Date(),
};

// ===== DEFAULT PROJECTS =====
export const DEFAULT_PROJECTS = [
  { id: 'proj-1', name: 'Work', icon: 'Briefcase', color: '#6366f1' },
  { id: 'proj-2', name: 'Personal', icon: 'User', color: '#10b981' },
  { id: 'proj-3', name: 'Learning', icon: 'GraduationCap', color: '#f59e0b' },
];

// ===== GREETINGS =====
export const GREETINGS = {
  morning: ['Good morning', 'Rise and shine', 'Hello, early bird'],
  afternoon: ['Good afternoon', 'Hello there', 'Hope you\'re having a great day'],
  evening: ['Good evening', 'Hello', 'Winding down?'],
  night: ['Working late?', 'Hello, night owl', 'Burning the midnight oil?'],
};

export const getGreeting = (): string => {
  const hour = new Date().getHours();
  let greetings: string[];

  if (hour >= 5 && hour < 12) {
    greetings = GREETINGS.morning;
  } else if (hour >= 12 && hour < 17) {
    greetings = GREETINGS.afternoon;
  } else if (hour >= 17 && hour < 21) {
    greetings = GREETINGS.evening;
  } else {
    greetings = GREETINGS.night;
  }

  return greetings[Math.floor(Math.random() * greetings.length)];
};

// ===== API ENDPOINTS =====
export const API_ENDPOINTS = {
  CHAT: '/api/chat',
  CONVERSATIONS: '/api/conversations',
  USER: '/api/user',
  ACHIEVEMENTS: '/api/achievements',
};

// ===== STORAGE KEYS =====
export const STORAGE_KEYS = {
  THEME: 'araviel-theme',
  USER: 'araviel-user',
  CONVERSATIONS: 'araviel-conversations',
  PROJECTS: 'araviel-projects',
};
