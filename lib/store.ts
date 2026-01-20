import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { generateId, generateConversationTitle, calculateLevel, routeMessage } from './utils';
import { DEFAULT_USER, DEFAULT_PROJECTS, LEVELS, XP_REWARDS } from './constants';
import type {
  Theme,
  User,
  Conversation,
  Message,
  Model,
  ModelSelection,
  Project,
  Notification,
} from '@/types';

// ============================================
// APP STATE INTERFACE
// ============================================

interface AppState {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // User & Gamification
  user: User;
  updateUser: (updates: Partial<User>) => void;
  addXP: (amount: number) => void;
  checkLevelUp: () => boolean;
  incrementStreak: () => void;
  resetStreak: () => void;
  lastActiveDate: string | null;
  checkAndUpdateStreak: () => void;
  unlockAchievement: (achievementId: string) => void;

  // UI State
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;

  // Projects
  projects: Project[];
  createProject: (name: string, color: string, icon?: string) => string;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addConversationToProject: (conversationId: string, projectId: string) => void;
  removeConversationFromProject: (conversationId: string) => void;

  // Conversations
  conversations: Conversation[];
  activeConversationId: string | null;
  createConversation: (projectId?: string) => string;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string | null) => void;
  updateConversationTitle: (id: string, title: string) => void;
  pinConversation: (id: string) => void;
  unpinConversation: (id: string) => void;

  // Chat
  selectedModel: ModelSelection;
  setSelectedModel: (model: ModelSelection) => void;
  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;

  // Active conversation helpers
  getActiveConversation: () => Conversation | null;
  sendMessage: (content: string) => Promise<void>;
  stopGenerating: () => void;

  // Input state
  inputValue: string;
  setInputValue: (value: string) => void;
}

// ============================================
// MOCK AI RESPONSES
// ============================================

