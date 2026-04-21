import { useEffect } from 'react';
import { readLocalSettings } from '../lib/localSettings';

/**
 * Apply the user's "Answer font style" preference as `data-answer-font` on
 * <html>, which resolves `--answer-font-family` via CSS. The setting lives in
 * localStorage (kept in sync by the Settings page's save flow) and is listened
 * for cross-tab via the native `storage` event and within-tab via the
 * `araviel-settings-updated` custom event dispatched from Settings on save.
 */
const VALID_FONTS = new Set(['system', 'sans-serif', 'serif', 'mono']);
const DEFAULT_FONT = 'system';
const ATTR_NAME = 'data-answer-font';
const STORAGE_KEY = 'araviel-settings';
const UPDATE_EVENT = 'araviel-settings-updated';

function resolveAnswerFont() {
  const settings = readLocalSettings();
  const value = settings?.answerFont;
  return VALID_FONTS.has(value) ? value : DEFAULT_FONT;
}

function applyAnswerFont(value) {
  const root = document.documentElement;
  if (value === DEFAULT_FONT) {
    root.removeAttribute(ATTR_NAME);
  } else {
    root.setAttribute(ATTR_NAME, value);
  }
}

export default function useAnswerFont() {
  useEffect(() => {
    applyAnswerFont(resolveAnswerFont());

    const syncFromStorage = () => applyAnswerFont(resolveAnswerFont());
    const handleStorage = (event) => {
      if (event.key === STORAGE_KEY) syncFromStorage();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(UPDATE_EVENT, syncFromStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(UPDATE_EVENT, syncFromStorage);
    };
  }, []);
}
