import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LEVELS, ROUTING_KEYWORDS } from './constants';
import type { Model, ModelSelection } from '@/types';

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get greeting based on time of day
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Hey there';
}

/**
 * Format relative time (e.g., "2 hours ago", "Yesterday")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Truncate text to a maximum length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Group items by a key function
 */
export function groupBy<T>(
  items: T[],
  keyFn: (item: T) => string
): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

/**
 * Group conversations by date category
 */
export function groupConversationsByDate<T extends { updatedAt: Date }>(
  conversations: T[]
): { today: T[]; yesterday: T[]; previous7Days: T[]; older: T[] } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const week = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  return {
    today: conversations.filter((c) => c.updatedAt >= today),
    yesterday: conversations.filter(
      (c) => c.updatedAt >= yesterday && c.updatedAt < today
    ),
    previous7Days: conversations.filter(
      (c) => c.updatedAt >= week && c.updatedAt < yesterday
    ),
    older: conversations.filter((c) => c.updatedAt < week),
  };
}

/**
 * Generate auto title from message content
 */
export function generateConversationTitle(content: string): string {
  const cleaned = content
    .replace(/[#*`_~\[\]()]/g, '')
    .trim()
    .split('\n')[0];
  return truncate(cleaned, 40) || 'New conversation';
}

/**
 * Sleep function for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================
// GAMIFICATION UTILITIES
// ============================================

/**
 * Calculate user level from XP
 */
export function calculateLevel(xp: number): number {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) {
      return LEVELS[i].level;
    }
  }
  return 1;
}

/**
 * Get XP progress within current level
 */
export function getLevelProgress(xp: number): { progress: number; current: number; max: number } {
  const level = calculateLevel(xp);
  const currentLevel = LEVELS.find((l) => l.level === level);

  if (!currentLevel) return { progress: 0, current: 0, max: 100 };

  const current = xp - currentLevel.minXp;
  const max = currentLevel.maxXp - currentLevel.minXp;
  const progress = Math.min((current / max) * 100, 100);

  return { progress, current, max };
}

/**
 * Format XP number with commas
 */
export function formatXP(xp: number): string {
  return xp.toLocaleString();
}

// ============================================
// AUTO-ROUTING UTILITIES
// ============================================

interface RoutingResult {
  model: Model;
  reason: string;
  confidence: number;
}

/**
 * Route message to the best AI model based on content analysis
 */
export function routeMessage(content: string, selectedModel: ModelSelection): RoutingResult {
  // If user explicitly selected a model, use it
  if (selectedModel !== 'auto') {
    const reasons: Record<Model, string> = {
      claude: 'Selected Claude for writing & analysis',
      gpt4: 'Selected GPT-4 for code & reasoning',
      gemini: 'Selected Gemini for research & facts',
    };
    return {
      model: selectedModel,
      reason: reasons[selectedModel],
      confidence: 1.0,
    };
  }

  const lowerContent = content.toLowerCase();
  const scores: Record<Model, number> = { claude: 0, gpt4: 0, gemini: 0 };

  // Score based on keywords
  for (const [model, keywords] of Object.entries(ROUTING_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        scores[model as Model] += 1;
      }
    }
  }

  // Check for code blocks (strong indicator for GPT-4)
  if (content.includes('```') || content.includes('function') || content.includes('const ')) {
    scores.gpt4 += 3;
  }

  // Check for question patterns (indicator for research/Gemini)
  if (/^(what|who|when|where|how|why|which)\s/i.test(content)) {
    scores.gemini += 1;
  }

  // Check for creative/writing patterns (indicator for Claude)
  if (/^(write|help me write|create|draft|compose)/i.test(content)) {
    scores.claude += 2;
  }

  // Find highest scoring model
  let bestModel: Model = 'claude'; // Default to Claude
  let bestScore = scores.claude;

  for (const [model, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestModel = model as Model;
    }
  }

  // Calculate confidence based on score difference
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? bestScore / totalScore : 0.33;

  // Generate routing reason
  const reasons: Record<Model, string> = {
    claude: 'Routed to Claude for thoughtful analysis',
    gpt4: 'Routed to GPT-4 for code & technical tasks',
    gemini: 'Routed to Gemini for research & facts',
  };

  return {
    model: bestModel,
    reason: reasons[bestModel],
    confidence: Math.min(confidence, 1.0),
  };
}

// ============================================
// STORAGE UTILITIES
// ============================================

/**
 * Local storage helpers with error handling
 */
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full or unavailable
    }
  },
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Storage unavailable
    }
  },
};

// ============================================
// DATE UTILITIES
// ============================================

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if date is yesterday
 */
export function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Check if string is valid email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if string is empty or whitespace only
 */
export function isEmpty(str: string): boolean {
  return !str || str.trim().length === 0;
}
