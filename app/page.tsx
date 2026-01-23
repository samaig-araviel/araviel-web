'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { getGreeting } from '@/lib/utils';
import {
  Plus,
  Home,
  FolderKanban,
  Library,
  Settings,
  MessageSquare,
  User,
  Sun,
  Moon,
  Monitor,
  ArrowUp,
  Code2,
  PenLine,
  ChevronDown,
  Zap,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [greeting, setGreeting] = useState('Hello');
  const [showModelPicker, setShowModelPicker] = useState(false);

  const {
    user,
    theme,
    setTheme,
    conversations,
    inputValue,
    setInputValue,
    sendMessage,
    setActiveConversation,
    createConversation,
    checkAndUpdateStreak,
    selectedModel,
    setSelectedModel,
  } = useAppStore();

  useEffect(() => {
    setMounted(true);
    setGreeting(getGreeting());
    checkAndUpdateStreak();
  }, [checkAndUpdateStreak]);

  // Recent conversations (last 5)
  const recentConversations = conversations
    .slice()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const handleSubmit = useCallback(async () => {
    if (!inputValue.trim()) return;
    await sendMessage(inputValue);
    const { activeConversationId } = useAppStore.getState();
    if (activeConversationId) {
      router.push(`/chat/${activeConversationId}`);
    }
  }, [inputValue, sendMessage, router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleNewChat = () => {
    const id = createConversation();
    router.push(`/chat/${id}`);
  };

  const handleConversationClick = (id: string) => {
    setActiveConversation(id);
    router.push(`/chat/${id}`);
  };

  const handleQuickAction = (type: 'code' | 'write') => {
    if (type === 'code') {
      setInputValue('Help me write code for ');
    } else {
      setInputValue('Help me write ');
    }
  };

  const getModelLabel = () => {
    switch (selectedModel) {
      case 'claude': return 'Claude';
      case 'gpt4': return 'GPT-4';
      case 'gemini': return 'Gemini';
      default: return 'Auto';
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-[var(--bg-primary)]">
      {/* Sidebar */}
      <aside className="w-60 flex flex-col border-r border-[var(--border-primary)] bg-[var(--bg-primary)]">
        {/* Logo */}
        <div className="p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--text-primary)] flex items-center justify-center">
            <span className="text-[var(--bg-primary)] font-bold text-sm">A</span>
          </div>
          <span className="font-semibold text-[var(--text-primary)]">Araviel</span>
        </div>

        {/* New Chat Button */}
        <div className="px-3 mb-2">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-2 py-2 flex-1">
          <button
            onClick={() => router.push('/')}
            className="sidebar-item active w-full"
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </button>
          <button
            onClick={() => router.push('/chats')}
            className="sidebar-item w-full"
          >
            <FolderKanban className="w-5 h-5" />
            <span>Projects</span>
          </button>
          <button
            onClick={() => router.push('/chats')}
            className="sidebar-item w-full"
          >
            <Library className="w-5 h-5" />
            <span>Library</span>
          </button>
          <button
            onClick={() => router.push('/settings')}
            className="sidebar-item w-full"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>

          {/* Recents */}
          {recentConversations.length > 0 && (
            <div className="mt-6">
              <p className="px-4 py-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Recents
              </p>
              {recentConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleConversationClick(conv.id)}
                  className="sidebar-item w-full"
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate text-sm">{conv.title}</span>
                </button>
              ))}
            </div>
          )}
        </nav>

        {/* User Profile */}
        <div className="px-3 py-3 border-t border-[var(--border-primary)]">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
              <User className="w-4 h-4 text-[var(--text-muted)]" />
            </div>
            <span className="text-sm text-[var(--text-primary)]">{user.name}</span>
          </div>
        </div>

        {/* Theme Toggle */}
        <div className="px-3 pb-4">
          <div className="flex items-center justify-center gap-1 p-1 bg-[var(--bg-tertiary)] rounded-lg">
            <button
              onClick={() => {
                setTheme('dark');
                document.documentElement.classList.add('dark');
              }}
              className={`flex-1 flex items-center justify-center p-2 rounded-md transition-all ${
                theme === 'dark' ? 'bg-[var(--bg-elevated)] shadow-sm' : ''
              }`}
              title="Dark mode"
            >
              <MessageSquare className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
            <button
              onClick={() => {
                setTheme('light');
                document.documentElement.classList.remove('dark');
              }}
              className={`flex-1 flex items-center justify-center p-2 rounded-md transition-all ${
                theme === 'light' ? 'bg-[var(--bg-elevated)] shadow-sm' : ''
              }`}
              title="Light mode"
            >
              <Sun className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
            <button
              onClick={() => {
                setTheme('system');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                document.documentElement.classList.toggle('dark', prefersDark);
              }}
              className={`flex-1 flex items-center justify-center p-2 rounded-md transition-all ${
                theme === 'system' ? 'bg-[var(--bg-elevated)] shadow-sm' : ''
              }`}
              title="System theme"
            >
              <Moon className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-2xl">
          {/* Greeting */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-2">
              {greeting}.
            </h1>
            <p className="text-lg text-[var(--text-secondary)]">
              What can I help you orchestrate today?
            </p>
          </div>

          {/* Chat Input */}
          <div className="relative mb-4">
            <div className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-2xl shadow-sm focus-within:border-[var(--border-secondary)] transition-colors">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                rows={1}
                className="w-full resize-none bg-transparent border-none outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] p-4 pb-14 text-base leading-relaxed"
                style={{ minHeight: '80px' }}
              />

              {/* Bottom bar with model selector and submit */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                {/* Model Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowModelPicker(!showModelPicker)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] rounded-full text-sm text-[var(--text-primary)] transition-colors"
                  >
                    {selectedModel === 'auto' && <Zap className="w-3 h-3" />}
                    {getModelLabel()}
                    <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
                  </button>

                  {showModelPicker && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowModelPicker(false)}
                      />
                      <div className="absolute bottom-full left-0 mb-2 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl shadow-lg py-1 min-w-[140px] z-20">
                        {[
                          { value: 'auto', label: 'Auto', icon: Zap },
                          { value: 'claude', label: 'Claude' },
                          { value: 'gpt4', label: 'GPT-4' },
                          { value: 'gemini', label: 'Gemini' },
                        ].map((model) => (
                          <button
                            key={model.value}
                            onClick={() => {
                              setSelectedModel(model.value as 'auto' | 'claude' | 'gpt4' | 'gemini');
                              setShowModelPicker(false);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--bg-tertiary)] transition-colors ${
                              selectedModel === model.value ? 'text-[var(--brand-primary)]' : 'text-[var(--text-primary)]'
                            }`}
                          >
                            {model.icon && <model.icon className="w-3 h-3" />}
                            {model.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={!inputValue.trim()}
                  className="w-8 h-8 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80 transition-opacity"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => handleQuickAction('code')}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-full text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <Code2 className="w-4 h-4" />
              Code
            </button>
            <button
              onClick={() => handleQuickAction('write')}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-full text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <PenLine className="w-4 h-4" />
              Write
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
