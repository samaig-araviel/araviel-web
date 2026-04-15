import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { store } from './store';
import { ToastProvider } from './components/Toast/Toast';
import AppErrorBoundary from './components/ErrorBoundary/AppErrorBoundary';
import { logger } from './lib/logger';
import router from './router';
import './index.css';

// Route any uncaught promise rejections and window errors through the
// structured logger so they show up in Vercel logs. The user only sees
// a toast/fallback; the full diagnostic lives server-side.
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', event.reason, { scope: 'window' });
  });
  window.addEventListener('error', (event) => {
    logger.error('Uncaught error', event.error || new Error(event.message), {
      scope: 'window',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <Provider store={store}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </Provider>
    </AppErrorBoundary>
  </React.StrictMode>
);
