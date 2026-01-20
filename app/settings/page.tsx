'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { MODELS, LEVELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Moon,
  Sun,
  Monitor,
  Shield,
  Download,
  Trash2,
  Sparkles,
  Check,
  Zap,
  Cpu,
  Globe,
  Bell,
  Volume2,
  Palette,
  ChevronRight,
  MessageSquare,
  Trophy,
  Settings,
} from 'lucide-react';
import type { Theme, ModelSelection } from '@/types';

export default function SettingsPage() {
  const router = useRouter();
  const { user, theme, setTheme, updateUser, conversations } = useAppStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const currentLevel = LEVELS.find((l) => l.level === user.level) || LEVELS[0];

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDark);
    }
  };

  const handleToggle = (key: 'autoRouting' | 'soundEffects' | 'animations') => {
    updateUser({
      preferences: {
        ...user.preferences,
        [key]: !user.preferences[key],
      },
    });
  };

  const handleDefaultModelChange = (model: ModelSelection) => {
    updateUser({
      preferences: {
        ...user.preferences,
        defaultModel: model,
      },
    });
  };

  const handleExportData = () => {
    const data = {
      user: {
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        xp: user.xp,
        streak: user.streak,
        level: user.level,
        achievements: user.achievements,
      },
      conversations: conversations.map((c) => ({
        title: c.title,
        messages: c.messages.map((m) => ({
          role: m.role,
          content: m.content,
          model: m.model,
          timestamp: m.timestamp,
        })),
        createdAt: c.createdAt,
      })),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `araviel-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    localStorage.removeItem('araviel-storage');
    window.location.href = '/';
  };

  const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  const modelOptions: { value: ModelSelection; label: string; description: string; icon: typeof Zap }[] = [
    { value: 'auto', label: 'Auto', description: 'Smart routing', icon: Zap },
    { value: 'claude', label: 'Claude', description: 'Writing & analysis', icon: Sparkles },
    { value: 'gpt4', label: 'GPT-4', description: 'Code & reasoning', icon: Cpu },
    { value: 'gemini', label: 'Gemini', description: 'Research & facts', icon: Globe },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-[var(--border-primary)]">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="btn btn-ghost btn-icon"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Settings</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
        {/* Profile Section */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4">
            Profile
          </h2>
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-[var(--text-primary)]">{user.name}</div>
                <div className="text-sm text-[var(--text-muted)]">{user.email}</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`level-badge level-${currentLevel.badge} w-6 h-6 text-xs`}>
                    {user.level}
                  </div>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {currentLevel.name} · {user.xp.toLocaleString()} XP
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4">
            Appearance
          </h2>
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <Palette className="w-4 h-4 text-[var(--brand-primary)]" />
              <span className="font-medium text-[var(--text-primary)]">Theme</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = theme === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleThemeChange(option.value)}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-xl border p-4 transition-all',
                      isSelected
                        ? 'border-[var(--brand-primary)] bg-[rgba(99,102,241,0.1)]'
                        : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)] hover:bg-[var(--bg-tertiary)]'
                    )}
                  >
                    <Icon className={cn('w-5 h-5', isSelected ? 'text-[var(--brand-primary)]' : 'text-[var(--text-muted)]')} />
                    <span className={cn('text-sm', isSelected ? 'text-[var(--brand-primary)] font-medium' : 'text-[var(--text-secondary)]')}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* AI Preferences Section */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4">
            AI Preferences
          </h2>
          <div className="space-y-4">
            {/* Default Model */}
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-4 h-4 text-[var(--brand-primary)]" />
                <span className="font-medium text-[var(--text-primary)]">Default Model</span>
              </div>
              <div className="space-y-2">
                {modelOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = user.preferences.defaultModel === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleDefaultModelChange(option.value)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl border p-4 transition-all',
                        isSelected
                          ? 'border-[var(--brand-primary)] bg-[rgba(99,102,241,0.1)]'
                          : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)] hover:bg-[var(--bg-tertiary)]'
                      )}
                    >
                      <Icon className={cn('w-5 h-5', isSelected ? 'text-[var(--brand-primary)]' : 'text-[var(--text-muted)]')} />
                      <div className="flex-1 text-left">
                        <div className={cn('font-medium', isSelected ? 'text-[var(--brand-primary)]' : 'text-[var(--text-primary)]')}>
                          {option.label}
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">{option.description}</div>
                      </div>
                      {isSelected && <Check className="w-5 h-5 text-[var(--brand-primary)]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Auto Routing Toggle */}
            <div className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center">
                    <Zap className="w-5 h-5 text-[var(--brand-primary)]" />
                  </div>
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">Smart Routing</div>
                    <div className="text-xs text-[var(--text-muted)]">Auto-select best AI for your query</div>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('autoRouting')}
                  className={cn(
                    'relative w-12 h-7 rounded-full transition-colors',
                    user.preferences.autoRouting ? 'bg-[var(--brand-primary)]' : 'bg-[var(--border-secondary)]'
                  )}
                >
                  <span
                    className={cn(
                      'absolute left-1 top-1 w-5 h-5 rounded-full bg-white transition-transform shadow-sm',
                      user.preferences.autoRouting && 'translate-x-5'
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Preferences Section */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4">
            Preferences
          </h2>
          <div className="space-y-3">
            {/* Sound Effects */}
            <div className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center">
                    <Volume2 className="w-5 h-5 text-[var(--text-muted)]" />
                  </div>
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">Sound Effects</div>
                    <div className="text-xs text-[var(--text-muted)]">Play sounds for actions</div>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('soundEffects')}
                  className={cn(
                    'relative w-12 h-7 rounded-full transition-colors',
                    user.preferences.soundEffects ? 'bg-[var(--brand-primary)]' : 'bg-[var(--border-secondary)]'
                  )}
                >
                  <span
                    className={cn(
                      'absolute left-1 top-1 w-5 h-5 rounded-full bg-white transition-transform shadow-sm',
                      user.preferences.soundEffects && 'translate-x-5'
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Animations */}
            <div className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-[var(--text-muted)]" />
                  </div>
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">Animations</div>
                    <div className="text-xs text-[var(--text-muted)]">Enable UI animations</div>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('animations')}
                  className={cn(
                    'relative w-12 h-7 rounded-full transition-colors',
                    user.preferences.animations ? 'bg-[var(--brand-primary)]' : 'bg-[var(--border-secondary)]'
                  )}
                >
                  <span
                    className={cn(
                      'absolute left-1 top-1 w-5 h-5 rounded-full bg-white transition-transform shadow-sm',
                      user.preferences.animations && 'translate-x-5'
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Data Section */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4">
            Data
          </h2>
          <div className="space-y-3">
            <button
              onClick={handleExportData}
              className="w-full card card-interactive flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center">
                <Download className="w-5 h-5 text-[var(--text-muted)]" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-[var(--text-primary)]">Export Data</div>
                <div className="text-xs text-[var(--text-muted)]">Download all your data</div>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--text-muted)]" />
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full card flex items-center gap-3 border-[var(--error-soft)] bg-[var(--error-soft)] hover:bg-[rgba(239,68,68,0.15)]"
            >
              <div className="w-10 h-10 rounded-xl bg-[rgba(239,68,68,0.1)] flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-[var(--error)]" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-[var(--error)]">Clear All Data</div>
                <div className="text-xs text-[var(--text-muted)]">Delete everything and start fresh</div>
              </div>
            </button>
          </div>
        </section>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                Clear All Data?
              </h3>
              <p className="text-[var(--text-secondary)] mb-6">
                This will permanently delete all your conversations, settings, and progress. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearData}
                  className="btn flex-1 bg-[var(--error)] text-white hover:opacity-90"
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden glass border-t border-[var(--border-primary)] pb-safe">
        <div className="flex items-center justify-around h-16">
          <button
            onClick={() => router.push('/')}
            className="flex flex-col items-center gap-1 p-2 text-[var(--text-muted)]"
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
            className="flex flex-col items-center gap-1 p-2 text-[var(--brand-primary)]"
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
