'use client';

import { useState } from 'react';
import { Copy, RefreshCw, ThumbsUp, ThumbsDown, RotateCcw, Check } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { MODELS } from '@/lib/constants';
import { Avatar } from '@/components/ui/Avatar';
import { ModelBadge } from './ModelBadge';
import type { Message, User } from '@/types';

interface ChatMessageProps {
  message: Message;
  user?: User;
  isLast?: boolean;
  onRegenerate?: () => void;
  onTryDifferent?: () => void;
  onFeedback?: (positive: boolean) => void;
  className?: string;
}

export function ChatMessage({
  message,
  user,
  isLast = false,
  onRegenerate,
  onTryDifferent,
  onFeedback,
  className,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);

  const isUser = message.role === 'user';
  const modelInfo = message.model ? MODELS[message.model] : null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = (positive: boolean) => {
    setFeedback(positive ? 'positive' : 'negative');
    onFeedback?.(positive);
  };

  // Simple markdown rendering (you can enhance this with a proper markdown library)
  const renderContent = (content: string) => {
    // Split by code blocks
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        // Code block
        const lines = part.slice(3, -3).split('\n');
        const language = lines[0] || 'text';
        const code = lines.slice(1).join('\n');

        return (
          <div key={index} className="my-3 overflow-hidden rounded-lg border border-border">
            <div className="flex items-center justify-between bg-background-tertiary px-4 py-2">
              <span className="text-xs font-medium text-text-muted">{language}</span>
              <button
                onClick={handleCopy}
                className="text-xs text-text-muted hover:text-text-primary"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="overflow-x-auto bg-background-primary p-4">
              <code className="text-sm">{code}</code>
            </pre>
          </div>
        );
      }

      // Regular text with basic formatting
      return (
        <span key={index} className="whitespace-pre-wrap">
          {part.split(/(\*\*.*?\*\*)/g).map((segment, i) => {
            if (segment.startsWith('**') && segment.endsWith('**')) {
              return <strong key={i}>{segment.slice(2, -2)}</strong>;
            }
            return segment;
          })}
        </span>
      );
    });
  };

  return (
    <div
      className={cn(
        'group flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row',
        'animate-fade-in',
        className
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        {isUser ? (
          <Avatar
            src={user?.avatar}
            alt={user?.name}
            fallback={user?.name || 'U'}
            size="md"
          />
        ) : (
          <Avatar
            fallback={modelInfo?.icon || '✨'}
            size="md"
          />
        )}
        {!isUser && modelInfo && (
          <span
            className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background-primary"
            style={{ backgroundColor: modelInfo.color }}
          />
        )}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          'flex max-w-[85%] flex-col gap-2',
          isUser && 'items-end'
        )}
      >
        {/* Model Badge for AI messages */}
        {!isUser && message.model && (
          <ModelBadge
            model={message.model}
            routingReason={message.routingReason}
            size="sm"
          />
        )}

        {/* Message Bubble */}
        <div
          className={cn(
            'rounded-2xl px-4 py-3',
            isUser
              ? 'rounded-tr-md bg-accent-soft text-text-primary'
              : 'rounded-tl-md border border-border-subtle bg-background-secondary'
          )}
        >
          <div className="text-sm leading-relaxed">
            {renderContent(message.content)}
          </div>
        </div>

        {/* Timestamp */}
        <span className="px-1 text-xs text-text-muted">
          {formatRelativeTime(message.timestamp)}
        </span>

        {/* Action Buttons for AI messages */}
        {!isUser && (
          <div
            className={cn(
              'flex items-center gap-1 transition-opacity',
              'opacity-0 group-hover:opacity-100',
              isLast && 'opacity-100'
            )}
          >
            <button
              onClick={handleCopy}
              className="
                flex items-center gap-1.5 rounded-md px-2 py-1
                text-xs text-text-muted
                transition-colors hover:bg-background-tertiary hover:text-text-primary
              "
              title="Copy"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-success" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">Copy</span>
            </button>

            <button
              onClick={onRegenerate}
              className="
                flex items-center gap-1.5 rounded-md px-2 py-1
                text-xs text-text-muted
                transition-colors hover:bg-background-tertiary hover:text-text-primary
              "
              title="Regenerate"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Regenerate</span>
            </button>

            <div className="mx-1 h-4 w-px bg-border" />

            <button
              onClick={() => handleFeedback(true)}
              className={cn(
                `
                flex items-center gap-1 rounded-md p-1.5
                text-text-muted transition-colors
                hover:bg-background-tertiary hover:text-text-primary
              `,
                feedback === 'positive' && 'bg-success/10 text-success'
              )}
              title="Good response"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => handleFeedback(false)}
              className={cn(
                `
                flex items-center gap-1 rounded-md p-1.5
                text-text-muted transition-colors
                hover:bg-background-tertiary hover:text-text-primary
              `,
                feedback === 'negative' && 'bg-error/10 text-error'
              )}
              title="Bad response"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>

            <div className="mx-1 h-4 w-px bg-border" />

            <button
              onClick={onTryDifferent}
              className="
                flex items-center gap-1.5 rounded-md px-2 py-1
                text-xs text-text-muted
                transition-colors hover:bg-background-tertiary hover:text-text-primary
              "
              title="Try different model"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Try other</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
