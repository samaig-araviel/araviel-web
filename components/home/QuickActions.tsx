'use client';

import { cn } from '@/lib/utils';
import { QUICK_ACTIONS } from '@/lib/constants';
import type { QuickAction } from '@/types';

interface QuickActionsProps {
  onSelect?: (action: QuickAction) => void;
  className?: string;
}

export function QuickActions({ onSelect, className }: QuickActionsProps) {
  return (
    <div className={cn('w-full', className)}>
      <h3 className="mb-4 text-sm font-medium text-text-muted">
        Quick Actions
      </h3>

      {/* Grid on desktop, horizontal scroll on mobile */}
      <div className="
        flex gap-3 overflow-x-auto pb-2
        md:grid md:grid-cols-4 md:overflow-visible md:pb-0
        lg:grid-cols-8
        scrollbar-hide
        -mx-4 px-4 md:mx-0 md:px-0
      ">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            onClick={() => onSelect?.(action)}
            className="
              flex min-w-[100px] flex-col items-center gap-2.5
              rounded-xl border border-border-subtle bg-background-tertiary
              p-4 md:p-3
              transition-all duration-200
              hover:border-text-muted hover:bg-background-secondary
              hover:-translate-y-0.5 hover:shadow-md
              active:scale-[0.98]
              md:min-w-0
            "
          >
            <span className="text-2xl" role="img" aria-label={action.label}>
              {action.icon}
            </span>
            <span className="text-sm font-medium text-text-primary">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
