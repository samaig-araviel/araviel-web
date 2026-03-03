import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './slices/themeSlice';
import sidebarReducer from './slices/sidebarSlice';
import chatReducer from './slices/chatSlice';
import analyticsReducer from './slices/analyticsSlice';

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    sidebar: sidebarReducer,
    chat: chatReducer,
    analytics: analyticsReducer,
  },
});
