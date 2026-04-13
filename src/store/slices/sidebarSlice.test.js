import { describe, it, expect, beforeEach } from 'vitest';
import sidebarReducer, {
  toggleSidebar,
  setCollapsed,
  selectSidebarCollapsed,
} from './sidebarSlice';

describe('sidebarSlice', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('initial state', () => {
    it('defaults to collapsed true', () => {
      const state = sidebarReducer(undefined, { type: 'unknown' });
      expect(state.collapsed).toBe(true);
    });
  });

  describe('toggleSidebar', () => {
    it('toggles collapsed from true to false', () => {
      const state = sidebarReducer({ collapsed: true }, toggleSidebar());
      expect(state.collapsed).toBe(false);
    });

    it('toggles collapsed from false to true', () => {
      const state = sidebarReducer({ collapsed: false }, toggleSidebar());
      expect(state.collapsed).toBe(true);
    });

    it('persists to localStorage', () => {
      sidebarReducer({ collapsed: true }, toggleSidebar());
      expect(localStorage.setItem).toHaveBeenCalledWith('araviel-sidebar-collapsed', false);
    });
  });

  describe('setCollapsed', () => {
    it('sets collapsed to the given value', () => {
      const state = sidebarReducer({ collapsed: true }, setCollapsed(false));
      expect(state.collapsed).toBe(false);
    });

    it('persists to localStorage', () => {
      sidebarReducer({ collapsed: true }, setCollapsed(false));
      expect(localStorage.setItem).toHaveBeenCalledWith('araviel-sidebar-collapsed', false);
    });
  });

  describe('selectors', () => {
    it('selectSidebarCollapsed returns collapsed state', () => {
      expect(selectSidebarCollapsed({ sidebar: { collapsed: true } })).toBe(true);
      expect(selectSidebarCollapsed({ sidebar: { collapsed: false } })).toBe(false);
    });
  });
});
