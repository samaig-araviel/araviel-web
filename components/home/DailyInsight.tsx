'use client';

import { useState, useEffect } from 'react';
import { X, Lightbulb, Sparkles, Quote, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DAILY_INSIGHTS } from '@/lib/constants';
import { Card } from '@/components/ui/Card';
import type { DailyInsight as DailyInsightType, InsightType } from '@/types';

interface DailyInsightProps {
  className?: string;
  onDismiss?: () => void;
}

const iconMap: Record<InsightType, React.ComponentType<{ className?: string }>> = {
  tip: Lightbulb,
  stat: Zap,
  feature: Sparkles,
  quote: Quote,
};

const backgroundMap: Record<InsightType, string> = {
  tip: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
  stat: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30',
  feature: 'bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30',
  quote: 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30',
};

export function DailyInsight({ className, onDismiss }: DailyInsightProps) {
  const [insight, setInsight] = useState<DailyInsightType | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Get a different insight each day based on date
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const insightIndex = dayOfYear % DAILY_INSIGHTS.length;
    setInsight(DAILY_INSIGHTS[insightIndex]);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (!insight || dismissed) return null;

  const Icon = iconMap[insight.type];

  return (
    <Card
      variant="default"
      padding="none"
      className={cn(
        'relative overflow-hidden border border-border-subtle',
        backgroundMap[insight.type],
        className
      )}
    >
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="
          absolute right-2 top-2 z-10
          rounded-md p-1 text-text-muted
          transition-colors hover:bg-black/5 hover:text-text-primary
          dark:hover:bg-white/10
        "
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex gap-4 p-4 pr-10">
        {/* Icon */}
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            insight.type === 'tip' && 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400',
            insight.type === 'stat' && 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
            insight.type === 'feature' && 'bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-400',
            insight.type === 'quote' && 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400'
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="mb-1 text-sm font-medium text-text-muted">
            {insight.title}
          </h4>
          <p className="text-sm leading-relaxed text-text-primary">
            {insight.content}
          </p>
        </div>
      </div>
    </Card>
  );
}
