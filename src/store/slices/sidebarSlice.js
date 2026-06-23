import { createSlice } from '@reduxjs/toolkit';

const COLLAPSED_KEY = 'araviel-sidebar-collapsed';
const VIEW_KEY = 'araviel-sidebar-view';
const VALID_VIEWS = new Set(['recents', 'archived']);

const getInitialCollapsed = () => {
  if (typeof window !== 'undefined' && window.innerWidth <= 768) return true;
  const saved = localStorage.getItem(COLLAPSED_KEY);
  if (saved === null) return true; // Default to collapsed
  return saved === 'true';
};

const getInitialView = () => {
  const saved = localStorage.getItem(VIEW_KEY);
  return saved && VALID_VIEWS.has(saved) ? saved : 'recents';
};

const initialState = {
  collapsed: getInitialCollapsed(),
  view: getInitialView(),
};

const sidebarSlice = createSlice({
  name: 'sidebar',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.collapsed = !state.collapsed;
      localStorage.setItem(COLLAPSED_KEY, state.collapsed);
    },
    setCollapsed: (state, action) => {
      state.collapsed = action.payload;
      localStorage.setItem(COLLAPSED_KEY, action.payload);
    },
    setView: (state, action) => {
      if (!VALID_VIEWS.has(action.payload)) return;
      state.view = action.payload;
      localStorage.setItem(VIEW_KEY, action.payload);
    },
  },
});

export const { toggleSidebar, setCollapsed, setView } = sidebarSlice.actions;

export const selectSidebarCollapsed = (state) => state.sidebar.collapsed;
export const selectSidebarView = (state) => state.sidebar.view;

export default sidebarSlice.reducer;
