'use client';

import * as React from 'react';
import {
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Sparkles,
  User,
  FileText,
  ImageIcon,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui';
import type { Message, Attachment, ModelType, FeedbackType } from '@/types';

// Model icons and colors
const modelConfig: Record<
  ModelType,
  { icon: string; gradient: string; name: string }
> = {
  Auto: {
    icon: '✨',
    gradient: 'from-purple-500 to-pink-500',
    name: 'Auto',
  },
  Claude: {
    icon: '🟠',
    gradient: 'from-orange-500 to-amber-500',
    name: 'Claude',
  },
  ChatGPT: {
    icon: '🟢',
    gradient: 'from-green-500 to-emerald-500',
    name: 'ChatGPT',
  },
  Gemini: {
    icon: '🔵',
    gradient: 'from-blue-500 to-cyan-500',
    name: 'Gemini',
  },
  Perplexity: {
    icon: '🟣',
    gradient: 'from-purple-500 to-violet-500',
    name: 'Perplexity',
  },
};

// Attachment Preview Component
interface AttachmentPreviewProps {
  attachment: Attachment;
  onRemove?: () => void;
  removable?: boolean;
}

const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  attachment,
  onRemove,
  removable = false,
}) => {
  const isImage = attachment.type.startsWith('image/');

  return (
    <div
      className={cn(
        'relative group flex items-center gap-2 px-3 py-2 rounded-lg',
        'bg-background-tertiary border border-border',
        'transition-all duration-200 hover:border-accent-primary/30'
      )}
    >
      {isImage ? (
        <div className="w-8 h-8 rounded overflow-hidden bg-background-secondary">
          <img
            src={attachment.url}
            alt={attachment.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-8 h-8 flex items-center justify-center rounded bg-accent-primary/10">
          <FileText size={14} className="text-accent-primary" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-text-primary truncate">
          {attachment.name}
        </p>
        <p className="text-[10px] text-text-tertiary">
          {(attachment.size / 1024).toFixed(1)} KB
        </p>
      </div>
      {removable && onRemove && (
        <button
          onClick={onRemove}
          className={cn(
            'absolute -top-1.5 -right-1.5',
            'w-5 h-5 flex items-center justify-center rounded-full',
            'bg-background-secondary border border-border',
            'text-text-tertiary hover:text-text-primary hover:border-red-500/50',
            'opacity-0 group-hover:opacity-100 transition-all'
          )}
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
};

// Message Actions Component
interface MessageActionsProps {
  messageId: string;
  isResponse: boolean;
  onCopy: () => void;
  onFeedback: (type: FeedbackType) => void;
  onRegenerate?: () => void;
  feedback?: FeedbackType | null;
}

const MessageActions: React.FC<MessageActionsProps> = ({
  isResponse,
  onCopy,
  onFeedback,
  onRegenerate,
  feedback,
}) => {
  return (
    <div
      className={cn(
        'flex items-center gap-1 mt-2',
        'opacity-0 group-hover:opacity-100 transition-opacity'
      )}
    >
      <button
        onClick={onCopy}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-md',
          'text-[11px] text-text-tertiary',
          'hover:bg-background-tertiary hover:text-text-secondary',
          'transition-all duration-200'
        )}
      >
        <Copy size={12} />
        <span>Copy</span>
      </button>

      {isResponse && (
        <>
          <button
            onClick={() => onFeedback('helpful')}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-md',
              'text-[11px]',
              feedback === 'helpful'
                ? 'text-green-400 bg-green-500/10'
                : 'text-text-tertiary hover:bg-background-tertiary hover:text-text-secondary',
              'transition-all duration-200'
            )}
          >
            <ThumbsUp size={12} />
          </button>

          <button
            onClick={() => onFeedback('not_helpful')}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-md',
              'text-[11px]',
              feedback === 'not_helpful'
                ? 'text-red-400 bg-red-500/10'
                : 'text-text-tertiary hover:bg-background-tertiary hover:text-text-secondary',
              'transition-all duration-200'
            )}
          >
            <ThumbsDown size={12} />
          </button>

          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-md',
                'text-[11px] text-text-tertiary',
                'hover:bg-background-tertiary hover:text-text-secondary',
                'transition-all duration-200'
              )}
            >
              <RotateCcw size={12} />
              <span>Regenerate</span>
            </button>
          )}
        </>
      )}
    </div>
  );
};

// Main Message Item Component
interface MessageItemProps {
  message: Message;
  isStreaming?: boolean;
  streamingContent?: string;
  onCopy: (content: string) => void;
  onFeedback: (messageId: string, feedback: FeedbackType) => void;
  onRegenerate?: (messageId: string) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isStreaming = false,
  streamingContent,
  onCopy,
  onFeedback,
  onRegenerate,
}) => {
  const isQuery = message.type === 'query';
  const model = message.model || 'Auto';
  const config = modelConfig[model];

  const displayContent = isStreaming ? streamingContent || '' : message.content;

  // Format message content with markdown
  const formatContent = (content: string) => {
    // Basic markdown formatting
    let formatted = content
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-background-tertiary px-1.5 py-0.5 rounded text-accent-primary text-sm">$1</code>')
      // Line breaks
      .replace(/\n/g, '<br />');

    return formatted;
  };

  return (
    <div
      className={cn(
        'group flex gap-3 p-4 rounded-xl transition-all duration-200',
        isQuery
          ? 'bg-transparent'
          : 'bg-gradient-to-br from-background-tertiary/50 to-background-secondary'
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isQuery ? (
          <Avatar
            fallback={<User size={16} />}
            size="sm"
            className="bg-gradient-to-br from-accent-primary to-accent-hover"
          />
        ) : (
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center',
              'bg-gradient-to-br',
              config.gradient
            )}
          >
            <Sparkles size={14} className="text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-text-primary">
            {isQuery ? 'You' : config.name}
          </span>
          {!isQuery && (
            <span className="text-lg" title={config.name}>
              {config.icon}
            </span>
          )}
          <span className="text-[10px] text-text-tertiary">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {message.attachments.map((attachment) => (
              <AttachmentPreview key={attachment.id} attachment={attachment} />
            ))}
          </div>
        )}

        {/* Message Content */}
        <div
          className="text-sm text-text-primary leading-relaxed prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: formatContent(displayContent) }}
        />

        {/* Streaming Indicator */}
        {isStreaming && (
          <span className="inline-block w-2 h-4 ml-1 bg-accent-primary animate-pulse rounded-sm" />
        )}

        {/* Actions */}
        <MessageActions
          messageId={message.id}
          isResponse={!isQuery}
          onCopy={() => onCopy(message.content)}
          onFeedback={(type) => onFeedback(message.id, type)}
          onRegenerate={
            !isQuery && onRegenerate
              ? () => onRegenerate(message.id)
              : undefined
          }
        />
      </div>
    </div>
  );
};

export { MessageItem, AttachmentPreview };
