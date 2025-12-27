'use client';

import * as React from 'react';
import {
  Send,
  Paperclip,
  Globe,
  X,
  Plus,
  ImageIcon,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectIsStreaming,
  selectSelectedModel,
  selectFileAttachmentsEnabled,
  selectWebSearchEnabled,
  selectMaxAttachments,
  selectMaxFileSize,
} from '@/store/selectors';
import { sendMessage, cancelStream } from '@/store/slices/chatSlice';
import { addToast } from '@/store/slices/uiSlice';
import { TextArea } from '@/components/ui';
import { ModelSelector } from './ModelSelector';
import { AttachmentPreview } from './MessageItem';
import type { Attachment } from '@/types';

interface MessageInputProps {
  placeholder?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
  placeholder = 'Ask anything...',
}) => {
  const dispatch = useAppDispatch();
  const isStreaming = useAppSelector(selectIsStreaming);
  const selectedModel = useAppSelector(selectSelectedModel);
  const fileAttachmentsEnabled = useAppSelector(selectFileAttachmentsEnabled);
  const webSearchEnabled = useAppSelector(selectWebSearchEnabled);
  const maxAttachments = useAppSelector(selectMaxAttachments);
  const maxFileSize = useAppSelector(selectMaxFileSize);

  const [message, setMessage] = React.useState('');
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);
  const [isWebSearchActive, setIsWebSearchActive] = React.useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const canSend = message.trim().length > 0 || attachments.length > 0;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!canSend || isStreaming) return;

    dispatch(
      sendMessage({
        content: message.trim(),
        model: selectedModel,
        attachments: attachments.length > 0 ? attachments : undefined,
        webSearch: isWebSearchActive,
      })
    );

    setMessage('');
    setAttachments([]);
    setIsWebSearchActive(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (attachments.length + files.length > maxAttachments) {
      dispatch(
        addToast({
          type: 'error',
          message: `Maximum ${maxAttachments} attachments allowed`,
        })
      );
      return;
    }

    Array.from(files).forEach((file) => {
      if (file.size > maxFileSize) {
        dispatch(
          addToast({
            type: 'error',
            message: `File "${file.name}" exceeds ${maxFileSize / (1024 * 1024)}MB limit`,
          })
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const newAttachment: Attachment = {
          id: `${Date.now()}-${file.name}`,
          type: file.type,
          name: file.name,
          size: file.size,
          url: reader.result as string,
        };
        setAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setShowAttachmentMenu(false);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleCancel = () => {
    dispatch(cancelStream());
  };

  return (
    <div className="border-t border-border bg-background-primary">
      <div className="max-w-3xl mx-auto px-4 py-4">
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachments.map((attachment) => (
              <AttachmentPreview
                key={attachment.id}
                attachment={attachment}
                removable
                onRemove={() => removeAttachment(attachment.id)}
              />
            ))}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="relative">
          <div
            className={cn(
              'relative flex flex-col',
              'bg-background-secondary border border-border rounded-2xl',
              'transition-all duration-200',
              'focus-within:border-accent-primary/50 focus-within:shadow-lg focus-within:shadow-accent-primary/5'
            )}
          >
            {/* Textarea */}
            <TextArea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn(
                'min-h-[52px] max-h-[200px] py-3.5 px-4',
                'bg-transparent border-0 resize-none',
                'text-text-primary placeholder:text-text-tertiary',
                'focus:ring-0 focus:outline-none'
              )}
              disabled={isStreaming}
            />

            {/* Bottom Bar */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-border/50">
              {/* Left Actions */}
              <div className="flex items-center gap-1">
                {/* Model Selector */}
                <ModelSelector compact />

                {/* Attachment Button */}
                {fileAttachmentsEnabled && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                      className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-lg',
                        'text-text-tertiary hover:text-text-secondary hover:bg-background-tertiary',
                        'transition-all duration-200',
                        attachments.length > 0 && 'text-accent-primary'
                      )}
                    >
                      <Paperclip size={16} />
                    </button>

                    {showAttachmentMenu && (
                      <div
                        className={cn(
                          'absolute bottom-full left-0 mb-2',
                          'bg-background-secondary border border-border rounded-xl',
                          'shadow-xl shadow-black/20 p-1.5',
                          'animate-slideUp'
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-lg w-full',
                            'text-sm text-text-secondary hover:text-text-primary hover:bg-background-tertiary',
                            'transition-all duration-200'
                          )}
                        >
                          <ImageIcon size={14} />
                          <span>Image</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-lg w-full',
                            'text-sm text-text-secondary hover:text-text-primary hover:bg-background-tertiary',
                            'transition-all duration-200'
                          )}
                        >
                          <FileText size={14} />
                          <span>Document</span>
                        </button>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.txt,.md"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                )}

                {/* Web Search Toggle */}
                {webSearchEnabled && (
                  <button
                    type="button"
                    onClick={() => setIsWebSearchActive(!isWebSearchActive)}
                    className={cn(
                      'flex items-center gap-1.5 px-2 py-1.5 rounded-lg',
                      'text-xs font-medium transition-all duration-200',
                      isWebSearchActive
                        ? 'bg-accent-primary/10 text-accent-primary'
                        : 'text-text-tertiary hover:text-text-secondary hover:bg-background-tertiary'
                    )}
                  >
                    <Globe size={14} />
                    <span>Web</span>
                  </button>
                )}
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-2">
                {isStreaming ? (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className={cn(
                      'flex items-center justify-center w-9 h-9 rounded-xl',
                      'bg-red-500/20 text-red-400',
                      'hover:bg-red-500/30 transition-all duration-200'
                    )}
                  >
                    <X size={18} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!canSend}
                    className={cn(
                      'flex items-center justify-center w-9 h-9 rounded-xl',
                      'transition-all duration-200',
                      canSend
                        ? 'bg-gradient-to-r from-accent-primary to-accent-hover text-white shadow-lg shadow-accent-primary/20 hover:shadow-accent-primary/40'
                        : 'bg-background-tertiary text-text-tertiary cursor-not-allowed'
                    )}
                  >
                    <Send size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Keyboard Hint */}
        <p className="text-[10px] text-text-tertiary text-center mt-2">
          Press <kbd className="px-1 py-0.5 bg-background-tertiary rounded text-text-secondary">Enter</kbd> to send, <kbd className="px-1 py-0.5 bg-background-tertiary rounded text-text-secondary">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
};

export { MessageInput };
