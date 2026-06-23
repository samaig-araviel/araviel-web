import { describe, it, expect, beforeEach } from 'vitest';
import sidebarReducer, {
  toggleSidebar,
  setCollapsed,
  setView,
  selectSidebarCollapsed,
  selectSidebarView,
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

    it('defaults to recents view', () => {
      const state = sidebarReducer(undefined, { type: 'unknown' });
      expect(state.view).toBe('recents');
    });
  });

  describe('toggleSidebar', () => {
    it('toggles collapsed from true to false', () => {
      const state = sidebarReducer({ collapsed: true, view: 'recents' }, toggleSidebar());
      expect(state.collapsed).toBe(false);
    });

    it('toggles collapsed from false to true', () => {
      const state = sidebarReducer({ collapsed: false, view: 'recents' }, toggleSidebar());
      expect(state.collapsed).toBe(true);
    });

    it('persists to localStorage', () => {
      sidebarReducer({ collapsed: true, view: 'recents' }, toggleSidebar());
      expect(localStorage.setItem).toHaveBeenCalledWith('araviel-sidebar-collapsed', false);
    });
  });

  describe('setCollapsed', () => {
    it('sets collapsed to the given value', () => {
      const state = sidebarReducer({ collapsed: true, view: 'recents' }, setCollapsed(false));
      expect(state.collapsed).toBe(false);
    });

    it('persists to localStorage', () => {
      sidebarReducer({ collapsed: true, view: 'recents' }, setCollapsed(false));
      expect(localStorage.setItem).toHaveBeenCalledWith('araviel-sidebar-collapsed', false);
    });
  });

  describe('setView', () => {
    it('switches to archived', () => {
      const state = sidebarReducer({ collapsed: true, view: 'recents' }, setView('archived'));
      expect(state.view).toBe('archived');
    });

    it('switches back to recents', () => {
      const state = sidebarReducer({ collapsed: true, view: 'archived' }, setView('recents'));
      expect(state.view).toBe('recents');
    });

    it('ignores unknown values', () => {
      const state = sidebarReducer({ collapsed: true, view: 'recents' }, setView('bogus'));
      expect(state.view).toBe('recents');
    });

    it('persists to localStorage', () => {
      sidebarReducer({ collapsed: true, view: 'recents' }, setView('archived'));
      expect(localStorage.setItem).toHaveBeenCalledWith('araviel-sidebar-view', 'archived');
    });
  });

  describe('selectors', () => {
    it('selectSidebarCollapsed returns collapsed state', () => {
      expect(selectSidebarCollapsed({ sidebar: { collapsed: true } })).toBe(true);
      expect(selectSidebarCollapsed({ sidebar: { collapsed: false } })).toBe(false);
    });

    it('selectSidebarView returns view state', () => {
      expect(selectSidebarView({ sidebar: { view: 'recents' } })).toBe('recents');
      expect(selectSidebarView({ sidebar: { view: 'archived' } })).toBe('archived');
    });
  });
});
