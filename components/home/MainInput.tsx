'use client';

import { useState, useRef, useEffect } from 'react';
import { Paperclip, Search, Send, Sparkles, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MODELS, MODEL_LIST } from '@/lib/constants';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownDivider,
} from '@/components/ui/Dropdown';
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
  placeholder = 'Ask me anything, or try one of the suggestions below...',
  disabled = false,
  autoFocus = false,
}: MainInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 300)}px`;
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

  const getModelDisplay = () => {
    if (selectedModel === 'auto') {
      return { name: 'Auto', icon: <Sparkles className="h-4 w-4" />, color: 'text-accent' };
    }
    const model = MODELS[selectedModel];
    return {
      name: model.name.split(' ')[0],
      icon: <span>{model.icon}</span>,
      color: '',
    };
  };

  const modelDisplay = getModelDisplay();

  return (
    <div
      className={cn(
        `
        relative rounded-2xl border border-border bg-background-secondary
        transition-all duration-200
        focus-within:border-accent focus-within:shadow-glow
      `,
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
        rows={3}
        className="
          w-full resize-none rounded-2xl bg-transparent
          px-4 py-4 text-text-primary
          placeholder:text-text-muted
          focus:outline-none
        "
        style={{ minHeight: '120px', maxHeight: '300px' }}
      />

      {/* Bottom Toolbar */}
      <div className="flex items-center justify-between border-t border-border-subtle px-3 py-2">
        {/* Left Actions */}
        <div className="flex items-center gap-1">
          {/* Attach Button */}
          <button
            className="
              flex items-center gap-1.5 rounded-lg px-2.5 py-1.5
              text-sm text-text-muted
              transition-colors hover:bg-background-tertiary hover:text-text-primary
            "
            title="Attach file"
          >
            <Paperclip className="h-4 w-4" />
            <span className="hidden sm:inline">Attach</span>
          </button>

          {/* Web Search Toggle */}
          <button
            onClick={() => setWebSearchEnabled(!webSearchEnabled)}
            className={cn(
              `
              flex items-center gap-1.5 rounded-lg px-2.5 py-1.5
              text-sm transition-colors
            `,
              webSearchEnabled
                ? 'bg-accent-soft text-accent'
                : 'text-text-muted hover:bg-background-tertiary hover:text-text-primary'
            )}
            title="Enable web search"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>

        {/* Model Selector */}
        <Dropdown>
          <DropdownTrigger>
            <div
              className={cn(
                `
                flex items-center gap-1.5 rounded-lg px-2.5 py-1.5
                text-sm transition-colors
                hover:bg-background-tertiary
              `,
                modelDisplay.color
              )}
            >
              {modelDisplay.icon}
              <span>{modelDisplay.name}</span>
              <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
            </div>
          </DropdownTrigger>
          <DropdownContent align="center" className="w-64">
            <DropdownLabel>Select Model</DropdownLabel>
            <DropdownDivider />

            {/* Auto Option */}
            <DropdownItem
              icon={<Sparkles className="h-4 w-4 text-accent" />}
              onClick={() => onModelChange?.('auto')}
            >
              <div className="flex flex-col">
                <span className="flex items-center gap-2">
                  Auto (Recommended)
                  {selectedModel === 'auto' && (
                    <span className="text-xs text-accent">✓</span>
                  )}
                </span>
                <span className="text-xs text-text-muted">Araviel chooses best</span>
              </div>
            </DropdownItem>

            <DropdownDivider />

            {/* Model Options */}
            {MODEL_LIST.map((model) => (
              <DropdownItem
                key={model.id}
                icon={<span>{model.icon}</span>}
                onClick={() => onModelChange?.(model.id as Model)}
              >
                <div className="flex flex-col">
                  <span className="flex items-center gap-2">
                    {model.name}
                    {selectedModel === model.id && (
                      <span className="text-xs text-accent">✓</span>
                    )}
                  </span>
                  <span className="text-xs text-text-muted">{model.description}</span>
                </div>
              </DropdownItem>
            ))}
          </DropdownContent>
        </Dropdown>

        {/* Send Button */}
        <button
          onClick={handleSubmit}
          disabled={disabled || !localValue.trim()}
          className={cn(
            `
            flex h-9 w-9 items-center justify-center rounded-lg
            transition-all duration-200
          `,
            localValue.trim() && !disabled
              ? 'bg-accent text-white hover:bg-accent-hover active:scale-95'
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
