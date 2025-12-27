import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import type { Chat, Message, ModelType, ChatState, Attachment } from '@/types';

const initialState: ChatState = {
  chats: [],
  currentChatId: null,
  isStreaming: false,
  selectedModel: 'Auto',
  streamingContent: '',
};

// Helper function to generate chat title from first message
const generateChatTitle = (content: string): string => {
  const maxLength = 50;
  const trimmed = content.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.substring(0, maxLength - 3)}...`;
};

// Async thunk for simulating streaming response
export const streamResponse = createAsyncThunk(
  'chat/streamResponse',
  async (
    {
      query,
      model,
      chatId,
    }: { query: string; model: ModelType; chatId: string },
    { dispatch }
  ) => {
    const responses: Record<ModelType, string> = {
      Auto: `A moonlight story is a tale told or set under the moon's glow—often carrying a dreamy, mysterious, or romantic quality. The term captures stories that unfold at night, where moonlight creates an atmosphere of intimacy, magic, or revelation.

These stories typically feature:

**The moon as witness or catalyst** - It sets the stage for confessions, encounters, secret meetings, or transformations that daylight wouldn't allow.

**Timelessness** - Moonlight stories exist outside normal time—they're liminal, suspended between day and night, reality and dream.

Here's a simple Java method to calculate moonlight intensity:

