/**
 * Format a date as a relative time string (e.g., "2m ago", "1h ago", "3d ago")
 */
export function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString();
}

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Generate a dynamic greeting based on time of day
 */
export function getDynamicGreeting(userName: string = ''): string {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  const isWeekend = day === 0 || day === 6;

  const morningGreetings = [
    `Good morning${userName ? ' ' + userName : ''}`,
    `Rise and shine${userName ? ' ' + userName : ''}`,
    `Fresh start${userName ? ' ' + userName : ''}`,
    `Morning${userName ? ' ' + userName : ''}`,
    `New day${userName ? ' ' + userName : ''}`,
  ];

  const afternoonGreetings = [
    `Good afternoon${userName ? ' ' + userName : ''}`,
    `Afternoon${userName ? ' ' + userName : ''}`,
    `Hey${userName ? ' ' + userName : ''}`,
    `Great to see you${userName ? ' ' + userName : ''}`,
  ];

  const eveningGreetings = [
    `Good evening${userName ? ' ' + userName : ''}`,
    `Evening${userName ? ' ' + userName : ''}`,
    `Night shift${userName ? ' ' + userName : ''}`,
    `Hey${userName ? ' ' + userName : ''}`,
  ];

  const lateNightGreetings = [
    `It's late night${userName ? ' ' + userName : ''}`,
    `Night owl${userName ? ' ' + userName : ''}`,
    `Burning the midnight oil${userName ? ' ' + userName : ''}`,
    `Up late${userName ? ' ' + userName : ''}`,
  ];

  const weekendGreetings = [
    `Happy weekend${userName ? ' ' + userName : ''}`,
    `Weekend vibes${userName ? ' ' + userName : ''}`,
    `Enjoying the weekend${userName ? ' ' + userName : ''}`,
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

  return greetings[Math.floor(Math.random() * greetings.length)];
}

/**
 * Get appropriate emoji for time of day
 */
export function getTimeEmoji(): string {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return '☀️';
  if (hour >= 12 && hour < 17) return '🌤️';
  if (hour >= 17 && hour < 20) return '🌆';
  if (hour >= 20 && hour < 22) return '🌙';
  return '🌙';
}
