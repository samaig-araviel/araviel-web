'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/sidebar';
import { ChatInterface } from '@/components/chat';
import { ModalManager } from './ModalManager';
import { ToastContainer } from '@/components/ui';

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background-primary">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Chat Interface */}
      <ChatInterface />

      {/* Global Modal Manager */}
      <ModalManager />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export { MainLayout };
