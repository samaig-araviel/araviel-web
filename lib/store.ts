import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { generateId, generateConversationTitle } from './utils';
import { DEFAULT_USER, DEFAULT_PROJECTS } from './constants';
import type {
  Theme,
  User,
  Conversation,
  Message,
  Model,
  ModelSelection,
  Project,
} from '@/types';

// ===== TYPES =====
interface AppState {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // User
  user: User;
  updateUser: (updates: Partial<User>) => void;

  // XP and Streak
  addXP: (amount: number) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  lastActiveDate: string | null;
  checkAndUpdateStreak: () => void;

  // UI State
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  // Projects
  projects: Project[];
  createProject: (name: string, color: string) => string;
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
}

// ===== MOCK AI RESPONSE =====
const generateMockResponse = (userMessage: string, model: Model): string => {
  const responses: Record<string, string[]> = {
    claude: [
      `I understand you're asking about "${userMessage.slice(0, 30)}${userMessage.length > 30 ? '...' : ''}"

Here's my thoughtful analysis:

**Key Points:**

1. This is an interesting topic that deserves careful consideration.

2. There are multiple perspectives to consider here.

3. I'd recommend approaching this methodically.

Would you like me to elaborate on any of these points?`,
    ],
    gpt4: [
      `Here's my analysis:

\`\`\`javascript
// Example approach
function solution() {
  // Step 1: Understand the problem
  // Step 2: Break it down
  // Step 3: Implement
  return "Result";
}
\`\`\`

**Key insight:** Understanding the problem is half the solution.

Let me break this down:
- First, identify the core issue
- Then, develop a systematic approach
- Finally, implement and verify

Shall I clarify anything?`,
    ],
    gemini: [
      `Based on my research:

**Overview:** Your question about "${userMessage.slice(0, 20)}${userMessage.length > 20 ? '...' : ''}" is quite interesting.

**Key Facts:**
- Multiple approaches exist for this
- The best method depends on your context
- Recent developments suggest new solutions

Would you like more details on any aspect?`,
    ],
  };

  const modelResponses = responses[model] || responses.claude;
  return modelResponses[Math.floor(Math.random() * modelResponses.length)];
};

// ===== STORE =====
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Theme
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      // User
      user: DEFAULT_USER,
      updateUser: (updates) =>
        set((state) => ({
          user: { ...state.user, ...updates },
        })),

      // XP and Streak
      lastActiveDate: null,
      addXP: (amount) =>
        set((state) => ({
          user: { ...state.user, xp: state.user.xp + amount },
        })),
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
          return;
        }

        if (lastActive === today) {
          return;
        }

        const lastDate = new Date(lastActive);
        const todayDate = new Date(today);
        const diffDays = Math.floor(
          (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 1) {
          state.incrementStreak();
        } else if (diffDays > 1) {
          state.resetStreak();
        }

        set({ lastActiveDate: today });
      },

      // UI State
      sidebarOpen: true,
      sidebarCollapsed: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // Projects
      projects: DEFAULT_PROJECTS.map((p) => ({
        ...p,
        conversationIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      createProject: (name, color) => {
        const id = generateId();
        const newProject: Project = {
          id,
          name,
          color,
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

      // Conversations
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

      // Chat
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

      // Helpers
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

        // Award XP for sending a message
        state.addXP(5);
        state.checkAndUpdateStreak();

        // Set generating state
        set({ isGenerating: true });

        // Determine model to use
        let model: Model;
        if (state.selectedModel === 'auto') {
          if (content.toLowerCase().includes('code') || content.includes('```')) {
            model = 'gpt4';
          } else if (
            content.toLowerCase().includes('research') ||
            content.toLowerCase().includes('fact') ||
            content.toLowerCase().includes('what is')
          ) {
            model = 'gemini';
          } else {
            model = 'claude';
          }
        } else {
          model = state.selectedModel;
        }

        // Simulate API delay
        await new Promise((resolve) =>
          setTimeout(resolve, 1200 + Math.random() * 800)
        );

        // Check if still generating
        if (!get().isGenerating) return;

        // Routing reasons
        const routingReasons: Record<Model, string> = {
          claude: 'Best for thoughtful analysis and writing',
          gpt4: 'Optimal for code and complex reasoning',
          gemini: 'Great for research and factual information',
        };

        // Add AI response
        state.addMessage(conversationId, {
          role: 'assistant',
          content: generateMockResponse(content, model),
          model,
          routingReason: routingReasons[model],
        });

        // Award XP for completing a conversation turn
        state.addXP(10);

        set({ isGenerating: false });
      },

      stopGenerating: () => {
        set({ isGenerating: false });
      },
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
      },
    }
  )
);

// ===== SELECTORS =====
export const selectTheme = (state: AppState) => state.theme;
export const selectUser = (state: AppState) => state.user;
export const selectConversations = (state: AppState) => state.conversations;
export const selectProjects = (state: AppState) => state.projects;
export const selectActiveConversationId = (state: AppState) =>
  state.activeConversationId;
export const selectActiveConversation = (state: AppState) =>
  state.conversations.find((c) => c.id === state.activeConversationId) || null;
export const selectSelectedModel = (state: AppState) => state.selectedModel;
export const selectIsGenerating = (state: AppState) => state.isGenerating;
export const selectSidebarCollapsed = (state: AppState) => state.sidebarCollapsed;