\`\`\`java
public class MoonlightCalculator {
    public double calculateIntensity(double moonPhase, double cloudCover) {
        double baseIntensity = moonPhase * 100;
        double reduction = cloudCover * 0.8;
        return Math.max(0, baseIntensity - reduction);
    }
}
\`\`\`

The moonlight isn't just setting—it's a character itself, revealing what daylight hides.`,

      Claude: `A moonlight story is a tale told or set under the moon's glow—often carrying a dreamy, mysterious, or romantic quality.

These stories typically feature:

**The moon as witness or catalyst** - It sets the stage for confessions and transformations.

**Timelessness** - Moonlight stories exist outside normal time.

\`\`\`java
public class MoonlightCalculator {
    public double calculateIntensity(double moonPhase, double cloudCover) {
        double baseIntensity = moonPhase * 100;
        double reduction = cloudCover * 0.8;
        return Math.max(0, baseIntensity - reduction);
    }
}
\`\`\``,

      ChatGPT: `Moonlight stories represent a fascinating narrative tradition that bridges the gap between reality and imagination.

Key characteristics include:

- **Atmospheric tension** - The interplay between light and shadow
- **Symbolic depth** - The moon as a metaphor for cycles, change, and hidden truths

\`\`\`python
import math
from datetime import datetime

def calculate_moon_phase(date):
    days_since_new = (date - datetime(2000, 1, 6)).days % 29.53
    return (days_since_new / 29.53) * 100

print(f"Current moon phase: {calculate_moon_phase(datetime.now()):.1f}%")
\`\`\``,

      Gemini: `Moonlight stories are tales that unfold under lunar illumination, creating unique atmospheres for storytelling.

The moon serves multiple symbolic purposes:
1. **Revelation** - Hidden truths emerge
2. **Transformation** - Characters change under its light
3. **Romance** - Intimate moments are heightened`,

      Perplexity: `Based on my research, moonlight stories are narratives characterized by:

• **Nocturnal Settings** - Events occur under moonlight
• **Mysterious Atmospheres** - The darkness creates tension
• **Emotional Depth** - Night reveals inner truths

These stories appear across cultures and literary traditions.`,
    };

    const response = responses[model];
    const words = response.split(' ');

    dispatch(chatSlice.actions.setStreaming(true));
    dispatch(chatSlice.actions.setStreamingContent(''));

    for (let i = 0; i < words.length; i++) {
      const currentContent = words.slice(0, i + 1).join(' ');
      dispatch(chatSlice.actions.setStreamingContent(currentContent));
      await new Promise((resolve) => setTimeout(resolve, 30));
    }

    dispatch(chatSlice.actions.setStreaming(false));

    return {
      chatId,
      content: response,
      model,
    };
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Create a new chat
    createChat: (
      state,
      action: PayloadAction<{
        projectId?: string | null;
        initialMessage?: string;
      }>
    ) => {
      const { projectId = null, initialMessage } = action.payload;
      const newChat: Chat = {
        id: uuidv4(),
        title: initialMessage
          ? generateChatTitle(initialMessage)
          : 'New conversation',
        projectId,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.chats.unshift(newChat);
      state.currentChatId = newChat.id;
    },

    // Set current chat
    setCurrentChat: (state, action: PayloadAction<string | null>) => {
      state.currentChatId = action.payload;
    },

    // Add message to current chat
    addMessage: (
      state,
      action: PayloadAction<{
        chatId: string;
        message: Omit<Message, 'id' | 'timestamp'>;
      }>
    ) => {
      const { chatId, message } = action.payload;
      const chat = state.chats.find((c) => c.id === chatId);
      if (chat) {
        const newMessage: Message = {
          ...message,
          id: uuidv4(),
          timestamp: new Date().toISOString(),
        };
        chat.messages.push(newMessage);
        chat.updatedAt = new Date().toISOString();

        // Update title if it's the first user message
        if (message.type === 'query' && chat.messages.length === 1) {
          chat.title = generateChatTitle(message.content);
        }
      }
    },

    // Update last message (for streaming)
    updateLastMessage: (
      state,
      action: PayloadAction<{ chatId: string; content: string }>
    ) => {
      const { chatId, content } = action.payload;
      const chat = state.chats.find((c) => c.id === chatId);
      if (chat && chat.messages.length > 0) {
        const lastMessage = chat.messages[chat.messages.length - 1];
        if (lastMessage) {
          lastMessage.content = content;
        }
      }
    },

    // Set streaming state
    setStreaming: (state, action: PayloadAction<boolean>) => {
      state.isStreaming = action.payload;
    },

    // Set streaming content
    setStreamingContent: (state, action: PayloadAction<string>) => {
      state.streamingContent = action.payload;
    },

    // Set selected model
    setSelectedModel: (state, action: PayloadAction<ModelType>) => {
      state.selectedModel = action.payload;
    },

    // Rename chat
    renameChat: (
      state,
      action: PayloadAction<{ chatId: string; title: string }>
    ) => {
      const { chatId, title } = action.payload;
      const chat = state.chats.find((c) => c.id === chatId);
      if (chat) {
        chat.title = title;
        chat.updatedAt = new Date().toISOString();
      }
    },

    // Delete chat
    deleteChat: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      state.chats = state.chats.filter((c) => c.id !== chatId);
      if (state.currentChatId === chatId) {
        state.currentChatId = null;
      }
    },

    // Move chat to project
    moveChatToProject: (
      state,
      action: PayloadAction<{ chatId: string; projectId: string | null }>
    ) => {
      const { chatId, projectId } = action.payload;
      const chat = state.chats.find((c) => c.id === chatId);
      if (chat) {
        chat.projectId = projectId;
        chat.updatedAt = new Date().toISOString();
      }
    },

    // Clear current chat (for new conversation)
    clearCurrentChat: (state) => {
      state.currentChatId = null;
      state.streamingContent = '';
    },

    // Load chats from storage
    loadChats: (state, action: PayloadAction<Chat[]>) => {
      state.chats = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(streamResponse.pending, (state) => {
        state.isStreaming = true;
      })
      .addCase(streamResponse.fulfilled, (state, action) => {
        const { chatId, content, model } = action.payload;
        const chat = state.chats.find((c) => c.id === chatId);
        if (chat) {
          const responseMessage: Message = {
            id: uuidv4(),
            type: 'response',
            content,
            model,
            timestamp: new Date().toISOString(),
          };
          chat.messages.push(responseMessage);
          chat.updatedAt = new Date().toISOString();
        }
        state.isStreaming = false;
        state.streamingContent = '';
      })
      .addCase(streamResponse.rejected, (state) => {
        state.isStreaming = false;
        state.streamingContent = '';
      });
  },
});

export const {
  createChat,
  setCurrentChat,
  addMessage,
  updateLastMessage,
  setStreaming,
  setStreamingContent,
  setSelectedModel,
  renameChat,
  deleteChat,
  moveChatToProject,
  clearCurrentChat,
  loadChats,
} = chatSlice.actions;

export default chatSlice.reducer;
