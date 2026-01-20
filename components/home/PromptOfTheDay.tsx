'use client';

import { useMemo } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DAILY_PROMPTS } from '@/lib/constants';

interface PromptOfTheDayProps {
  onSelect?: (prompt: string) => void;
  className?: string;
}

export function PromptOfTheDay({ onSelect, className }: PromptOfTheDayProps) {
  // Get a consistent daily prompt based on date
  const dailyPrompt = useMemo(() => {
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length];
  }, []);

  return (
    <div className={cn('rounded-xl border border-border-subtle bg-background-secondary', className)}>
      <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
        <Sparkles className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-medium text-text-primary">Prompt of the Day</h3>
      </div>

      <button
        onClick={() => onSelect?.(dailyPrompt)}
        className="group flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-background-tertiary"
      >
        <div className="flex-1">
          <p className="text-sm leading-relaxed text-text-secondary">
            &ldquo;{dailyPrompt}&rdquo;
          </p>
        </div>
        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
    </div>
  );
}
