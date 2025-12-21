import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import type { Chat, Message, ModelType, FileAttachment } from '../types';

interface ChatState {
  chats: Chat[];
  currentChatId: string | null;
  selectedModel: ModelType;
}

const loadChatsFromStorage = (): Chat[] => {
  try {
    const stored = localStorage.getItem('araviel_chats');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const loadCurrentChatFromStorage = (): string | null => {
  try {
    const stored = localStorage.getItem('araviel_active_state');
    if (stored) {
      const state = JSON.parse(stored);
      return state.chatId || null;
    }
    return null;
  } catch {
    return null;
  }
};

const saveChatsToStorage = (chats: Chat[]) => {
  localStorage.setItem('araviel_chats', JSON.stringify(chats));
};

const saveActiveState = (chatId: string | null, projectId: string | null) => {
  localStorage.setItem('araviel_active_state', JSON.stringify({ chatId, projectId }));
};

const initialState: ChatState = {
  chats: loadChatsFromStorage(),
  currentChatId: loadCurrentChatFromStorage(),
  selectedModel: 'Auto',
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    createChat: (state, action: PayloadAction<{ projectId: string | null; title: string }>) => {
      const now = new Date().toISOString();
      const newChat: Chat = {
        id: uuidv4(),
        title: action.payload.title,
        projectId: action.payload.projectId,
        messages: [],
        createdAt: now,
        updatedAt: now,
      };
      state.chats.unshift(newChat);
      state.currentChatId = newChat.id;
      saveChatsToStorage(state.chats);
      saveActiveState(newChat.id, action.payload.projectId);
    },

    setCurrentChat: (state, action: PayloadAction<string | null>) => {
      state.currentChatId = action.payload;
      if (action.payload) {
        const chat = state.chats.find(c => c.id === action.payload);
        saveActiveState(action.payload, chat?.projectId || null);
      } else {
        saveActiveState(null, null);
      }
    },

    addMessage: (state, action: PayloadAction<{
      chatId: string;
      type: 'query' | 'response';
      content: string;
      model?: ModelType;
      attachments?: FileAttachment[];
    }>) => {
      const chat = state.chats.find(c => c.id === action.payload.chatId);
      if (chat) {
        const message: Message = {
          id: uuidv4(),
          type: action.payload.type,
          content: action.payload.content,
          model: action.payload.model,
          attachments: action.payload.attachments,
          timestamp: new Date().toISOString(),
        };
        chat.messages.push(message);
        chat.updatedAt = new Date().toISOString();

        // Update title from first query if it's the first message
        if (chat.messages.length === 1 && action.payload.type === 'query') {
          chat.title = action.payload.content.slice(0, 50) + (action.payload.content.length > 50 ? '...' : '');
        }

        saveChatsToStorage(state.chats);
      }
    },

    updateMessageContent: (state, action: PayloadAction<{
      chatId: string;
      messageId: string;
      content: string;
    }>) => {
      const chat = state.chats.find(c => c.id === action.payload.chatId);
      if (chat) {
        const message = chat.messages.find(m => m.id === action.payload.messageId);
        if (message) {
          message.content = action.payload.content;
          saveChatsToStorage(state.chats);
        }
      }
    },

    renameChat: (state, action: PayloadAction<{ chatId: string; title: string }>) => {
      const chat = state.chats.find(c => c.id === action.payload.chatId);
      if (chat) {
        chat.title = action.payload.title;
        chat.updatedAt = new Date().toISOString();
        saveChatsToStorage(state.chats);
      }
    },

    deleteChat: (state, action: PayloadAction<string>) => {
      state.chats = state.chats.filter(c => c.id !== action.payload);
      if (state.currentChatId === action.payload) {
        state.currentChatId = null;
        saveActiveState(null, null);
      }
      saveChatsToStorage(state.chats);
    },

    moveChatToProject: (state, action: PayloadAction<{ chatId: string; projectId: string | null }>) => {
      const chat = state.chats.find(c => c.id === action.payload.chatId);
      if (chat) {
        chat.projectId = action.payload.projectId;
        chat.updatedAt = new Date().toISOString();
        saveChatsToStorage(state.chats);
      }
    },

    setSelectedModel: (state, action: PayloadAction<ModelType>) => {
      state.selectedModel = action.payload;
    },

    clearCurrentChat: (state) => {
      state.currentChatId = null;
      saveActiveState(null, null);
    },
  },
});

export const {
  createChat,
  setCurrentChat,
  addMessage,
  updateMessageContent,
  renameChat,
  deleteChat,
  moveChatToProject,
  setSelectedModel,
  clearCurrentChat,
} = chatSlice.actions;

export default chatSlice.reducer;

// Selectors
export const selectChats = (state: { chat: ChatState }) => state.chat.chats;
export const selectCurrentChat = (state: { chat: ChatState }) =>
  state.chat.chats.find(c => c.id === state.chat.currentChatId);
export const selectCurrentChatId = (state: { chat: ChatState }) => state.chat.currentChatId;
export const selectRecentChats = (state: { chat: ChatState }, limit = 10) =>
  [...state.chat.chats]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, limit);
export const selectChatsByProject = (state: { chat: ChatState }, projectId: string) =>
  state.chat.chats.filter(c => c.projectId === projectId);
export const selectSelectedModel = (state: { chat: ChatState }) => state.chat.selectedModel;
