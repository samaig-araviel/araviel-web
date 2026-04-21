/**
 * Read the user's saved settings from localStorage.
 *
 * Several non-React code paths (composer key handling, follow-up gating,
 * usage-limit watchdog) need to read settings without subscribing to the
 * Settings page state. This helper centralises the parsing and the
 * never-throw contract so those call sites stay tiny.
 *
 * On any read failure (malformed JSON, disabled storage) an empty object is
 * returned — callers should merge with their own defaults.
 *
 * @returns {Record<string, unknown>} parsed settings, or {} on any failure.
 */
const SETTINGS_STORAGE_KEY = 'araviel-settings';

export function readLocalSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Read a single boolean setting, returning `fallback` when the key is absent
 * or not strictly a boolean. Using strict equality avoids the classic
 * "feature stayed on because the user set it to the empty string" bug.
 *
 * @param {string} key - camelCase setting name (e.g. 'sendWithEnter').
 * @param {boolean} fallback - value to return when the key is missing.
 * @returns {boolean}
 */
export function readBooleanSetting(key, fallback) {
  const settings = readLocalSettings();
  if (settings[key] === true) return true;
  if (settings[key] === false) return false;
  return fallback;
}
