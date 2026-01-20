'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { getGreeting } from '@/lib/utils';
import { QUICK_ACTIONS, DAILY_PROMPTS, LEVELS } from '@/lib/constants';
import {
  Sparkles,
  Send,
  PenLine,
  Lightbulb,
  Code2,
  Search,
  BarChart3,
  GraduationCap,
  Flame,
  Zap,
  ChevronRight,
  MessageSquare,
  Sun,
  Moon,
  Settings,
  Trophy,
} from 'lucide-react';

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  PenLine,
  Lightbulb,
  Code2,
  Search,
  BarChart3,
  GraduationCap,
};

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [greeting, setGreeting] = useState('Hello');

  const {
    user,
    theme,
    setTheme,
    conversations,
    inputValue,
    setInputValue,
    sendMessage,
    setActiveConversation,
    checkAndUpdateStreak,
  } = useAppStore();

  // Mount and greeting
  useEffect(() => {
    setMounted(true);
    setGreeting(getGreeting());
    checkAndUpdateStreak();
  }, [checkAndUpdateStreak]);

  // Calculate level info
  const currentLevel = LEVELS.find((l) => l.level === user.level) || LEVELS[0];
  const xpInLevel = user.xp - currentLevel.minXp;
  const xpForLevel = currentLevel.maxXp - currentLevel.minXp;
  const levelProgress = Math.min((xpInLevel / xpForLevel) * 100, 100);

  // Get daily prompt
  const dailyPrompt = DAILY_PROMPTS[new Date().getDate() % DAILY_PROMPTS.length];

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

  const handleQuickAction = (promptStarter: string) => {
    setInputValue(promptStarter);
  };

  const handleConversationClick = (id: string) => {
    setActiveConversation(id);
    router.push(`/chat/${id}`);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
    document.documentElement.classList.toggle('dark', theme !== 'dark');
  };

  if (!mounted) return null;

  return (
    <div className="welcome-bg min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 glass border-b border-[var(--border-primary)]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-[var(--text-primary)]">Araviel</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Streak Badge */}
            {user.streak > 0 && (
              <div className="streak-badge">
                <Flame className="w-4 h-4" />
                <span>{user.streak}</span>
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="btn btn-ghost btn-icon"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* Settings */}
            <button
              onClick={() => router.push('/settings')}
              className="btn btn-ghost btn-icon"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* User Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Hime Welcome Section */}
          <section className="text-center mb-12 animate-fade-in-up">
            {/* Hime Avatar */}
            <div className="flex justify-center mb-6">
              <div className="hime-avatar animate-pulse-glow">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
            </div>

            {/* Greeting */}
            <h1 className="text-4xl md:text-5xl font-bold mb-3 text-[var(--text-primary)]">
              {greeting}, <span className="gradient-text">{user.name}</span>
            </h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-md mx-auto">
              I&apos;m Araviel, your intelligent AI companion. How can I help you today?
            </p>
          </section>

          {/* Main Chat Input */}
          <section className="mb-10 animate-fade-in-up stagger-2">
            <div className="chat-input-wrapper p-2">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything..."
                    rows={1}
                    className="w-full resize-none bg-transparent border-none outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] p-4 pr-12 text-base leading-relaxed max-h-40 overflow-y-auto"
                    style={{ minHeight: '56px' }}
                  />
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={!inputValue.trim()}
                  className="btn btn-primary btn-icon mb-2 mr-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              {/* Model Indicator */}
              <div className="flex items-center gap-2 px-4 pb-3 pt-1 border-t border-[var(--border-primary)] mt-2">
                <div className="model-badge model-auto text-xs">
                  <Zap className="w-3 h-3" />
                  Auto
                </div>
                <span className="text-xs text-[var(--text-muted)]">
                  Smart routing enabled - I&apos;ll pick the best AI for your question
                </span>
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="mb-10 animate-fade-in-up stagger-3">
            <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
              Quick Actions
            </h2>
            <div className="quick-actions-grid">
              {QUICK_ACTIONS.map((action, index) => {
                const Icon = iconMap[action.icon] || Sparkles;
                return (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action.promptStarter)}
                    className="quick-action-card"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="quick-action-icon">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="font-medium text-[var(--text-primary)]">{action.label}</span>
                    <span className="text-xs text-[var(--text-muted)]">{action.description}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Two Column Layout */}
          <div className="grid md:grid-cols-2 gap-6 animate-fade-in-up stagger-4">
            {/* Recent Conversations */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Recent Chats
                </h2>
                {conversations.length > 0 && (
                  <button
                    onClick={() => router.push('/chats')}
                    className="text-xs text-[var(--brand-primary)] hover:underline flex items-center gap-1"
                  >
                    View all <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {recentConversations.length > 0 ? (
                <div className="space-y-2">
                  {recentConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleConversationClick(conv.id)}
                      className="w-full card card-interactive p-4 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-muted)]">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[var(--text-primary)] truncate">
                            {conv.title}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {conv.messages.length} messages
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="card p-8 text-center">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 text-[var(--text-muted)]" />
                  <p className="text-[var(--text-secondary)]">No conversations yet</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    Start chatting to see your history here
                  </p>
                </div>
              )}
            </section>

            {/* Stats & Daily Prompt */}
            <section className="space-y-6">
              {/* User Stats Card */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Your Progress
                  </h2>
                  <button
                    onClick={() => router.push('/achievements')}
                    className="text-xs text-[var(--brand-primary)] hover:underline flex items-center gap-1"
                  >
                    <Trophy className="w-3 h-3" /> Achievements
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className={`level-badge level-${currentLevel.badge}`}>
                    {user.level}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="font-semibold text-[var(--text-primary)]">
                        {currentLevel.name}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {user.xp.toLocaleString()} XP
                      </span>
                    </div>
                    <div className="xp-bar">
                      <div
                        className="xp-bar-fill"
                        style={{ width: `${levelProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {Math.round(xpForLevel - xpInLevel)} XP to next level
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border-primary)]">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-2xl font-bold text-[var(--text-primary)]">
                      <Flame className="w-5 h-5 text-orange-500" />
                      {user.streak}
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">Day Streak</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--text-primary)]">
                      {user.totalMessages}
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">Messages</p>
                  </div>
                </div>
              </div>

              {/* Daily Prompt Card */}
              <div className="card bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-indigo-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-[var(--brand-primary)]" />
                  <span className="text-sm font-semibold text-[var(--text-secondary)]">
                    Prompt of the Day
                  </span>
                </div>
                <p className="text-[var(--text-primary)] mb-4">{dailyPrompt}</p>
                <button
                  onClick={() => {
                    setInputValue(dailyPrompt);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="btn btn-secondary btn-sm w-full"
                >
                  Try this prompt
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden glass border-t border-[var(--border-primary)] pb-safe">
        <div className="flex items-center justify-around h-16">
          <button
            onClick={() => router.push('/')}
            className="flex flex-col items-center gap-1 p-2 text-[var(--brand-primary)]"
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-xs">Home</span>
          </button>
          <button
            onClick={() => router.push('/chats')}
            className="flex flex-col items-center gap-1 p-2 text-[var(--text-muted)]"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs">Chats</span>
          </button>
          <button
            onClick={() => router.push('/achievements')}
            className="flex flex-col items-center gap-1 p-2 text-[var(--text-muted)]"
          >
            <Trophy className="w-5 h-5" />
            <span className="text-xs">Rewards</span>
          </button>
          <button
            onClick={() => router.push('/settings')}
            className="flex flex-col items-center gap-1 p-2 text-[var(--text-muted)]"
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
