'use client';

import {
  PenLine,
  Lightbulb,
  Code2,
  Search,
  BarChart3,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QUICK_ACTIONS } from '@/lib/constants';
import type { QuickAction } from '@/types';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  PenLine,
  Lightbulb,
  Code2,
  Search,
  BarChart3,
  GraduationCap,
};

interface QuickActionsProps {
  onSelect?: (action: QuickAction) => void;
  className?: string;
}

export function QuickActions({ onSelect, className }: QuickActionsProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* Grid layout */}
      <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
        {QUICK_ACTIONS.map((action) => {
          const Icon = iconMap[action.icon];

          return (
            <button
              key={action.id}
              onClick={() => onSelect?.(action)}
              className="group flex flex-col items-center gap-2 rounded-xl border border-border-subtle bg-background-secondary p-4 transition-all duration-150 hover:border-border hover:bg-background-tertiary hover:shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background-tertiary text-text-secondary transition-colors group-hover:bg-accent-soft group-hover:text-accent">
                {Icon && <Icon className="h-5 w-5" />}
              </div>
              <span className="text-xs font-medium text-text-primary">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
