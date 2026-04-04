import { describe, it, expect, beforeEach } from 'vitest';
import sidebarReducer, {
  toggleSidebar,
  setCollapsed,
  setActiveItem,
  selectSidebarCollapsed,
  selectActiveItem,
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

    it('defaults activeItem to home', () => {
      const state = sidebarReducer(undefined, { type: 'unknown' });
      expect(state.activeItem).toBe('home');
    });
  });

  describe('toggleSidebar', () => {
    it('toggles collapsed from true to false', () => {
      const state = sidebarReducer({ collapsed: true, activeItem: 'home' }, toggleSidebar());
      expect(state.collapsed).toBe(false);
    });

    it('toggles collapsed from false to true', () => {
      const state = sidebarReducer({ collapsed: false, activeItem: 'home' }, toggleSidebar());
      expect(state.collapsed).toBe(true);
    });

    it('persists to localStorage', () => {
      sidebarReducer({ collapsed: true, activeItem: 'home' }, toggleSidebar());
      expect(localStorage.setItem).toHaveBeenCalledWith('araviel-sidebar-collapsed', false);
    });
  });

  describe('setCollapsed', () => {
    it('sets collapsed to the given value', () => {
      const state = sidebarReducer({ collapsed: true, activeItem: 'home' }, setCollapsed(false));
      expect(state.collapsed).toBe(false);
    });

    it('persists to localStorage', () => {
      sidebarReducer({ collapsed: true, activeItem: 'home' }, setCollapsed(false));
      expect(localStorage.setItem).toHaveBeenCalledWith('araviel-sidebar-collapsed', false);
    });
  });

  describe('setActiveItem', () => {
    it('sets the active item', () => {
      const state = sidebarReducer(
        { collapsed: true, activeItem: 'home' },
        setActiveItem('settings')
      );
      expect(state.activeItem).toBe('settings');
    });

    it('can set to any string', () => {
      const state = sidebarReducer(
        { collapsed: true, activeItem: 'home' },
        setActiveItem('conversations')
      );
      expect(state.activeItem).toBe('conversations');
    });
  });

  describe('selectors', () => {
    it('selectSidebarCollapsed returns collapsed state', () => {
      expect(selectSidebarCollapsed({ sidebar: { collapsed: true } })).toBe(true);
      expect(selectSidebarCollapsed({ sidebar: { collapsed: false } })).toBe(false);
    });

    it('selectActiveItem returns active item', () => {
      expect(selectActiveItem({ sidebar: { activeItem: 'models' } })).toBe('models');
    });
  });
});
