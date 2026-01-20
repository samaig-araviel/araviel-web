'use client';

import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MODELS } from '@/lib/constants';
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
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: modelInfo?.color || 'var(--accent)' }}
      >
        <Sparkles className="h-4 w-4 text-white" />
      </div>

      {/* Content */}
      <div className="rounded-2xl rounded-tl-md border border-border-subtle bg-background-secondary px-4 py-3">
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
