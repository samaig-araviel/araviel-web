'use client';

import { useState, useRef, useEffect } from 'react';
import { Paperclip, Search, Send, Sparkles, ChevronDown, Square, X } from 'lucide-react';
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
import type { ModelSelection, Model, Attachment } from '@/types';

interface ChatInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (message: string, attachments?: Attachment[]) => void;
  onStop?: () => void;
  selectedModel?: ModelSelection;
  onModelChange?: (model: ModelSelection) => void;
  placeholder?: string;
  disabled?: boolean;
  isGenerating?: boolean;
  className?: string;
}

export function ChatInput({
  value = '',
  onChange,
  onSubmit,
  onStop,
  selectedModel = 'auto',
  onModelChange,
  placeholder = 'Type your message...',
  disabled = false,
  isGenerating = false,
  className,
}: ChatInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

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
    if (localValue.trim() && !disabled && !isGenerating) {
      onSubmit?.(localValue.trim(), attachments.length > 0 ? attachments : undefined);
      setLocalValue('');
      setAttachments([]);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newAttachments: Attachment[] = Array.from(files).map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        type: file.type,
        size: file.size,
      }));
      setAttachments((prev) => [...prev, ...newAttachments]);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
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
    <div className={cn('border-t border-border bg-background-primary p-4', className)}>
      <div className="mx-auto max-w-3xl">
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="
                  flex items-center gap-2 rounded-lg
                  bg-background-tertiary px-3 py-1.5
                  text-sm text-text-secondary
                "
              >
                <Paperclip className="h-3.5 w-3.5" />
                <span className="max-w-[150px] truncate">{attachment.name}</span>
                <button
                  onClick={() => removeAttachment(attachment.id)}
                  className="text-text-muted hover:text-text-primary"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Container */}
        <div
          className={cn(
            `
            relative rounded-2xl border border-border bg-background-secondary
            transition-all duration-200
            focus-within:border-accent focus-within:shadow-glow
          `,
            (disabled || isGenerating) && 'opacity-50'
          )}
        >
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={localValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isGenerating}
            rows={1}
            className="
              w-full resize-none rounded-2xl bg-transparent
              px-4 py-3 text-text-primary
              placeholder:text-text-muted
              focus:outline-none
            "
            style={{ minHeight: '48px', maxHeight: '200px' }}
          />

          {/* Bottom Toolbar */}
          <div className="flex items-center justify-between border-t border-border-subtle px-3 py-2">
            {/* Left Actions */}
            <div className="flex items-center gap-1">
              {/* File Input */}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
              />

              {/* Attach Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isGenerating}
                className="
                  flex items-center gap-1.5 rounded-lg px-2.5 py-1.5
                  text-sm text-text-muted
                  transition-colors hover:bg-background-tertiary hover:text-text-primary
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
                title="Attach file"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              {/* Web Search Toggle */}
              <button
                onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                disabled={disabled || isGenerating}
                className={cn(
                  `
                  flex items-center gap-1.5 rounded-lg px-2.5 py-1.5
                  text-sm transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                `,
                  webSearchEnabled
                    ? 'bg-accent-soft text-accent'
                    : 'text-text-muted hover:bg-background-tertiary hover:text-text-primary'
                )}
                title="Enable web search"
              >
                <Search className="h-4 w-4" />
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

            {/* Send/Stop Button */}
            {isGenerating ? (
              <button
                onClick={onStop}
                className="
                  flex h-9 w-9 items-center justify-center rounded-lg
                  bg-error text-white
                  transition-all duration-200
                  hover:bg-red-600 active:scale-95
                "
                title="Stop generating"
              >
                <Square className="h-4 w-4" />
              </button>
            ) : (
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
            )}
          </div>
        </div>

        {/* Character count for long messages */}
        {localValue.length > 1000 && (
          <p className="mt-2 text-right text-xs text-text-muted">
            {localValue.length.toLocaleString()} characters
          </p>
        )}
      </div>
    </div>
  );
}
