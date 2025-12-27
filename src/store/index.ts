import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import chatReducer from './slices/chatSlice';
import projectReducer from './slices/projectSlice';
import uiReducer from './slices/uiSlice';
import userReducer from './slices/userSlice';

// Combine reducers
const rootReducer = combineReducers({
  chat: chatReducer,
  project: projectReducer,
  ui: uiReducer,
  user: userReducer,
});

// Persist configuration
const persistConfig = {
  key: 'araviel',
  version: 1,
  storage,
  whitelist: ['chat', 'project', 'user'], // Don't persist UI state
  blacklist: ['ui'],
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const makeStore = () => {
  return configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }),
    devTools: process.env.NODE_ENV !== 'production',
  });
};

// Store instance for use outside of components
let storeInstance: ReturnType<typeof makeStore> | null = null;

export const getStore = () => {
  if (!storeInstance) {
    storeInstance = makeStore();
  }
  return storeInstance;
};

// Create persistor
export const getPersistor = () => {
  const store = getStore();
  return persistStore(store);
};

// Types
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
