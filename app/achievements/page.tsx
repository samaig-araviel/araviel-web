'use client';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { ACHIEVEMENTS, LEVELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Sparkles,
  MessageSquare,
  Trophy,
  Settings,
  Flame,
  Star,
  Lock,
  Check,
  Zap,
  Crown,
  Target,
  Award,
} from 'lucide-react';

// Icon mapping for achievements
const achievementIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageSquare,
  MessageCircle: MessageSquare,
  MessagesSquare: MessageSquare,
  MessageSquarePlus: MessageSquare,
  Flame,
  Zap,
  Trophy,
  Crown,
  Compass: Target,
  FolderPlus: Award,
  Moon: Star,
  Sun: Star,
  Star,
  Sparkles,
  Code2: Zap,
  PenLine: Award,
};

// Rarity colors
const rarityColors = {
  common: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  rare: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  epic: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  legendary: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
};

const rarityLabels = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

export default function AchievementsPage() {
  const router = useRouter();
  const { user, conversations } = useAppStore();

  const currentLevel = LEVELS.find((l) => l.level === user.level) || LEVELS[0];
  const nextLevel = LEVELS.find((l) => l.level === user.level + 1);
  const xpInLevel = user.xp - currentLevel.minXp;
  const xpForLevel = currentLevel.maxXp - currentLevel.minXp;
  const levelProgress = Math.min((xpInLevel / xpForLevel) * 100, 100);

  // Calculate achievement progress
  const getAchievementProgress = (achievementId: string): number => {
    const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
    if (!achievement) return 0;

    switch (achievement.category) {
      case 'conversations':
        return Math.min(conversations.length, achievement.requirement);
      case 'streaks':
        return Math.min(user.streak, achievement.requirement);
      case 'mastery':
        return Math.min(user.level, achievement.requirement);
      default:
        return 0;
    }
  };

  const isAchievementUnlocked = (achievementId: string): boolean => {
    return user.achievements.includes(achievementId);
  };

  // Group achievements by category
  const groupedAchievements = ACHIEVEMENTS.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, typeof ACHIEVEMENTS>);

  const categoryLabels = {
    conversations: 'Conversations',
    streaks: 'Streaks',
    exploration: 'Exploration',
    mastery: 'Mastery',
    special: 'Special',
  };

  const categoryIcons = {
    conversations: MessageSquare,
    streaks: Flame,
    exploration: Target,
    mastery: Star,
    special: Crown,
  };

  const totalAchievements = ACHIEVEMENTS.length;
  const unlockedAchievements = user.achievements.length;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-[var(--border-primary)]">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="btn btn-ghost btn-icon"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Achievements</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-6">
        {/* Level Progress Card */}
        <section className="mb-8">
          <div className="card bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-indigo-500/20">
            <div className="flex items-center gap-6">
              <div className={`level-badge level-${currentLevel.badge} w-16 h-16 text-2xl`}>
                {user.level}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline justify-between mb-2">
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">
                    {currentLevel.name}
                  </h2>
                  <span className="text-sm text-[var(--text-muted)]">
                    {user.xp.toLocaleString()} XP
                  </span>
                </div>
                <div className="xp-bar h-3 mb-2">
                  <div
                    className="xp-bar-fill"
                    style={{ width: `${levelProgress}%` }}
                  />
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  {nextLevel
                    ? `${Math.round(xpForLevel - xpInLevel)} XP to Level ${nextLevel.level}: ${nextLevel.name}`
                    : 'Max level reached!'}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[var(--border-primary)]">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-2xl font-bold text-[var(--text-primary)]">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  {unlockedAchievements}
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  of {totalAchievements} Unlocked
                </p>
              </div>
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
        </section>

        {/* Achievements by Category */}
        {Object.entries(groupedAchievements).map(([category, achievements]) => {
          const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons] || Trophy;
          return (
            <section key={category} className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <CategoryIcon className="w-5 h-5 text-[var(--brand-primary)]" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </h2>
              </div>

              <div className="grid gap-3">
                {achievements.map((achievement) => {
                  const Icon = achievementIcons[achievement.icon] || Trophy;
                  const isUnlocked = isAchievementUnlocked(achievement.id);
                  const progress = getAchievementProgress(achievement.id);
                  const progressPercent = Math.min((progress / achievement.requirement) * 100, 100);

                  return (
                    <div
                      key={achievement.id}
                      className={cn(
                        'achievement-card',
                        isUnlocked ? 'unlocked' : 'locked'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center',
                            isUnlocked
                              ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white'
                              : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                          )}
                        >
                          {isUnlocked ? (
                            <Icon className="w-6 h-6" />
                          ) : (
                            <Lock className="w-5 h-5" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={cn(
                              'font-semibold',
                              isUnlocked ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
                            )}>
                              {achievement.name}
                            </h3>
                            <span className={cn(
                              'text-xs px-2 py-0.5 rounded-full border',
                              rarityColors[achievement.rarity]
                            )}>
                              {rarityLabels[achievement.rarity]}
                            </span>
                          </div>
                          <p className="text-sm text-[var(--text-muted)] mb-2">
                            {achievement.description}
                          </p>
                          {!isUnlocked && (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                              <span className="text-xs text-[var(--text-muted)]">
                                {progress}/{achievement.requirement}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          {isUnlocked ? (
                            <div className="flex items-center gap-1 text-[var(--success)]">
                              <Check className="w-4 h-4" />
                              <span className="text-sm font-medium">Unlocked</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[var(--text-muted)]">
                              <Zap className="w-4 h-4" />
                              <span className="text-sm font-medium">+{achievement.xpReward} XP</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
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
            className="flex flex-col items-center gap-1 p-2 text-[var(--brand-primary)]"
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
