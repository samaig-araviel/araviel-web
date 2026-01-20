'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MODELS, MODEL_LIST } from '@/lib/constants';
import type { ModelSelection, Model } from '@/types';

interface MainInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (message: string) => void;
  selectedModel?: ModelSelection;
  onModelChange?: (model: ModelSelection) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function MainInput({
  value = '',
  onChange,
  onSubmit,
  selectedModel = 'auto',
  onModelChange,
  placeholder = 'Ask anything or start with a suggestion below...',
  disabled = false,
  autoFocus = false,
}: MainInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isModelOpen, setIsModelOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModelOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange?.(newValue);
    adjustTextareaHeight();
  };

  const handleSubmit = () => {
    if (localValue.trim() && !disabled) {
      onSubmit?.(localValue.trim());
      setLocalValue('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleModelSelect = (model: ModelSelection) => {
    onModelChange?.(model);
    setIsModelOpen(false);
  };

  const getModelDisplay = () => {
    if (selectedModel === 'auto') {
      return { name: 'Auto', color: 'text-accent' };
    }
    const model = MODELS[selectedModel];
    return { name: model?.name || 'Auto', color: '' };
  };

  const modelDisplay = getModelDisplay();

  return (
    <div
      className={cn(
        'relative rounded-xl border border-border bg-background-secondary shadow-sm transition-all duration-200',
        'focus-within:border-accent focus-within:shadow-glow',
        disabled && 'opacity-50'
      )}
    >
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={2}
        className="w-full resize-none rounded-xl bg-transparent px-4 py-4 text-text-primary placeholder:text-text-placeholder focus:outline-none"
        style={{ minHeight: '80px', maxHeight: '200px' }}
      />

      {/* Bottom Toolbar */}
      <div className="flex items-center justify-between border-t border-border-subtle px-3 py-2">
        {/* Model Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsModelOpen(!isModelOpen)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors hover:bg-background-tertiary',
              modelDisplay.color
            )}
          >
            {selectedModel === 'auto' ? (
              <Sparkles className="h-4 w-4 text-accent" />
            ) : (
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: MODELS[selectedModel]?.color }}
              />
            )}
            <span className="font-medium">{modelDisplay.name}</span>
            <ChevronDown className={cn('h-3.5 w-3.5 text-text-muted transition-transform', isModelOpen && 'rotate-180')} />
          </button>

          {/* Dropdown Menu */}
          {isModelOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-56 animate-fade-in rounded-lg border border-border bg-background-secondary p-1 shadow-lg">
              <div className="px-2 py-1.5 text-xs font-medium text-text-muted">
                Select Model
              </div>
              <div className="my-1 h-px bg-border-subtle" />

              {/* Auto Option */}
              <button
                onClick={() => handleModelSelect('auto')}
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-background-tertiary"
              >
                <Sparkles className="h-4 w-4 text-accent" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                    Auto
                    <span className="text-xs text-text-muted">(Recommended)</span>
                  </div>
                  <div className="text-xs text-text-muted">Araviel chooses best</div>
                </div>
                {selectedModel === 'auto' && <Check className="h-4 w-4 text-accent" />}
              </button>

              <div className="my-1 h-px bg-border-subtle" />

              {/* Model Options */}
              {MODEL_LIST.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleModelSelect(model.id as Model)}
                  className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-background-tertiary"
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: model.color }}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-text-primary">{model.name}</div>
                    <div className="text-xs text-text-muted">{model.description}</div>
                  </div>
                  {selectedModel === model.id && <Check className="h-4 w-4 text-accent" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Hint Text */}
        <div className="hidden text-xs text-text-muted sm:block">
          Press Enter to send
        </div>

        {/* Send Button */}
        <button
          onClick={handleSubmit}
          disabled={disabled || !localValue.trim()}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150',
            localValue.trim() && !disabled
              ? 'bg-accent text-white hover:bg-accent-hover'
              : 'bg-background-tertiary text-text-muted cursor-not-allowed'
          )}
          title="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
