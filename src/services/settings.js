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
  answerFont: 'system',
  sendWithEnter: true,
  defaultModel: 'auto',
  enableReasoning: false,
  webSearchDefault: 'auto',
  imageQualityDefault: 'standard',
  enableFollowUps: true,
  enableAnalytics: true,
  locationMetadata: false,
  notifyNewFeatures: true,
  notifyUsageLimits: true,
  usageLimitThresholds: [20, 10, 5],
  avatarUrl: '',
  fullName: '',
  phone: '',
  website: '',
  location: '',
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
    answerFont: 'answer_font',
    sendWithEnter: 'send_with_enter',
    defaultModel: 'default_model',
    enableReasoning: 'enable_reasoning',
    webSearchDefault: 'web_search_default',
    imageQualityDefault: 'image_quality_default',
    enableFollowUps: 'enable_follow_ups',
    enableAnalytics: 'enable_analytics',
    locationMetadata: 'location_metadata',
    notifyNewFeatures: 'notify_new_features',
    notifyUsageLimits: 'notify_usage_limits',
    usageLimitThresholds: 'usage_limit_thresholds',
    avatarUrl: 'avatar_url',
    fullName: 'full_name',
    phone: 'phone',
    website: 'website',
    location: 'location',
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
    answer_font: 'answerFont',
    send_with_enter: 'sendWithEnter',
    default_model: 'defaultModel',
    enable_reasoning: 'enableReasoning',
    web_search_default: 'webSearchDefault',
    image_quality_default: 'imageQualityDefault',
    enable_follow_ups: 'enableFollowUps',
    enable_analytics: 'enableAnalytics',
    location_metadata: 'locationMetadata',
    notify_new_features: 'notifyNewFeatures',
    notify_usage_limits: 'notifyUsageLimits',
    usage_limit_thresholds: 'usageLimitThresholds',
    avatar_url: 'avatarUrl',
    full_name: 'fullName',
    phone: 'phone',
    website: 'website',
    location: 'location',
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
 * Returns the settings object directly for backward compat. The response
 * may also include a `subscription` summary (tier, status, periodEnd…) —
 * exposed via the second arg as a callback so callers that care can react
 * without changing the return shape.
 * Falls back to localStorage then defaults if backend is unavailable.
 */
export async function fetchSettings(onSubscription) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/api/settings`, { headers });
    if (!res.ok) throw new Error(`${res.status}`);
    const data = await res.json();
    const camelSettings = toCamelCase(data.settings || {});
    // Filter out null/undefined so DB nulls don't override defaults
    const cleanSettings = Object.fromEntries(
      Object.entries(camelSettings).filter(([, v]) => v != null)
    );
    const settings = { ...DEFAULT_SETTINGS, ...cleanSettings };
    // Cache to localStorage as fallback
    localStorage.setItem('araviel-settings', JSON.stringify(settings));
    // Notify same-tab consumers (e.g. useUserLocation, useAnswerFont) that the
    // cached settings have changed — the native `storage` event only fires
    // cross-tab, so without this they'd stay stale until the user manually saves.
    window.dispatchEvent(new CustomEvent('araviel-settings-updated'));
    if (data.subscription && typeof onSubscription === 'function') {
      onSubscription(data.subscription);
    }
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

/**
 * Upload a user avatar image.
 * @param {File} file - The image file to upload.
 * @returns {Promise<{ avatarUrl: string }>}
 */
export async function uploadAvatar(file) {
  const dataUri = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/avatar`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ image: dataUri }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Upload failed (${res.status})`);
  }

  return await res.json();
}
