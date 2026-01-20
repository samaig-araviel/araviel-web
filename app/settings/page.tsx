'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Moon,
  Sun,
  Monitor,
  Shield,
  Download,
  Trash2,
  User,
  Sparkles,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import type { Theme, ModelSelection } from '@/types';

export default function SettingsPage() {
  const router = useRouter();
  const { user, theme, setTheme, updateUser, conversations } = useAppStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System theme
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDark);
    }
  };

  const handleTrustModeToggle = () => {
    updateUser({
      preferences: {
        ...user.preferences,
        trustMode: !user.preferences.trustMode,
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

  const modelOptions: { value: ModelSelection; label: string; description: string }[] = [
    { value: 'auto', label: 'Auto', description: 'Let Araviel choose the best model' },
    { value: 'claude', label: 'Claude', description: 'Best for writing & analysis' },
    { value: 'gpt4', label: 'GPT-4', description: 'Best for code & reasoning' },
    { value: 'gemini', label: 'Gemini', description: 'Best for research & facts' },
  ];

  return (
    <div className="min-h-screen bg-background-primary pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background-secondary">
        <div className="mx-auto flex max-w-2xl items-center gap-4 px-4 py-4">
          <button
            onClick={() => router.back()}
            className="rounded-lg p-2 text-text-muted transition-colors hover:bg-background-tertiary hover:text-text-primary"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-text-primary">Settings</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        {/* Profile Section */}
        <section className="mb-8">
          <h2 className="mb-4 text-sm font-medium text-text-muted">Profile</h2>
          <div className="rounded-xl border border-border bg-background-secondary p-4">
            <div className="flex items-center gap-4">
              <Avatar
                src={user.avatar}
                alt={user.name}
                fallback={user.name}
                size="lg"
              />
              <div className="flex-1">
                <div className="text-base font-medium text-text-primary">{user.name}</div>
                <div className="text-sm text-text-muted">{user.email}</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded bg-accent-soft px-2 py-0.5 text-xs font-medium capitalize text-accent">
                    {user.plan}
                  </span>
                  <span className="text-xs text-text-muted">
                    {user.xp} XP · {user.streak} day streak
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section className="mb-8">
          <h2 className="mb-4 text-sm font-medium text-text-muted">Appearance</h2>
          <div className="rounded-xl border border-border bg-background-secondary p-4">
            <div className="mb-3 text-sm font-medium text-text-primary">Theme</div>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = theme === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleThemeChange(option.value)}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-lg border p-3 transition-all',
                      isSelected
                        ? 'border-accent bg-accent-soft'
                        : 'border-border-subtle hover:border-border hover:bg-background-tertiary'
                    )}
                  >
                    <Icon className={cn('h-5 w-5', isSelected ? 'text-accent' : 'text-text-muted')} />
                    <span className={cn('text-sm', isSelected ? 'text-accent font-medium' : 'text-text-secondary')}>
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
          <h2 className="mb-4 text-sm font-medium text-text-muted">AI Preferences</h2>
          <div className="space-y-4">
            {/* Default Model */}
            <div className="rounded-xl border border-border bg-background-secondary p-4">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium text-text-primary">Default Model</span>
              </div>
              <div className="space-y-2">
                {modelOptions.map((option) => {
                  const isSelected = user.preferences.defaultModel === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleDefaultModelChange(option.value)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg border p-3 transition-all',
                        isSelected
                          ? 'border-accent bg-accent-soft'
                          : 'border-border-subtle hover:border-border hover:bg-background-tertiary'
                      )}
                    >
                      <div className="text-left">
                        <div className={cn('text-sm font-medium', isSelected ? 'text-accent' : 'text-text-primary')}>
                          {option.label}
                        </div>
                        <div className="text-xs text-text-muted">{option.description}</div>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-accent" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trust Mode */}
            <div className="rounded-xl border border-border bg-background-secondary p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background-tertiary">
                    <Shield className="h-4 w-4 text-text-muted" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text-primary">Trust Mode</div>
                    <div className="text-xs text-text-muted">Allow more autonomous actions</div>
                  </div>
                </div>
                <button
                  onClick={handleTrustModeToggle}
                  className={cn(
                    'relative h-6 w-11 rounded-full transition-colors',
                    user.preferences.trustMode ? 'bg-accent' : 'bg-border'
                  )}
                >
                  <span
                    className={cn(
                      'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm',
                      user.preferences.trustMode && 'translate-x-5'
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Data Section */}
        <section className="mb-8">
          <h2 className="mb-4 text-sm font-medium text-text-muted">Data</h2>
          <div className="space-y-3">
            <button
              onClick={handleExportData}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-background-secondary p-4 transition-colors hover:bg-background-tertiary"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background-tertiary">
                <Download className="h-4 w-4 text-text-muted" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-text-primary">Export Data</div>
                <div className="text-xs text-text-muted">Download all your conversations and settings</div>
              </div>
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex w-full items-center gap-3 rounded-xl border border-error-soft bg-error-soft p-4 transition-colors hover:bg-error/10"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-error/10">
                <Trash2 className="h-4 w-4 text-error" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-error">Clear All Data</div>
                <div className="text-xs text-text-muted">Delete all conversations and reset settings</div>
              </div>
            </button>
          </div>
        </section>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm animate-scale-in rounded-xl border border-border bg-background-secondary p-6 shadow-xl">
              <h3 className="mb-2 text-lg font-semibold text-text-primary">Clear All Data?</h3>
              <p className="mb-6 text-sm text-text-secondary">
                This will permanently delete all your conversations and reset your settings. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={handleClearData}
                >
                  Delete All
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
