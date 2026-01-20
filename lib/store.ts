import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { generateId, generateConversationTitle, storage } from './utils';
import { DEFAULT_USER, STORAGE_KEYS, MODELS } from './constants';
import type {
  Theme,
  User,
  Conversation,
  Message,
  Model,
  ModelSelection,
} from '@/types';

// ===== TYPES =====
interface AppState {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // User
  user: User;
  updateUser: (updates: Partial<User>) => void;

  // UI State
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  // Conversations
  conversations: Conversation[];
  activeConversationId: string | null;
  createConversation: () => string;
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
      `I'd be happy to help with that! Let me analyze your request about "${userMessage.slice(0, 30)}..."

Based on my understanding, here are some key points:

1. **First consideration**: The context of your question suggests you're looking for a thoughtful approach.

2. **Second point**: There are multiple ways to tackle this, and I'll outline the most effective one.

3. **Recommendation**: I suggest starting with the fundamentals and building from there.

Would you like me to elaborate on any of these points?`,
    ],
    gpt4: [
      `Great question! Here's my analysis:

\`\`\`javascript
// Example code snippet
function solution() {
  console.log("Processing your request...");
  return "Result";
}
\`\`\`

The key insight here is that **understanding the problem** is half the solution.

Let me break it down:
- First, we identify the core issue
- Then, we develop a systematic approach
- Finally, we implement and verify

Is there anything specific you'd like me to clarify?`,
    ],
    gemini: [
      `I've researched this topic thoroughly. Here's what I found:

**Overview**: Your question about "${userMessage.slice(0, 20)}..." is quite interesting.

**Key Facts**:
• Research shows multiple approaches exist
• The most effective method depends on your specific context
• Recent studies suggest a balanced approach works best

**Sources**: Based on my analysis of current information.

Would you like more detailed information on any specific aspect?`,
    ],
    perplexity: [
      `Based on real-time search results, here's the latest information:

🔍 **Search Results Summary**:

Your query relates to a topic that has been actively discussed. Here are the most relevant findings:

1. Recent developments suggest new approaches
2. Expert opinions vary, but consensus is emerging
3. Practical applications are becoming more common

**Sources reviewed**: Multiple authoritative sources confirm these findings.

Let me know if you'd like me to search for more specific information!`,
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

      // UI State
      sidebarOpen: true,
      sidebarCollapsed: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // Conversations
      conversations: [],
      activeConversationId: null,

      createConversation: () => {
        const id = generateId();
        const newConversation: Conversation = {
          id,
          title: 'New conversation',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          activeConversationId: id,
        }));

        return id;
      },

      deleteConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
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

            // Auto-generate title from first user message
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

        // Create new conversation if none active
        if (!conversationId) {
          conversationId = state.createConversation();
        }

        // Add user message
        state.addMessage(conversationId, {
          role: 'user',
          content,
        });

        // Set generating state
        set({ isGenerating: true });

        // Determine model to use
        let model: Model;
        if (state.selectedModel === 'auto') {
          // Simple auto-routing logic based on content
          if (content.toLowerCase().includes('code') || content.includes('```')) {
            model = 'gpt4';
          } else if (
            content.toLowerCase().includes('search') ||
            content.toLowerCase().includes('latest') ||
            content.toLowerCase().includes('news')
          ) {
            model = 'perplexity';
          } else if (
            content.toLowerCase().includes('research') ||
            content.toLowerCase().includes('fact')
          ) {
            model = 'gemini';
          } else {
            model = 'claude';
          }
        } else {
          model = state.selectedModel;
        }

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

        // Check if still generating (user might have stopped)
        if (!get().isGenerating) return;

        // Generate routing reason
        const routingReasons: Record<Model, string> = {
          claude: 'Claude excels at thoughtful analysis and writing tasks.',
          gpt4: 'GPT-4 is optimal for code and complex reasoning.',
          gemini: 'Gemini Pro provides accurate research and factual information.',
          perplexity: 'Perplexity offers real-time search capabilities.',
        };

        // Add AI response
        state.addMessage(conversationId, {
          role: 'assistant',
          content: generateMockResponse(content, model),
          model,
          routingReason: routingReasons[model],
        });

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
        activeConversationId: state.activeConversationId,
        selectedModel: state.selectedModel,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
      onRehydrateStorage: () => (state) => {
        // Convert date strings back to Date objects after rehydration
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
      },
    }
  )
);

// ===== SELECTORS =====
export const selectTheme = (state: AppState) => state.theme;
export const selectUser = (state: AppState) => state.user;
export const selectConversations = (state: AppState) => state.conversations;
export const selectActiveConversationId = (state: AppState) =>
  state.activeConversationId;
export const selectActiveConversation = (state: AppState) =>
  state.conversations.find((c) => c.id === state.activeConversationId) || null;
export const selectSelectedModel = (state: AppState) => state.selectedModel;
export const selectIsGenerating = (state: AppState) => state.isGenerating;
export const selectSidebarCollapsed = (state: AppState) => state.sidebarCollapsed;
