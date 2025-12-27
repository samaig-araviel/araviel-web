'use client';

import * as React from 'react';
import { ChevronDown, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectSelectedModel } from '@/store/selectors';
import { setSelectedModel } from '@/store/slices/chatSlice';
import { MODEL_OPTIONS, type ModelType, type ModelOption } from '@/types';

interface ModelSelectorProps {
  compact?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ compact = false }) => {
  const dispatch = useAppDispatch();
  const selectedModel = useAppSelector(selectSelectedModel);
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const currentModel = MODEL_OPTIONS.find((m) => m.id === selectedModel);

  const handleSelect = (modelId: ModelType) => {
    dispatch(setSelectedModel(modelId));
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 rounded-lg',
          'text-text-secondary hover:text-text-primary',
          'transition-all duration-200',
          compact
            ? 'px-2 py-1.5 text-xs'
            : 'px-3 py-2 text-sm bg-background-tertiary hover:bg-background-secondary border border-border'
        )}
      >
        <span className="text-base">{currentModel?.icon || '✨'}</span>
        {!compact && (
          <span className="font-medium">{currentModel?.name || 'Auto'}</span>
        )}
        <ChevronDown
          size={compact ? 12 : 14}
          className={cn('transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-2',
            compact ? 'left-0' : 'right-0',
            'min-w-[200px] py-2',
            'bg-background-secondary border border-border rounded-xl',
            'shadow-xl shadow-black/20',
            'animate-slideDown'
          )}
        >
          <div className="px-3 py-2 border-b border-border">
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">
              Select Model
            </p>
          </div>

          <div className="p-1.5">
            {MODEL_OPTIONS.map((model) => (
              <button
                key={model.id}
                onClick={() => handleSelect(model.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
                  'text-left transition-all duration-200',
                  selectedModel === model.id
                    ? 'bg-accent-primary/10 text-text-primary'
                    : 'text-text-secondary hover:bg-background-tertiary hover:text-text-primary'
                )}
              >
                <span className="text-lg">{model.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{model.name}</p>
                  <p className="text-[10px] text-text-tertiary truncate">
                    {model.description}
                  </p>
                </div>
                {selectedModel === model.id && (
                  <Check size={14} className="text-accent-primary" />
                )}
              </button>
            ))}
          </div>

          <div className="px-3 py-2 border-t border-border">
            <p className="text-[10px] text-text-tertiary">
              Auto mode selects the best model for your query
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export { ModelSelector };
