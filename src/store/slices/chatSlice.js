import { createSlice } from '@reduxjs/toolkit';
import { isModelAccessible, getUserTier } from '../../data/models';

const getInitialSelectedModel = () => {
  const modelId = localStorage.getItem('araviel-selected-model');
  if (!modelId) return null;
  // Clear selection if model is not accessible for the user's tier
  const tier = getUserTier();
  if (!isModelAccessible(modelId, tier)) {
    localStorage.removeItem('araviel-selected-model');
    return null;
  }
  return modelId;
};

const initialState = {
  messages: [],
  inputValue: '',
  mode: 'auto', // 'auto', 'code', 'write'
  selectedModelId: getInitialSelectedModel(), // null = Auto
  extendedThinking: false,
  deepResearch: false,
  googleThinking: false,
  webSearchEnabled: null, // null = Auto/let ADE decide, true = user toggled on, false = user toggled off
  tone: 'default', // 'default' | 'professional' | 'friendly' | 'candid' | 'quirky' | 'efficient' | 'cynical'
  mood: null, // null = not set, or: happy, neutral, stressed, frustrated, excited, tired, anxious, calm
  autoStrategy: 'default', // 'default' | 'humanFactors' | 'costEfficient' | 'taskBased'
  currentChatId: null, // current conversationId from backend
  isProcessing: false,
  pendingAutoSubmit: false, // when true, MainContent auto-fires the inputValue on mount
  pendingModality: null, // null = default 'text', or 'image' when prompt originates from image view
  selectedModality: 'text', // 'text' | 'image' — user-selected modality in ModalityBar
  imageQuality: 'standard', // 'standard' | 'hd' | 'ultra'
  creditBalance: null, // { monthly, packs, combined, tier, cycleResetsAt } — fetched from backend
  activeProjectId: null, // set when starting a chat from a project workspace
  // Imported conversation context for continuing imported chats
  // Shape: { importedConversationId: string, provider: string, providerName: string, title: string } | null
  importedContext: null,
  // Conversation list from backend
  conversations: [],
  conversationsTotal: 0,
  conversationsLoading: false,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setInputValue: (state, action) => {
      state.inputValue = action.payload;
    },
    setMode: (state, action) => {
      state.mode = action.payload;
    },
    setSelectedModel: (state, action) => {
      state.selectedModelId = action.payload;
      // Reset mode toggles when switching models
      state.extendedThinking = false;
      state.deepResearch = false;
      state.googleThinking = false;
      if (action.payload) {
        localStorage.setItem('araviel-selected-model', action.payload);
      } else {
        localStorage.removeItem('araviel-selected-model');
      }
    },
    setExtendedThinking: (state, action) => {
      state.extendedThinking = action.payload;
      if (action.payload) {
        state.deepResearch = false;
        state.googleThinking = false;
      }
    },
    setDeepResearch: (state, action) => {
      state.deepResearch = action.payload;
      if (action.payload) {
        state.extendedThinking = false;
        state.googleThinking = false;
      }
    },
    setGoogleThinking: (state, action) => {
      state.googleThinking = action.payload;
      if (action.payload) {
        state.extendedThinking = false;
        state.deepResearch = false;
      }
    },
    setWebSearchEnabled: (state, action) => {
      state.webSearchEnabled = action.payload; // null | true | false
    },
    setTone: (state, action) => {
      state.tone = action.payload; // null | string
    },
    setMood: (state, action) => {
      state.mood = action.payload; // null | string
    },
    setAutoStrategy: (state, action) => {
      state.autoStrategy = action.payload; // 'default' | 'humanFactors' | 'costEfficient' | 'taskBased'
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    updateLastMessage: (state, action) => {
      if (state.messages.length > 0) {
        const last = state.messages[state.messages.length - 1];
        Object.assign(last, action.payload);
      }
    },
    setIsProcessing: (state, action) => {
      state.isProcessing = action.payload;
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    setCurrentChat: (state, action) => {
      state.currentChatId = action.payload;
    },
    createNewChat: (state) => {
      state.currentChatId = null;
      state.messages = [];
      state.inputValue = '';
      state.isProcessing = false;
      state.pendingAutoSubmit = false;
      state.pendingModality = null;
      state.selectedModality = 'text';
      state.imageQuality = 'standard';
      state.activeProjectId = null;
      state.importedContext = null;
    },
    setActiveProjectId: (state, action) => {
      state.activeProjectId = action.payload;
    },
    setImportedContext: (state, action) => {
      state.importedContext = action.payload;
    },
    setPendingAutoSubmit: (state, action) => {
      state.pendingAutoSubmit = action.payload;
    },
    setPendingModality: (state, action) => {
      state.pendingModality = action.payload;
    },
    setSelectedModality: (state, action) => {
      state.selectedModality = action.payload;
    },
    setImageQuality: (state, action) => {
      state.imageQuality = action.payload;
    },
    setCreditBalance: (state, action) => {
      state.creditBalance = action.payload;
    },
    removeLastAssistantMessage: (state) => {
      for (let i = state.messages.length - 1; i >= 0; i--) {
        if (state.messages[i].role === 'assistant') {
          state.messages.splice(i, 1);
          break;
        }
      }
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    setConversations: (state, action) => {
      state.conversations = action.payload.conversations;
      state.conversationsTotal = action.payload.total;
    },
    appendConversations: (state, action) => {
      state.conversations.push(...action.payload.conversations);
      state.conversationsTotal = action.payload.total;
    },
    setConversationsLoading: (state, action) => {
      state.conversationsLoading = action.payload;
    },
    resetChatState: (state) => {
      // Preserve user's model preference (persisted in localStorage), reset everything else
      const selectedModelId = state.selectedModelId;
      Object.assign(state, initialState, { selectedModelId });
    },
  },
});

export const {
  setInputValue,
  setMode,
  setSelectedModel,
  setExtendedThinking,
  setDeepResearch,
  setGoogleThinking,
  setWebSearchEnabled,
  setTone,
  setMood,
  setAutoStrategy,
  addMessage,
  updateLastMessage,
  setIsProcessing,
  clearMessages,
  setCurrentChat,
  createNewChat,
  removeLastAssistantMessage,
  setPendingAutoSubmit,
  setPendingModality,
  setSelectedModality,
  setImageQuality,
  setCreditBalance,
  setActiveProjectId,
  setImportedContext,
  setMessages,
  setConversations,
  appendConversations,
  setConversationsLoading,
  resetChatState,
} = chatSlice.actions;

export const selectInputValue = (state) => state.chat.inputValue;
export const selectMode = (state) => state.chat.mode;
export const selectSelectedModelId = (state) => state.chat.selectedModelId;
export const selectExtendedThinking = (state) => state.chat.extendedThinking;
export const selectDeepResearch = (state) => state.chat.deepResearch;
export const selectGoogleThinking = (state) => state.chat.googleThinking;
export const selectWebSearchEnabled = (state) => state.chat.webSearchEnabled;
export const selectTone = (state) => state.chat.tone;
export const selectMood = (state) => state.chat.mood;
export const selectAutoStrategy = (state) => state.chat.autoStrategy;
export const selectMessages = (state) => state.chat.messages;
export const selectIsProcessing = (state) => state.chat.isProcessing;
export const selectCurrentChatId = (state) => state.chat.currentChatId;
export const selectPendingAutoSubmit = (state) => state.chat.pendingAutoSubmit;
export const selectPendingModality = (state) => state.chat.pendingModality;
export const selectSelectedModality = (state) => state.chat.selectedModality;
export const selectImageQuality = (state) => state.chat.imageQuality;
export const selectCreditBalance = (state) => state.chat.creditBalance;
export const selectActiveProjectId = (state) => state.chat.activeProjectId;
export const selectConversations = (state) => state.chat.conversations;
export const selectConversationsTotal = (state) => state.chat.conversationsTotal;
export const selectConversationsLoading = (state) => state.chat.conversationsLoading;
export const selectImportedContext = (state) => state.chat.importedContext;

export default chatSlice.reducer;
