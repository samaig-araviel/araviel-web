'use client';

import { Flame, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserStatsProps {
  xp: number;
  streak: number;
  className?: string;
}

export function UserStats({ xp, streak, className }: UserStatsProps) {
  // Calculate level from XP (simple formula: level = floor(xp / 100) + 1)
  const level = Math.floor(xp / 100) + 1;
  const xpToNextLevel = 100 - (xp % 100);
  const xpProgress = (xp % 100) / 100;

  return (
    <div className={cn('rounded-xl border border-border-subtle bg-background-secondary p-4', className)}>
      <div className="grid grid-cols-2 gap-4">
        {/* XP Progress */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft">
              <Zap className="h-4 w-4 text-accent" />
            </div>
            <div>
              <div className="text-xs text-text-muted">Level {level}</div>
              <div className="text-sm font-semibold text-text-primary">{xp} XP</div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-background-tertiary">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{ width: `${xpProgress * 100}%` }}
            />
          </div>
          <div className="text-xs text-text-muted">{xpToNextLevel} XP to level {level + 1}</div>
        </div>

        {/* Streak */}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning-soft">
            <Flame className="h-4 w-4 text-warning" />
          </div>
          <div>
            <div className="text-xs text-text-muted">Streak</div>
            <div className="text-sm font-semibold text-text-primary">
              {streak} {streak === 1 ? 'day' : 'days'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
