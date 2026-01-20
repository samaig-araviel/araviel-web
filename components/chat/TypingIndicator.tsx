'use client';

import { cn } from '@/lib/utils';
import { MODELS } from '@/lib/constants';
import { Avatar } from '@/components/ui/Avatar';
import type { Model } from '@/types';

interface TypingIndicatorProps {
  model?: Model;
  className?: string;
}

export function TypingIndicator({ model, className }: TypingIndicatorProps) {
  const modelInfo = model ? MODELS[model] : null;
  const displayName = modelInfo ? modelInfo.name : 'Araviel';

  return (
    <div
      className={cn(
        'flex items-start gap-3 animate-fade-in',
        className
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <Avatar
          fallback={modelInfo?.icon || '✨'}
          size="md"
        />
        {modelInfo && (
          <span
            className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background-primary"
            style={{ backgroundColor: modelInfo.color }}
          />
        )}
      </div>

      {/* Content */}
      <div className="
        rounded-2xl rounded-tl-md
        border border-border-subtle bg-background-secondary
        px-4 py-3
      ">
        <p className="mb-2 text-sm text-text-muted">
          {displayName} is thinking...
        </p>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-text-muted typing-dot" />
          <span className="h-2 w-2 rounded-full bg-text-muted typing-dot" />
          <span className="h-2 w-2 rounded-full bg-text-muted typing-dot" />
        </div>
      </div>
    </div>
  );
}
