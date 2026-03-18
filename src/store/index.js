import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './slices/themeSlice';
import sidebarReducer from './slices/sidebarSlice';
import chatReducer from './slices/chatSlice';
import analyticsReducer from './slices/analyticsSlice';
import projectsReducer from './slices/projectsSlice';
import subscriptionReducer from './slices/subscriptionSlice';

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    sidebar: sidebarReducer,
    chat: chatReducer,
    analytics: analyticsReducer,
    projects: projectsReducer,
    subscription: subscriptionReducer,
  },
});
