'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { MODELS } from '@/lib/constants';
import type { Model } from '@/types';

interface ModelBadgeProps {
  model: Model;
  routingReason?: string;
  showReason?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function ModelBadge({
  model,
  routingReason,
  showReason = true,
  size = 'md',
  className,
}: ModelBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const modelInfo = MODELS[model];

  if (!modelInfo) return null;

  const sizes = {
    sm: 'text-xs py-0.5 px-2',
    md: 'text-xs py-1 px-2.5',
  };

  return (
    <div className={cn('relative inline-flex', className)}>
      <button
        onClick={() => showReason && routingReason && setShowTooltip(!showTooltip)}
        className={cn(
          `
          inline-flex items-center gap-1.5 rounded-full
          border border-border-subtle bg-background-tertiary
          font-medium text-text-secondary
          transition-all duration-200
        `,
          sizes[size],
          showReason && routingReason && 'cursor-pointer hover:bg-border',
          !routingReason && 'cursor-default'
        )}
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: modelInfo.color }}
        />
        <span>{modelInfo.name}</span>
      </button>

      {/* Tooltip with routing reason */}
      {showTooltip && routingReason && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowTooltip(false)}
          />
          <div className="
            absolute left-0 top-full z-50 mt-2 w-64
            rounded-xl border border-border bg-background-secondary
            p-4 shadow-lg animate-scale-in
          ">
            <h4 className="mb-2 font-medium text-text-primary">
              Why {modelInfo.name}?
            </h4>
            <p className="text-sm text-text-secondary">
              {routingReason}
            </p>
            <button
              className="mt-3 text-sm text-accent hover:text-accent-hover"
              onClick={() => setShowTooltip(false)}
            >
              Try a different model
            </button>
          </div>
        </>
      )}
    </div>
  );
}
