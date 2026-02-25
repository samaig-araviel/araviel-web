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
  currentChatId: null, // current conversationId from backend
  isProcessing: false,
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
  },
});

export const {
  setInputValue,
  setMode,
  setSelectedModel,
  setExtendedThinking,
  setDeepResearch,
  setGoogleThinking,
  addMessage,
  updateLastMessage,
  setIsProcessing,
  clearMessages,
  setCurrentChat,
  createNewChat,
  removeLastAssistantMessage,
  setMessages,
  setConversations,
  appendConversations,
  setConversationsLoading,
} = chatSlice.actions;

export const selectInputValue = (state) => state.chat.inputValue;
export const selectMode = (state) => state.chat.mode;
export const selectSelectedModelId = (state) => state.chat.selectedModelId;
export const selectExtendedThinking = (state) => state.chat.extendedThinking;
export const selectDeepResearch = (state) => state.chat.deepResearch;
export const selectGoogleThinking = (state) => state.chat.googleThinking;
export const selectMessages = (state) => state.chat.messages;
export const selectIsProcessing = (state) => state.chat.isProcessing;
export const selectCurrentChatId = (state) => state.chat.currentChatId;
export const selectConversations = (state) => state.chat.conversations;
export const selectConversationsTotal = (state) => state.chat.conversationsTotal;
export const selectConversationsLoading = (state) => state.chat.conversationsLoading;

export default chatSlice.reducer;
