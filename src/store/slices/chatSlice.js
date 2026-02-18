import { createSlice } from '@reduxjs/toolkit';

const getInitialSelectedModel = () => {
  return localStorage.getItem('araviel-selected-model') || null;
};

const initialState = {
  messages: [],
  inputValue: '',
  mode: 'auto', // 'auto', 'code', 'write'
  selectedModelId: getInitialSelectedModel(), // null = Auto
  extendedThinking: false,
  deepResearch: false,
  googleThinking: false,
  recentChats: [],
  currentChatId: null,
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
  clearMessages,
  setCurrentChat,
  createNewChat,
} = chatSlice.actions;

export const selectInputValue = (state) => state.chat.inputValue;
export const selectMode = (state) => state.chat.mode;
export const selectSelectedModelId = (state) => state.chat.selectedModelId;
export const selectExtendedThinking = (state) => state.chat.extendedThinking;
export const selectDeepResearch = (state) => state.chat.deepResearch;
export const selectGoogleThinking = (state) => state.chat.googleThinking;
export const selectMessages = (state) => state.chat.messages;
export const selectRecentChats = (state) => state.chat.recentChats;
export const selectCurrentChatId = (state) => state.chat.currentChatId;

export default chatSlice.reducer;
