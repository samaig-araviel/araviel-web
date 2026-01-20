// ===== AI MODELS =====
export type Model = 'claude' | 'gpt4' | 'gemini' | 'perplexity';
export type ModelSelection = Model | 'auto';

export interface ModelInfo {
  id: Model;
  name: string;
  description: string;
  color: string;
  icon: string;
}

// ===== USER =====
export type Plan = 'free' | 'navigator' | 'pathfinder' | 'pioneer';
export type Mood = 'focused' | 'creative' | 'casual' | 'exploratory';
export type Tone = 'friendly' | 'professional' | 'concise';

export interface UserPreferences {
  mood: Mood;
  tone: Tone;
  interests: string[];
  defaultModel: ModelSelection;
  responseLength: 'concise' | 'balanced' | 'detailed';
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: Plan;
  preferences: UserPreferences;
  createdAt: Date;
}

// ===== MESSAGES =====
export type MessageRole = 'user' | 'assistant';

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  model?: Model;
  routingReason?: string;
  attachments?: Attachment[];
  timestamp: Date;
}

// ===== CONVERSATIONS =====
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model?: ModelSelection;
  createdAt: Date;
  updatedAt: Date;
}

// ===== QUICK ACTIONS =====
export interface QuickAction {
  id: string;
  icon: string;
  label: string;
  promptStarter: string;
  color?: string;
}

// ===== DAILY INSIGHTS =====
export type InsightType = 'tip' | 'stat' | 'feature' | 'quote';

export interface DailyInsight {
  id: string;
  type: InsightType;
  title: string;
  content: string;
  icon: string;
}

// ===== UI STATE =====
export type Theme = 'light' | 'dark' | 'system';

export interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  activeModal: string | null;
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
}

export interface ConversationListItem {
  id: string;
  title: string;
  updatedAt: Date;
  lastModel?: Model;
  messageCount: number;
}
