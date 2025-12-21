import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Theme, ModalType, ModalData } from '../types';

interface ActiveModal {
  type: ModalType;
  data?: ModalData;
}

interface UIState {
  theme: Theme;
  sidebarOpen: boolean;
  sidebarMobileOpen: boolean;
  activeDropdown: string | null;
  activeModal: ActiveModal | null;
  isStreaming: boolean;
  scrolledDown: boolean;
}

const getInitialTheme = (): Theme => {
  const stored = localStorage.getItem('araviel_settings');
  if (stored) {
    try {
      const settings = JSON.parse(stored);
      return settings.theme || 'dark';
    } catch {
      return 'dark';
    }
  }
  return 'dark';
};

const getInitialSidebarState = (): boolean => {
  const stored = localStorage.getItem('araviel_settings');
  if (stored) {
    try {
      const settings = JSON.parse(stored);
      return settings.sidebarOpen !== false;
    } catch {
      return true;
    }
  }
  return true;
};

const initialState: UIState = {
  theme: getInitialTheme(),
  sidebarOpen: getInitialSidebarState(),
  sidebarMobileOpen: false,
  activeDropdown: null,
  activeModal: null,
  isStreaming: false,
  scrolledDown: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
      // Persist to localStorage
      const stored = localStorage.getItem('araviel_settings');
      const settings = stored ? JSON.parse(stored) : {};
      settings.theme = action.payload;
      localStorage.setItem('araviel_settings', JSON.stringify(settings));
    },

    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
      // Persist to localStorage
      const stored = localStorage.getItem('araviel_settings');
      const settings = stored ? JSON.parse(stored) : {};
      settings.sidebarOpen = state.sidebarOpen;
      localStorage.setItem('araviel_settings', JSON.stringify(settings));
    },

    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },

    toggleMobileSidebar: (state) => {
      state.sidebarMobileOpen = !state.sidebarMobileOpen;
    },

    closeMobileSidebar: (state) => {
      state.sidebarMobileOpen = false;
    },

    setActiveDropdown: (state, action: PayloadAction<string | null>) => {
      state.activeDropdown = action.payload;
    },

    closeAllDropdowns: (state) => {
      state.activeDropdown = null;
    },

    openModal: (state, action: PayloadAction<{ type: ModalType; data?: ModalData }>) => {
      state.activeModal = {
        type: action.payload.type,
        data: action.payload.data,
      };
    },

    closeModal: (state) => {
      state.activeModal = null;
    },

    setStreaming: (state, action: PayloadAction<boolean>) => {
      state.isStreaming = action.payload;
    },

    setScrolledDown: (state, action: PayloadAction<boolean>) => {
      state.scrolledDown = action.payload;
    },
  },
});

export const {
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  toggleMobileSidebar,
  closeMobileSidebar,
  setActiveDropdown,
  closeAllDropdowns,
  openModal,
  closeModal,
  setStreaming,
  setScrolledDown,
} = uiSlice.actions;

export default uiSlice.reducer;
