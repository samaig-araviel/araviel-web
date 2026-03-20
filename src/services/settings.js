// Settings service — communicates with /api/settings backend
import { getAuthHeaders } from './authHeaders';

const API_BASE =
  import.meta.env.VITE_ARAVIEL_API_BASE ||
  (import.meta.env.DEV ? '' : 'https://araviel-api.vercel.app');

// Default settings — used when backend has no record yet
export const DEFAULT_SETTINGS = {
  displayName: 'User',
  bio: '',
  preferredLanguage: 'English',
  responseTone: 'default',
  customInstructions: '',
  occupation: '',
  expertise: '',
  fontSize: 'medium',
  answerFont: 'sans-serif',
  compactMode: false,
  sendWithEnter: true,
  showCodeLineNumbers: true,
  defaultModel: 'auto',
  enableReasoning: true,
  showModelInfo: true,
  webSearchDefault: 'auto',
  imageQualityDefault: 'standard',
  enableFollowUps: true,
  saveHistory: true,
  enableAnalytics: true,
  aiDataRetention: false,
  locationMetadata: false,
  notifyNewFeatures: true,
  notifyUsageLimits: true,
  notifySounds: true,
};

// Map camelCase frontend keys to snake_case backend keys
const toSnakeCase = (settings) => {
  const map = {
    displayName: 'display_name',
    bio: 'bio',
    preferredLanguage: 'preferred_language',
    responseTone: 'response_tone',
    customInstructions: 'custom_instructions',
    occupation: 'occupation',
    expertise: 'expertise',
    fontSize: 'font_size',
    answerFont: 'answer_font',
    compactMode: 'compact_mode',
    sendWithEnter: 'send_with_enter',
    showCodeLineNumbers: 'show_code_line_numbers',
    defaultModel: 'default_model',
    enableReasoning: 'enable_reasoning',
    showModelInfo: 'show_model_info',
    webSearchDefault: 'web_search_default',
    imageQualityDefault: 'image_quality_default',
    enableFollowUps: 'enable_follow_ups',
    saveHistory: 'save_history',
    enableAnalytics: 'enable_analytics',
    aiDataRetention: 'ai_data_retention',
    locationMetadata: 'location_metadata',
    notifyNewFeatures: 'notify_new_features',
    notifyUsageLimits: 'notify_usage_limits',
    notifySounds: 'notify_sounds',
  };
  const result = {};
  for (const [key, value] of Object.entries(settings)) {
    const snakeKey = map[key];
    if (snakeKey) result[snakeKey] = value;
  }
  return result;
};

// Map snake_case backend keys to camelCase frontend keys
const toCamelCase = (settings) => {
  const map = {
    display_name: 'displayName',
    bio: 'bio',
    preferred_language: 'preferredLanguage',
    response_tone: 'responseTone',
    custom_instructions: 'customInstructions',
    occupation: 'occupation',
    expertise: 'expertise',
    font_size: 'fontSize',
    answer_font: 'answerFont',
    compact_mode: 'compactMode',
    send_with_enter: 'sendWithEnter',
    show_code_line_numbers: 'showCodeLineNumbers',
    default_model: 'defaultModel',
    enable_reasoning: 'enableReasoning',
    show_model_info: 'showModelInfo',
    web_search_default: 'webSearchDefault',
    image_quality_default: 'imageQualityDefault',
    enable_follow_ups: 'enableFollowUps',
    save_history: 'saveHistory',
    enable_analytics: 'enableAnalytics',
    ai_data_retention: 'aiDataRetention',
    location_metadata: 'locationMetadata',
    notify_new_features: 'notifyNewFeatures',
    notify_usage_limits: 'notifyUsageLimits',
    notify_sounds: 'notifySounds',
  };
  const result = {};
  for (const [key, value] of Object.entries(settings)) {
    const camelKey = map[key];
    if (camelKey) result[camelKey] = value;
  }
  return result;
};

/**
 * Fetch user settings from the backend.
 * Falls back to localStorage then defaults if backend is unavailable.
 */
export async function fetchSettings() {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/api/settings`, { headers });
    if (!res.ok) throw new Error(`${res.status}`);
    const data = await res.json();
    const settings = { ...DEFAULT_SETTINGS, ...toCamelCase(data.settings || {}) };
    // Cache to localStorage as fallback
    localStorage.setItem('araviel-settings', JSON.stringify(settings));
    return settings;
  } catch {
    // Fallback to localStorage
    try {
      const cached = JSON.parse(localStorage.getItem('araviel-settings') || '{}');
      return { ...DEFAULT_SETTINGS, ...cached };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }
}

/**
 * Save user settings to the backend and localStorage.
 */
export async function saveSettings(settings) {
  // Always save to localStorage immediately
  localStorage.setItem('araviel-settings', JSON.stringify(settings));

  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/api/settings`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        settings: toSnakeCase(settings),
      }),
    });
    if (!res.ok) throw new Error(`${res.status}`);
    return await res.json();
  } catch {
    // Silently fail — localStorage has the data
    return { settings, source: 'local' };
  }
}
