import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import type {
  UIState,
  ThemeMode,
  ModalState,
  DropdownState,
  ToastMessage,
} from '@/types';

const initialState: UIState = {
  theme: 'dark',
  sidebarOpen: true,
  projectsDropdownOpen: false,
  recentsDropdownOpen: true,
  archivedDropdownOpen: false,
  activeModal: { type: null },
  activeDropdown: { type: null },
  toasts: [],
  isMobile: false,
  scrolledFromBottom: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Theme
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.theme = action.payload;
    },

    // Sidebar
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },

    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },

    // Projects dropdown
    toggleProjectsDropdown: (state) => {
      state.projectsDropdownOpen = !state.projectsDropdownOpen;
    },

    setProjectsDropdownOpen: (state, action: PayloadAction<boolean>) => {
      state.projectsDropdownOpen = action.payload;
    },

    // Recents dropdown
    toggleRecentsDropdown: (state) => {
      state.recentsDropdownOpen = !state.recentsDropdownOpen;
    },

    setRecentsDropdownOpen: (state, action: PayloadAction<boolean>) => {
      state.recentsDropdownOpen = action.payload;
    },

    // Archived dropdown
    toggleArchivedDropdown: (state) => {
      state.archivedDropdownOpen = !state.archivedDropdownOpen;
    },

    setArchivedDropdownOpen: (state, action: PayloadAction<boolean>) => {
      state.archivedDropdownOpen = action.payload;
    },

    // Modal
    openModal: (state, action: PayloadAction<ModalState>) => {
      state.activeModal = action.payload;
      // Close any open dropdown when opening modal
      state.activeDropdown = { type: null };
    },

    closeModal: (state) => {
      state.activeModal = { type: null };
    },

    // Dropdown
    openDropdown: (state, action: PayloadAction<DropdownState>) => {
      state.activeDropdown = action.payload;
    },

    closeDropdown: (state) => {
      state.activeDropdown = { type: null };
    },

    closeAllDropdowns: (state) => {
      state.activeDropdown = { type: null };
    },

    // Toast notifications
    addToast: (
      state,
      action: PayloadAction<Omit<ToastMessage, 'id'>>
    ) => {
      const toast: ToastMessage = {
        ...action.payload,
        id: uuidv4(),
      };
      state.toasts.push(toast);
    },

    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },

    clearToasts: (state) => {
      state.toasts = [];
    },

    // Mobile
    setIsMobile: (state, action: PayloadAction<boolean>) => {
      state.isMobile = action.payload;
      // Auto-close sidebar on mobile
      if (action.payload && state.sidebarOpen) {
        state.sidebarOpen = false;
      }
    },

    // Scroll position
    setScrolledFromBottom: (state, action: PayloadAction<boolean>) => {
      state.scrolledFromBottom = action.payload;
    },
  },
});

export const {
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  toggleProjectsDropdown,
  setProjectsDropdownOpen,
  toggleRecentsDropdown,
  setRecentsDropdownOpen,
  toggleArchivedDropdown,
  setArchivedDropdownOpen,
  openModal,
  closeModal,
  openDropdown,
  closeDropdown,
  closeAllDropdowns,
  addToast,
  removeToast,
  clearToasts,
  setIsMobile,
  setScrolledFromBottom,
} = uiSlice.actions;

export default uiSlice.reducer;
