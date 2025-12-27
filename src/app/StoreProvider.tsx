'use client';

import * as React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/store';

interface StoreProviderProps {
  children: React.ReactNode;
}

/**
 * Redux Store Provider
 * Wraps the application with Redux Provider and PersistGate
 */
export function StoreProvider({ children }: StoreProviderProps) {
  return (
    <Provider store={store}>
      <PersistGate
        loading={
          <div className="flex items-center justify-center min-h-screen bg-background-primary">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-primary/20 to-accent-hover/10 flex items-center justify-center animate-pulse">
                <span className="text-2xl">✨</span>
              </div>
              <p className="text-sm text-text-secondary">Loading...</p>
            </div>
          </div>
        }
        persistor={persistor}
      >
        {children}
      </PersistGate>
    </Provider>
  );
}
