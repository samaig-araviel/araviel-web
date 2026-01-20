'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { formatRelativeTime } from '@/lib/utils';
import { MODELS } from '@/lib/constants';
import {
  ArrowLeft,
  Send,
  Square,
  MoreVertical,
  Copy,
  Share2,
  Trash2,
  Edit3,
  Sparkles,
  Cpu,
  Globe,
  Zap,
  Check,
  ChevronDown,
} from 'lucide-react';
import type { Model, ModelSelection } from '@/types';

// Model icons
const modelIcons: Record<Model, React.ComponentType<{ className?: string }>> = {
  claude: Sparkles,
  gpt4: Cpu,
  gemini: Globe,
};

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [showOptions, setShowOptions] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    updateConversationTitle,
    deleteConversation,
    selectedModel,
    setSelectedModel,
    isGenerating,
    inputValue,
    setInputValue,
    sendMessage,
    stopGenerating,
  } = useAppStore();

  // Find conversation
  const conversation = conversations.find((c) => c.id === conversationId);

  // Set active conversation
  useEffect(() => {
    if (conversationId && conversationId !== activeConversationId) {
      setActiveConversation(conversationId);
    }
  }, [conversationId, activeConversationId, setActiveConversation]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    if (!inputValue.trim() || isGenerating) return;
    await sendMessage(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopyMessage = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: conversation?.title || 'Araviel Chat',
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
    setShowOptions(false);
  };

  const handleDelete = () => {
    if (conversationId) {
      deleteConversation(conversationId);
      router.push('/');
    }
  };

  const handleTitleSave = () => {
    if (titleInput.trim() && conversationId) {
      updateConversationTitle(conversationId, titleInput.trim());
    }
    setEditingTitle(false);
  };

  const startEditingTitle = () => {
    setTitleInput(conversation?.title || '');
    setEditingTitle(true);
    setShowOptions(false);
  };

  if (!conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <p className="text-[var(--text-muted)]">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-[var(--border-primary)]">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="btn btn-ghost btn-icon"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {editingTitle ? (
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                className="input max-w-[200px]"
                autoFocus
              />
            ) : (
              <h1 className="font-semibold text-[var(--text-primary)] truncate max-w-[200px] md:max-w-none">
                {conversation.title}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Model Picker */}
            <div className="relative">
              <button
                onClick={() => setShowModelPicker(!showModelPicker)}
                className="btn btn-ghost btn-sm flex items-center gap-2"
              >
                <div className={`model-badge ${selectedModel === 'auto' ? 'model-auto' : `model-${selectedModel}`}`}>
                  {selectedModel === 'auto' ? (
                    <>
                      <Zap className="w-3 h-3" />
                      Auto
                    </>
                  ) : (
                    <>
                      {(() => {
                        const Icon = modelIcons[selectedModel];
                        return <Icon className="w-3 h-3" />;
                      })()}
                      {MODELS[selectedModel]?.name}
                    </>
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
              </button>

              {showModelPicker && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowModelPicker(false)}
                  />
                  <div className="dropdown-menu z-50">
                    <button
                      onClick={() => {
                        setSelectedModel('auto');
                        setShowModelPicker(false);
                      }}
                      className={`dropdown-item ${selectedModel === 'auto' ? 'bg-[var(--bg-tertiary)]' : ''}`}
                    >
                      <Zap className="w-4 h-4 text-indigo-500" />
                      <div className="flex-1">
                        <p className="font-medium text-[var(--text-primary)]">Auto</p>
                        <p className="text-xs text-[var(--text-muted)]">Smart routing</p>
                      </div>
                      {selectedModel === 'auto' && <Check className="w-4 h-4 text-indigo-500" />}
                    </button>
                    <div className="dropdown-divider" />
                    {Object.values(MODELS).map((model) => {
                      const Icon = modelIcons[model.id];
                      return (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedModel(model.id);
                            setShowModelPicker(false);
                          }}
                          className={`dropdown-item ${selectedModel === model.id ? 'bg-[var(--bg-tertiary)]' : ''}`}
                        >
                          <Icon className="w-4 h-4 text-[var(--text-muted)]" />
                          <div className="flex-1">
                            <p className="font-medium text-[var(--text-primary)]">{model.name}</p>
                            <p className="text-xs text-[var(--text-muted)]">{model.description}</p>
                          </div>
                          {selectedModel === model.id && (
                            <Check className="w-4 h-4 text-[var(--brand-primary)]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Options Menu */}
            <div className="relative">
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="btn btn-ghost btn-icon"
                aria-label="Options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {showOptions && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowOptions(false)}
                  />
                  <div className="dropdown-menu z-50">
                    <button onClick={startEditingTitle} className="dropdown-item">
                      <Edit3 className="w-4 h-4" />
                      <span>Rename</span>
                    </button>
                    <button onClick={handleShare} className="dropdown-item">
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </button>
                    <div className="dropdown-divider" />
                    <button
                      onClick={handleDelete}
                      className="dropdown-item text-[var(--error)]"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {conversation.messages.length === 0 ? (
            <div className="text-center py-20">
              <div className="hime-avatar mx-auto mb-6">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                Start a conversation
              </h2>
              <p className="text-[var(--text-secondary)]">
                Ask me anything - I&apos;m here to help!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {conversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`message ${
                      message.role === 'user' ? 'message-user' : 'message-assistant'
                    }`}
                  >
                    {/* Model badge for assistant */}
                    {message.role === 'assistant' && message.model && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`model-badge model-${message.model}`}>
                          {(() => {
                            const Icon = modelIcons[message.model];
                            return <Icon className="w-3 h-3" />;
                          })()}
                          {MODELS[message.model]?.name}
                        </div>
                        {message.routingReason && (
                          <span className="text-xs text-[var(--text-muted)]">
                            {message.routingReason}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="whitespace-pre-wrap">{message.content}</div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--border-primary)] border-opacity-20">
                      <span className="text-xs opacity-70">
                        {formatRelativeTime(new Date(message.timestamp))}
                      </span>
                      {message.role === 'assistant' && (
                        <button
                          onClick={() => handleCopyMessage(message.content, message.id)}
                          className="opacity-70 hover:opacity-100 transition-opacity"
                          title="Copy message"
                        >
                          {copiedId === message.id ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isGenerating && (
                <div className="flex justify-start">
                  <div className="message message-assistant">
                    <div className="typing-indicator">
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Input */}
      <footer className="sticky bottom-0 glass border-t border-[var(--border-primary)] p-4 pb-safe">
        <div className="max-w-4xl mx-auto">
          <div className="chat-input-wrapper p-2">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                rows={1}
                disabled={isGenerating}
                className="flex-1 resize-none bg-transparent border-none outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] p-3 text-base leading-relaxed max-h-32 overflow-y-auto disabled:opacity-50"
                style={{ minHeight: '44px' }}
              />
              {isGenerating ? (
                <button
                  onClick={stopGenerating}
                  className="btn btn-secondary btn-icon mb-1 mr-1"
                  title="Stop generating"
                >
                  <Square className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!inputValue.trim()}
                  className="btn btn-primary btn-icon mb-1 mr-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