const generateMockResponse = (userMessage: string, model: Model): string => {
  const responses: Record<Model, string[]> = {
    claude: [
      `I've carefully considered your question about "${userMessage.slice(0, 40)}${userMessage.length > 40 ? '...' : ''}"

**My Analysis:**

This is a thoughtful topic that deserves a nuanced approach. Let me break it down:

1. **Understanding the Context** - First, it's important to consider the broader picture and what you're really trying to achieve.

2. **Key Considerations** - There are several factors at play here that could influence the best path forward.

3. **My Recommendation** - Based on my analysis, I'd suggest approaching this methodically and considering multiple perspectives.

Would you like me to explore any of these points in more depth? I'm happy to dive deeper into the specifics.`,
    ],
    gpt4: [
      `Here's a solution for your request:

\`\`\`typescript
// Optimized implementation
interface Solution {
  approach: string;
  implementation: () => void;
}

const solve = (input: string): Solution => {
  // Step 1: Parse and validate
  const validated = validateInput(input);

  // Step 2: Process
  const result = processData(validated);

  // Step 3: Return formatted result
  return {
    approach: 'systematic',
    implementation: () => console.log(result)
  };
};

// Execute
solve('${userMessage.slice(0, 20)}...');
\`\`\`

**Key Points:**
- This approach ensures type safety and maintainability
- The modular structure allows for easy testing
- Performance is optimized for your use case

Want me to explain any part in more detail or modify the implementation?`,
    ],
    gemini: [
      `Based on my research on "${userMessage.slice(0, 30)}${userMessage.length > 30 ? '...' : ''}":

**Overview**
This is a fascinating topic with several important aspects to consider.

**Key Facts:**
- There are multiple approaches documented in current research
- The most effective methods depend on your specific context
- Recent developments have introduced new possibilities

**Detailed Analysis:**

| Aspect | Finding | Relevance |
|--------|---------|-----------|
| Primary | Well-documented | High |
| Secondary | Emerging | Medium |
| Tertiary | Experimental | Low |

**Conclusion:**
Based on the available evidence, I'd recommend focusing on the primary aspects first, then exploring secondary options as needed.

Would you like me to research any specific aspect in more detail?`,
    ],
  };

  const modelResponses = responses[model];
  return modelResponses[Math.floor(Math.random() * modelResponses.length)];
};

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ===== THEME =====
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      // ===== USER & GAMIFICATION =====
      user: DEFAULT_USER,
      updateUser: (updates) =>
        set((state) => ({
          user: { ...state.user, ...updates },
        })),

      addXP: (amount) => {
        set((state) => {
          const newXP = state.user.xp + amount;
          const newLevel = calculateLevel(newXP);
          const leveledUp = newLevel > state.user.level;

          if (leveledUp) {
            const levelInfo = LEVELS.find((l) => l.level === newLevel);
            state.addNotification({
              type: 'achievement',
              title: 'Level Up!',
              message: `You've reached Level ${newLevel}: ${levelInfo?.name || 'Unknown'}`,
              duration: 5000,
            });
          }

          return {
            user: {
              ...state.user,
              xp: newXP,
              level: newLevel,
            },
          };
        });
      },

      checkLevelUp: () => {
        const state = get();
        const newLevel = calculateLevel(state.user.xp);
        return newLevel > state.user.level;
      },

      lastActiveDate: null,
      incrementStreak: () =>
        set((state) => ({
          user: { ...state.user, streak: state.user.streak + 1 },
        })),
      resetStreak: () =>
        set((state) => ({
          user: { ...state.user, streak: 1 },
        })),

      checkAndUpdateStreak: () => {
        const state = get();
        const today = new Date().toDateString();
        const lastActive = state.lastActiveDate;

        if (!lastActive) {
          set({ lastActiveDate: today });
          state.addXP(XP_REWARDS.DAILY_LOGIN);
          return;
        }

        if (lastActive === today) return;

        const lastDate = new Date(lastActive);
        const todayDate = new Date(today);
        const diffDays = Math.floor(
          (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 1) {
          state.incrementStreak();
          state.addXP(XP_REWARDS.DAILY_LOGIN + XP_REWARDS.STREAK_BONUS * state.user.streak);
        } else if (diffDays > 1) {
          state.resetStreak();
          state.addXP(XP_REWARDS.DAILY_LOGIN);
        }

        set({ lastActiveDate: today });
      },

      unlockAchievement: (achievementId) =>
        set((state) => {
          if (state.user.achievements.includes(achievementId)) return state;
          return {
            user: {
              ...state.user,
              achievements: [...state.user.achievements, achievementId],
            },
          };
        }),

      // ===== UI STATE =====
      sidebarOpen: true,
      sidebarCollapsed: false,
      mobileMenuOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // ===== NOTIFICATIONS =====
      notifications: [],
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            ...state.notifications,
            { ...notification, id: generateId() },
          ],
        })),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      // ===== PROJECTS =====
      projects: DEFAULT_PROJECTS.map((p) => ({
        ...p,
        conversationIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      })),

      createProject: (name, color, icon = 'Folder') => {
        const id = generateId();
        const newProject: Project = {
          id,
          name,
          color,
          icon,
          conversationIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({
          projects: [...state.projects, newProject],
        }));
        return id;
      },

      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
          ),
        })),

      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          conversations: state.conversations.map((c) =>
            c.projectId === id ? { ...c, projectId: undefined } : c
          ),
        })),

      addConversationToProject: (conversationId, projectId) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  conversationIds: [...p.conversationIds, conversationId],
                  updatedAt: new Date(),
                }
              : p
          ),
          conversations: state.conversations.map((c) =>
            c.id === conversationId ? { ...c, projectId } : c
          ),
        })),

      removeConversationFromProject: (conversationId) =>
        set((state) => ({
          projects: state.projects.map((p) => ({
            ...p,
            conversationIds: p.conversationIds.filter((id) => id !== conversationId),
          })),
          conversations: state.conversations.map((c) =>
            c.id === conversationId ? { ...c, projectId: undefined } : c
          ),
        })),

      // ===== CONVERSATIONS =====
      conversations: [],
      activeConversationId: null,

      createConversation: (projectId?: string) => {
        const id = generateId();
        const newConversation: Conversation = {
          id,
          title: 'New conversation',
          messages: [],
          projectId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => {
          const updatedProjects = projectId
            ? state.projects.map((p) =>
                p.id === projectId
                  ? {
                      ...p,
                      conversationIds: [...p.conversationIds, id],
                      updatedAt: new Date(),
                    }
                  : p
              )
            : state.projects;

          // Check for first-chat achievement
          if (state.conversations.length === 0) {
            state.unlockAchievement('first-chat');
            state.addXP(25);
          }

          return {
            conversations: [newConversation, ...state.conversations],
            activeConversationId: id,
            projects: updatedProjects,
          };
        });

        return id;
      },

      deleteConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          projects: state.projects.map((p) => ({
            ...p,
            conversationIds: p.conversationIds.filter((cId) => cId !== id),
          })),
          activeConversationId:
            state.activeConversationId === id
              ? state.conversations.find((c) => c.id !== id)?.id || null
              : state.activeConversationId,
        })),

      setActiveConversation: (id) => set({ activeConversationId: id }),

      updateConversationTitle: (id, title) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title, updatedAt: new Date() } : c
          ),
        })),

      pinConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, isPinned: true, updatedAt: new Date() } : c
          ),
        })),

      unpinConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, isPinned: false, updatedAt: new Date() } : c
          ),
        })),

      // ===== CHAT =====
      selectedModel: 'auto',
      setSelectedModel: (model) => set({ selectedModel: model }),

      isGenerating: false,
      setIsGenerating: (generating) => set({ isGenerating: generating }),

      addMessage: (conversationId, message) =>
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== conversationId) return c;

            const newMessage: Message = {
              ...message,
              id: generateId(),
              timestamp: new Date(),
            };

            const shouldUpdateTitle =
              c.title === 'New conversation' &&
              message.role === 'user' &&
              c.messages.length === 0;

            return {
              ...c,
              messages: [...c.messages, newMessage],
              title: shouldUpdateTitle
                ? generateConversationTitle(message.content)
                : c.title,
              updatedAt: new Date(),
            };
          }),
        })),

      updateMessage: (conversationId, messageId, updates) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === messageId ? { ...m, ...updates } : m
                  ),
                  updatedAt: new Date(),
                }
              : c
          ),
        })),

      // ===== HELPERS =====
      getActiveConversation: () => {
        const state = get();
        return (
          state.conversations.find((c) => c.id === state.activeConversationId) ||
          null
        );
      },

      sendMessage: async (content) => {
        const state = get();
        let conversationId = state.activeConversationId;

        if (!conversationId) {
          conversationId = state.createConversation();
        }

        // Add user message
        state.addMessage(conversationId, {
          role: 'user',
          content,
        });

        // Award XP
        state.addXP(XP_REWARDS.MESSAGE_SENT);
        state.checkAndUpdateStreak();

        // Update total messages
        set((state) => ({
          user: {
            ...state.user,
            totalMessages: state.user.totalMessages + 1,
          },
        }));

        set({ isGenerating: true, inputValue: '' });

        // Determine model with auto-routing
        const { model, reason } = routeMessage(content, state.selectedModel);

        // Simulate API delay
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 + Math.random() * 1000)
        );

        // Check if still generating
        if (!get().isGenerating) return;

        // Add AI response
        state.addMessage(conversationId, {
          role: 'assistant',
          content: generateMockResponse(content, model),
          model,
          routingReason: reason,
        });

        // Award XP for completion
        state.addXP(XP_REWARDS.CONVERSATION_COMPLETE);

        set({ isGenerating: false });
      },

      stopGenerating: () => {
        set({ isGenerating: false });
      },

      // ===== INPUT STATE =====
      inputValue: '',
      setInputValue: (value) => set({ inputValue: value }),
    }),
    {
      name: 'araviel-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        user: state.user,
        conversations: state.conversations,
        projects: state.projects,
        activeConversationId: state.activeConversationId,
        selectedModel: state.selectedModel,
        sidebarCollapsed: state.sidebarCollapsed,
        lastActiveDate: state.lastActiveDate,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.conversations) {
          state.conversations = state.conversations.map((conv) => ({
            ...conv,
            createdAt: new Date(conv.createdAt),
            updatedAt: new Date(conv.updatedAt),
            messages: conv.messages.map((msg) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          }));
        }
        if (state?.projects) {
          state.projects = state.projects.map((proj) => ({
            ...proj,
            createdAt: new Date(proj.createdAt),
            updatedAt: new Date(proj.updatedAt),
          }));
        }
        if (state?.user?.createdAt) {
          state.user.createdAt = new Date(state.user.createdAt);
        }
        if (state?.user?.lastActiveAt) {
          state.user.lastActiveAt = new Date(state.user.lastActiveAt);
        }
      },
    }
  )
);

