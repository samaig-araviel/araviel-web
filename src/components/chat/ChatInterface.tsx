'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentChat, selectSidebarOpen } from '@/store/selectors';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { WelcomeScreen } from './WelcomeScreen';

const ChatInterface: React.FC = () => {
  const currentChat = useAppSelector(selectCurrentChat);
  const sidebarOpen = useAppSelector(selectSidebarOpen);
  const hasMessages = currentChat && currentChat.messages.length > 0;

  return (
    <main
      className={cn(
        'flex flex-col h-screen',
        'bg-background-primary',
        'transition-all duration-300',
        sidebarOpen ? 'ml-64' : 'ml-[54px]'
      )}
    >
      {/* Header */}
      <ChatHeader />

      {/* Content Area */}
      {hasMessages ? <MessageList /> : <WelcomeScreen />}

      {/* Input */}
      <MessageInput />
    </main>
  );
};

export { ChatInterface };
