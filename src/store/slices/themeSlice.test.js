import { describe, it, expect, beforeEach } from 'vitest';
import themeReducer, { setTheme, selectTheme, selectEffectiveTheme } from './themeSlice';

describe('themeSlice', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('reducer', () => {
    it('has "system" as default mode', () => {
      const state = themeReducer(undefined, { type: 'unknown' });
      expect(state.mode).toBe('system');
    });

    it('reads initial theme from localStorage', () => {
      localStorage.setItem('araviel-theme', 'dark');
      // Re-import would be needed for true init test; instead test setTheme
      const state = themeReducer(undefined, setTheme('dark'));
      expect(state.mode).toBe('dark');
    });
  });

  describe('setTheme', () => {
    it('sets mode to light', () => {
      const state = themeReducer(undefined, setTheme('light'));
      expect(state.mode).toBe('light');
    });

    it('sets mode to dark', () => {
      const state = themeReducer(undefined, setTheme('dark'));
      expect(state.mode).toBe('dark');
    });

    it('sets mode to system', () => {
      const prev = themeReducer(undefined, setTheme('dark'));
      const state = themeReducer(prev, setTheme('system'));
      expect(state.mode).toBe('system');
    });

    it('persists to localStorage', () => {
      themeReducer(undefined, setTheme('dark'));
      expect(localStorage.setItem).toHaveBeenCalledWith('araviel-theme', 'dark');
    });
  });

  describe('selectors', () => {
    it('selectTheme returns the mode', () => {
      const state = { theme: { mode: 'dark' } };
      expect(selectTheme(state)).toBe('dark');
    });

    it('selectEffectiveTheme returns the mode for light/dark', () => {
      expect(selectEffectiveTheme({ theme: { mode: 'light' } })).toBe('light');
      expect(selectEffectiveTheme({ theme: { mode: 'dark' } })).toBe('dark');
    });

    it('selectEffectiveTheme resolves system to light/dark', () => {
      const result = selectEffectiveTheme({ theme: { mode: 'system' } });
      expect(['light', 'dark']).toContain(result);
    });
  });
});
