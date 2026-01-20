// ============================================
// ARAVIEL TYPE DEFINITIONS
// ============================================

// ===== AI MODELS =====
export type Model = 'claude' | 'gpt4' | 'gemini';
export type ModelSelection = Model | 'auto';

export interface ModelInfo {
  id: Model;
  name: string;
  provider: string;
  description: string;
  strengths: string[];
  color: string;
  icon: string;
}

// ===== USER & AUTHENTICATION =====
export type Plan = 'free' | 'pro' | 'enterprise';
export type Mood = 'focused' | 'creative' | 'casual' | 'exploratory';
export type Tone = 'friendly' | 'professional' | 'concise' | 'detailed';

export interface UserPreferences {
  mood: Mood;
  tone: Tone;
  interests: string[];
  defaultModel: ModelSelection;
  responseLength: 'concise' | 'balanced' | 'detailed';
  autoRouting: boolean;
  soundEffects: boolean;
  animations: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: Plan;
  xp: number;
  level: number;
  streak: number;
  totalMessages: number;
  achievements: string[];
  preferences: UserPreferences;
  createdAt: Date;
  lastActiveAt: Date;
}

// ===== GAMIFICATION =====
export type AchievementCategory = 'conversations' | 'streaks' | 'exploration' | 'mastery' | 'special';
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  xpReward: number;
  requirement: number;
  progress?: number;
  unlockedAt?: Date;
}

export interface Level {
  level: number;
  name: string;
  minXp: number;
  maxXp: number;
  badge: string;
  perks: string[];
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  requirement: number;
  progress: number;
  expiresAt: Date;
}

// ===== PROJECTS =====
export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  conversationIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ===== MESSAGES & CONVERSATIONS =====
export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageStatus = 'sending' | 'sent' | 'error';

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'file' | 'code';
  size: number;
  url?: string;
  preview?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  model?: Model;
  routingReason?: string;
  status?: MessageStatus;
  attachments?: Attachment[];
  reactions?: string[];
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model?: ModelSelection;
  projectId?: string;
  isPinned?: boolean;
  isArchived?: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationSummary {
  id: string;
  title: string;
  preview: string;
  messageCount: number;
  lastModel?: Model;
  projectId?: string;
  isPinned?: boolean;
  updatedAt: Date;
}

// ===== QUICK ACTIONS =====
export interface QuickAction {
  id: string;
  icon: string;
  label: string;
  description: string;
  promptStarter: string;
  category: 'create' | 'analyze' | 'learn' | 'code';
  gradient?: string;
}

// ===== DAILY INSIGHTS =====
export type InsightType = 'tip' | 'stat' | 'feature' | 'quote' | 'challenge';

export interface DailyInsight {
  id: string;
  type: InsightType;
  title: string;
  content: string;
  action?: {
    label: string;
    href?: string;
    onClick?: string;
  };
}

// ===== UI STATE =====
export type Theme = 'light' | 'dark' | 'system';

export interface UIState {
  theme: Theme;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  activeModal: string | null;
  searchOpen: boolean;
  commandPaletteOpen: boolean;
}

// ===== NOTIFICATIONS =====
export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'achievement';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ===== API TYPES =====
export interface ChatRequest {
  conversationId: string;
  message: string;
  model: ModelSelection;
  attachments?: Attachment[];
  preferences?: Partial<UserPreferences>;
}

export interface ChatResponse {
  id: string;
  model: Model;
  routingReason: string;
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

export interface RoutingDecision {
  model: Model;
  reason: string;
  confidence: number;
  factors: {
    factor: string;
    weight: number;
  }[];
}

// ===== KEYBOARD SHORTCUTS =====
export interface KeyboardShortcut {
  key: string;
  label: string;
  action: string;
  category: 'navigation' | 'chat' | 'general';
}
