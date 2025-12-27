'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectCurrentChatMessages,
  selectIsStreaming,
  selectStreamingContent,
} from '@/store/selectors';
import { setFeedback } from '@/store/slices/chatSlice';
import { addToast } from '@/store/slices/uiSlice';
import { MessageItem } from './MessageItem';
import type { FeedbackType } from '@/types';

interface MessageListProps {
  scrollRef?: React.RefObject<HTMLDivElement>;
}

const MessageList: React.FC<MessageListProps> = ({ scrollRef }) => {
  const dispatch = useAppDispatch();
  const messages = useAppSelector(selectCurrentChatMessages);
  const isStreaming = useAppSelector(selectIsStreaming);
  const streamingContent = useAppSelector(selectStreamingContent);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent]);

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      dispatch(
        addToast({
          type: 'success',
          message: 'Copied to clipboard',
        })
      );
    } catch {
      dispatch(
        addToast({
          type: 'error',
          message: 'Failed to copy',
        })
      );
    }
  };

  const handleFeedback = (messageId: string, feedback: FeedbackType) => {
    dispatch(setFeedback({ messageId, feedback }));
    dispatch(
      addToast({
        type: 'success',
        message: 'Thanks for your feedback!',
      })
    );
  };

  const handleRegenerate = (messageId: string) => {
    // Find the query message before this response and regenerate
    dispatch(
      addToast({
        type: 'info',
        message: 'Regenerating response...',
      })
    );
    // TODO: Implement regeneration logic
  };

  if (messages.length === 0) {
    return (
      <div
        ref={scrollRef}
        className={cn(
          'flex-1 flex flex-col items-center justify-center',
          'px-4 py-8'
        )}
      >
        <div className="text-center max-w-md">
          <div
            className={cn(
              'w-16 h-16 mx-auto mb-6 rounded-2xl',
              'bg-gradient-to-br from-accent-primary/20 to-accent-hover/10',
              'flex items-center justify-center',
              'animate-pulseGlow'
            )}
          >
            <span className="text-3xl">✨</span>
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            How can I help you today?
          </h2>
          <p className="text-sm text-text-secondary">
            Ask me anything, or choose from the suggestions below to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className={cn(
        'flex-1 overflow-y-auto px-4 py-6',
        'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border'
      )}
    >
      <div className="max-w-3xl mx-auto space-y-4">
        {messages.map((message, index) => {
          const isLastMessage = index === messages.length - 1;
          const isStreamingMessage =
            isLastMessage && isStreaming && message.type === 'response';

          return (
            <MessageItem
              key={message.id}
              message={message}
              isStreaming={isStreamingMessage}
              streamingContent={isStreamingMessage ? streamingContent : undefined}
              onCopy={handleCopy}
              onFeedback={handleFeedback}
              onRegenerate={handleRegenerate}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export { MessageList };