// ============================================
// SELECTORS
// ============================================

export const selectTheme = (state: AppState) => state.theme;
export const selectUser = (state: AppState) => state.user;
export const selectConversations = (state: AppState) => state.conversations;
export const selectProjects = (state: AppState) => state.projects;
export const selectActiveConversationId = (state: AppState) => state.activeConversationId;
export const selectActiveConversation = (state: AppState) =>
  state.conversations.find((c) => c.id === state.activeConversationId) || null;
export const selectSelectedModel = (state: AppState) => state.selectedModel;
export const selectIsGenerating = (state: AppState) => state.isGenerating;
export const selectSidebarCollapsed = (state: AppState) => state.sidebarCollapsed;
export const selectNotifications = (state: AppState) => state.notifications;
export const selectInputValue = (state: AppState) => state.inputValue;

// Derived selectors
export const selectPinnedConversations = (state: AppState) =>
  state.conversations.filter((c) => c.isPinned);

export const selectRecentConversations = (state: AppState) =>
  state.conversations
    .filter((c) => !c.isPinned)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 10);

export const selectUserLevel = (state: AppState) => {
  const { xp, level } = state.user;
  const currentLevel = LEVELS.find((l) => l.level === level);
  const nextLevel = LEVELS.find((l) => l.level === level + 1);

  return {
    level,
    name: currentLevel?.name || 'Unknown',
    badge: currentLevel?.badge || 'bronze',
    xp,
    minXp: currentLevel?.minXp || 0,
    maxXp: currentLevel?.maxXp || 100,
    nextLevelXp: nextLevel?.minXp || currentLevel?.maxXp || 100,
    progress: currentLevel
      ? ((xp - currentLevel.minXp) / (currentLevel.maxXp - currentLevel.minXp)) * 100
      : 0,
  };
};
