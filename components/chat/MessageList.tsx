'use client';

import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import type { Message, User, Model } from '@/types';

interface MessageListProps {
  messages: Message[];
  user?: User;
  isGenerating?: boolean;
  activeModel?: Model;
  onRegenerate?: (messageId: string) => void;
  onTryDifferent?: (messageId: string) => void;
  onFeedback?: (messageId: string, positive: boolean) => void;
  className?: string;
}

export function MessageList({
  messages,
  user,
  isGenerating = false,
  activeModel,
  onRegenerate,
  onTryDifferent,
  onFeedback,
  className,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isGenerating]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex-1 overflow-y-auto px-4 py-6',
        className
      )}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {messages.map((message, index) => (
          <ChatMessage
            key={message.id}
            message={message}
            user={user}
            isLast={index === messages.length - 1 && !isGenerating}
            onRegenerate={() => onRegenerate?.(message.id)}
            onTryDifferent={() => onTryDifferent?.(message.id)}
            onFeedback={(positive) => onFeedback?.(message.id, positive)}
          />
        ))}

        {isGenerating && (
          <TypingIndicator model={activeModel} />
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
