import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UserState, User, UserSettings, ModelType } from '@/types';
import { DEFAULT_USER, DEFAULT_SETTINGS } from '@/types';

const initialState: UserState = {
  user: DEFAULT_USER,
  settings: DEFAULT_SETTINGS,
  isAuthenticated: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Set user
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = action.payload !== null;
    },

    // Update user
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },

    // Set authentication state
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },

    // Logout
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },

    // Update settings
    updateSettings: (state, action: PayloadAction<Partial<UserSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },

    // Set default model
    setDefaultModel: (state, action: PayloadAction<ModelType>) => {
      state.settings.defaultModel = action.payload;
    },

    // Toggle web search
    toggleWebSearch: (state) => {
      state.settings.enableWebSearch = !state.settings.enableWebSearch;
    },

    // Toggle file attachments
    toggleFileAttachments: (state) => {
      state.settings.enableFileAttachments =
        !state.settings.enableFileAttachments;
    },

    // Set max file size
    setMaxFileSize: (state, action: PayloadAction<number>) => {
      state.settings.maxFileSize = action.payload;
    },

    // Set max attachments
    setMaxAttachments: (state, action: PayloadAction<number>) => {
      state.settings.maxAttachments = action.payload;
    },

    // Load settings from storage
    loadSettings: (state, action: PayloadAction<UserSettings>) => {
      state.settings = action.payload;
    },

    // Load user from storage
    loadUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = action.payload !== null;
    },
  },
});

export const {
  setUser,
  updateUser,
  setAuthenticated,
  logout,
  updateSettings,
  setDefaultModel,
  toggleWebSearch,
  toggleFileAttachments,
  setMaxFileSize,
  setMaxAttachments,
  loadSettings,
  loadUser,
} = userSlice.actions;

export default userSlice.reducer;
