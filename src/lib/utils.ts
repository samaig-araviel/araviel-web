import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx for conditional class names
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format file size from bytes to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) {return '0 Bytes';}
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

/**
 * Format time ago from date
 */
export function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const past = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (seconds < 60) {return 'Just now';}
  if (seconds < 3600) {return `${Math.floor(seconds / 60)}m ago`;}
  if (seconds < 86400) {return `${Math.floor(seconds / 3600)}h ago`;}
  if (seconds < 604800) {return `${Math.floor(seconds / 86400)}d ago`;}

  return past.toLocaleDateString();
}

/**
 * Generate dynamic greeting based on time of day
 */
export function getDynamicGreeting(userName: string = 'there'): string {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  const isWeekend = day === 0 || day === 6;

  const morningGreetings = [
    `Good morning ${userName} ☀`,
    `Rise and shine ${userName} 🌅`,
    `Fresh start ${userName} 🌄`,
    `Morning ${userName} ☕`,
    `New day ${userName} 🌞`,
  ];

  const afternoonGreetings = [
    `Good afternoon ${userName} 👋`,
    `Afternoon ${userName} ☀️`,
    `Hey ${userName} 🌤️`,
    `Great to see you ${userName} ✨`,
    `Productive afternoon ${userName} 👨‍💻`,
  ];

  const eveningGreetings = [
    `Good evening ${userName} 🌆`,
    `Evening ${userName} 🌃`,
    `Night shift ${userName} ✨`,
    `Hey ${userName} 🌙`,
    `Still going ${userName} 🌠`,
  ];

  const lateNightGreetings = [
    `It's late night ${userName} 🌙`,
    `Night owl ${userName} 🦉`,
    `Burning the midnight oil ${userName} ⭐`,
    `Late night session ${userName} 🌌`,
    `Up late ${userName} 💫`,
  ];

  const weekendGreetings = [
    `Happy weekend ${userName} 🎉`,
    `Weekend vibes ${userName} 🌟`,
    `Enjoying the weekend ${userName} 😊`,
    `Weekend ${userName} 🎊`,
  ];

  let greetings: string[];

  if (isWeekend && Math.random() > 0.5) {
    greetings = weekendGreetings;
  } else if (hour >= 5 && hour < 12) {
    greetings = morningGreetings;
  } else if (hour >= 12 && hour < 17) {
    greetings = afternoonGreetings;
  } else if (hour >= 17 && hour < 22) {
    greetings = eveningGreetings;
  } else {
    greetings = lateNightGreetings;
  }

  return greetings[Math.floor(Math.random() * greetings.length)] ?? greetings[0] ?? `Hello ${userName}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {return text;}
  return `${text.substring(0, maxLength - 3)}...`;
}

/**
 * Generate chat title from content
 */
export function generateChatTitle(content: string, maxLength: number = 50): string {
  const trimmed = content.trim();
  return truncateText(trimmed, maxLength);
}

/**
 * Get file icon type based on MIME type
 */
export function getFileIconType(
  mimeType: string
): 'image' | 'pdf' | 'video' | 'audio' | 'document' {
  if (mimeType.startsWith('image/')) {return 'image';}
  if (mimeType.includes('pdf')) {return 'pdf';}
  if (mimeType.includes('video')) {return 'video';}
  if (mimeType.includes('audio')) {return 'audio';}
  return 'document';
}

/**
 * Check if system prefers dark mode
 */
export function systemPrefersDark(): boolean {
  if (typeof window === 'undefined') {return true;}
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Check if element is in viewport
 */
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse and sanitize markdown content
 */
export function parseMarkdown(content: string): string {
  // This will be handled by the markdown component
  // For now, return content as-is
  return content;
}

/**
 * Get user initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
