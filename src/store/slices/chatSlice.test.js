import { describe, it, expect, beforeEach } from 'vitest';
import chatReducer, {
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
  dismissMessageError,
  setIsProcessing,
  clearMessages,
  setCurrentChat,
  createNewChat,
  removeLastAssistantMessage,
  setPendingAutoSubmit,
  setPendingModality,
  setSelectedModality,
  setImageQuality,
  applyImageQuickPromptOverride,
  revertQuickPromptImageOverride,
  setCreditBalance,
  setActiveProjectId,
  setImportedContext,
  setMessages,
  setConversations,
  appendConversations,
  setConversationsLoading,
  updateConversationTitle,
  resetChatState,
  selectInputValue,
  selectMode,
  selectSelectedModelId,
  selectExtendedThinking,
  selectDeepResearch,
  selectGoogleThinking,
  selectWebSearchEnabled,
  selectTone,
  selectMood,
  selectAutoStrategy,
  selectMessages,
  selectIsProcessing,
  selectCurrentChatId,
  selectPendingAutoSubmit,
  selectPendingModality,
  selectSelectedModality,
  selectImageQuality,
  selectQuickPromptImageOverride,
  selectCreditBalance,
  selectActiveProjectId,
  selectConversations,
  selectConversationsTotal,
  selectConversationsLoading,
  selectImportedContext,
} from './chatSlice';

// Mock isModelAccessible so getInitialSelectedModel works
vi.mock('../../data/models', () => ({
  isModelAccessible: vi.fn(() => true),
}));

describe('chatSlice', () => {
  let defaultState;

  beforeEach(() => {
    localStorage.clear();
    defaultState = chatReducer(undefined, { type: 'unknown' });
  });

  describe('initial state', () => {
    it('has sensible defaults', () => {
      expect(defaultState.messages).toEqual([]);
      expect(defaultState.inputValue).toBe('');
      expect(defaultState.mode).toBe('auto');
      expect(defaultState.extendedThinking).toBe(false);
      expect(defaultState.deepResearch).toBe(false);
      expect(defaultState.googleThinking).toBe(false);
      expect(defaultState.webSearchEnabled).toBeNull();
      expect(defaultState.tone).toBe('default');
      expect(defaultState.mood).toBeNull();
      expect(defaultState.autoStrategy).toBe('default');
      expect(defaultState.currentChatId).toBeNull();
      expect(defaultState.isProcessing).toBe(false);
      expect(defaultState.selectedModality).toBe('text');
      expect(defaultState.imageQuality).toBe('standard');
      expect(defaultState.quickPromptImageOverride).toBeNull();
      expect(defaultState.creditBalance).toBeNull();
      expect(defaultState.conversations).toEqual([]);
    });
  });

  describe('setInputValue', () => {
    it('sets the input value', () => {
      const state = chatReducer(defaultState, setInputValue('Hello'));
      expect(state.inputValue).toBe('Hello');
    });
  });

  describe('setMode', () => {
    it('sets the mode', () => {
      const state = chatReducer(defaultState, setMode('code'));
      expect(state.mode).toBe('code');
    });
  });

  describe('setSelectedModel', () => {
    it('sets the model id', () => {
      const state = chatReducer(defaultState, setSelectedModel('claude-opus-4-6'));
      expect(state.selectedModelId).toBe('claude-opus-4-6');
    });

    it('resets thinking toggles when switching models', () => {
      let state = chatReducer(defaultState, setExtendedThinking(true));
      state = chatReducer(state, setSelectedModel('gpt-4o'));
      expect(state.extendedThinking).toBe(false);
      expect(state.deepResearch).toBe(false);
      expect(state.googleThinking).toBe(false);
    });

    it('persists to localStorage', () => {
      chatReducer(defaultState, setSelectedModel('claude-opus-4-6'));
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'araviel-selected-model',
        'claude-opus-4-6'
      );
    });

    it('removes from localStorage when set to null', () => {
      chatReducer(defaultState, setSelectedModel(null));
      expect(localStorage.removeItem).toHaveBeenCalledWith('araviel-selected-model');
    });
  });

  describe('thinking mode toggles', () => {
    it('setExtendedThinking disables other thinking modes', () => {
      let state = chatReducer(defaultState, setDeepResearch(true));
      state = chatReducer(state, setExtendedThinking(true));
      expect(state.extendedThinking).toBe(true);
      expect(state.deepResearch).toBe(false);
      expect(state.googleThinking).toBe(false);
    });

    it('setDeepResearch disables other thinking modes', () => {
      let state = chatReducer(defaultState, setExtendedThinking(true));
      state = chatReducer(state, setDeepResearch(true));
      expect(state.deepResearch).toBe(true);
      expect(state.extendedThinking).toBe(false);
      expect(state.googleThinking).toBe(false);
    });

    it('setGoogleThinking disables other thinking modes', () => {
      let state = chatReducer(defaultState, setExtendedThinking(true));
      state = chatReducer(state, setGoogleThinking(true));
      expect(state.googleThinking).toBe(true);
      expect(state.extendedThinking).toBe(false);
      expect(state.deepResearch).toBe(false);
    });

    it('turning off a thinking mode does not enable others', () => {
      let state = chatReducer(defaultState, setExtendedThinking(true));
      state = chatReducer(state, setExtendedThinking(false));
      expect(state.extendedThinking).toBe(false);
      expect(state.deepResearch).toBe(false);
      expect(state.googleThinking).toBe(false);
    });
  });

  describe('setWebSearchEnabled', () => {
    it('sets to true, false, or null', () => {
      let state = chatReducer(defaultState, setWebSearchEnabled(true));
      expect(state.webSearchEnabled).toBe(true);

      state = chatReducer(state, setWebSearchEnabled(false));
      expect(state.webSearchEnabled).toBe(false);

      state = chatReducer(state, setWebSearchEnabled(null));
      expect(state.webSearchEnabled).toBeNull();
    });
  });

  describe('setTone', () => {
    it('sets the tone', () => {
      const state = chatReducer(defaultState, setTone('professional'));
      expect(state.tone).toBe('professional');
    });
  });

  describe('setMood', () => {
    it('sets the mood', () => {
      const state = chatReducer(defaultState, setMood('happy'));
      expect(state.mood).toBe('happy');
    });
  });

  describe('setAutoStrategy', () => {
    it('sets the auto strategy', () => {
      const state = chatReducer(defaultState, setAutoStrategy('taskBased'));
      expect(state.autoStrategy).toBe('taskBased');
    });
  });

  describe('message management', () => {
    it('addMessage appends a message', () => {
      const msg = { role: 'user', content: 'Hello' };
      const state = chatReducer(defaultState, addMessage(msg));
      expect(state.messages).toHaveLength(1);
      expect(state.messages[0]).toEqual(msg);
    });

    it('updateLastMessage updates the last message', () => {
      let state = chatReducer(defaultState, addMessage({ role: 'user', content: 'Hello' }));
      state = chatReducer(state, addMessage({ role: 'assistant', content: 'Hi' }));
      state = chatReducer(state, updateLastMessage({ content: 'Hi there!' }));
      expect(state.messages[1].content).toBe('Hi there!');
    });

    it('updateLastMessage does nothing on empty messages', () => {
      const state = chatReducer(defaultState, updateLastMessage({ content: 'test' }));
      expect(state.messages).toHaveLength(0);
    });

    it('dismissMessageError clears the error on the matching message only', () => {
      let state = chatReducer(
        defaultState,
        addMessage({ id: 'a', role: 'assistant', content: '', error: { message: 'boom' } })
      );
      state = chatReducer(
        state,
        addMessage({ id: 'b', role: 'assistant', content: '', error: { message: 'bang' } })
      );
      state = chatReducer(state, dismissMessageError('a'));
      expect(state.messages[0].error).toBeNull();
      expect(state.messages[1].error).toEqual({ message: 'bang' });
    });

    it('dismissMessageError is a no-op for an unknown id', () => {
      let state = chatReducer(
        defaultState,
        addMessage({ id: 'a', role: 'assistant', content: '', error: { message: 'boom' } })
      );
      state = chatReducer(state, dismissMessageError('z'));
      expect(state.messages[0].error).toEqual({ message: 'boom' });
    });

    it('clearMessages empties the messages array', () => {
      let state = chatReducer(defaultState, addMessage({ role: 'user', content: 'Hello' }));
      state = chatReducer(state, clearMessages());
      expect(state.messages).toHaveLength(0);
    });

    it('setMessages replaces all messages', () => {
      const msgs = [
        { role: 'user', content: 'One' },
        { role: 'assistant', content: 'Two' },
      ];
      const state = chatReducer(defaultState, setMessages(msgs));
      expect(state.messages).toEqual(msgs);
    });

    it('removeLastAssistantMessage removes the last assistant message', () => {
      let state = chatReducer(defaultState, addMessage({ role: 'user', content: 'Q1' }));
      state = chatReducer(state, addMessage({ role: 'assistant', content: 'A1' }));
      state = chatReducer(state, addMessage({ role: 'user', content: 'Q2' }));
      state = chatReducer(state, addMessage({ role: 'assistant', content: 'A2' }));

      state = chatReducer(state, removeLastAssistantMessage());
      expect(state.messages).toHaveLength(3);
      expect(state.messages[2].content).toBe('Q2');
    });

    it('removeLastAssistantMessage does nothing when no assistant messages', () => {
      let state = chatReducer(defaultState, addMessage({ role: 'user', content: 'Q1' }));
      state = chatReducer(state, removeLastAssistantMessage());
      expect(state.messages).toHaveLength(1);
    });
  });

  describe('setIsProcessing', () => {
    it('sets processing state', () => {
      const state = chatReducer(defaultState, setIsProcessing(true));
      expect(state.isProcessing).toBe(true);
    });
  });

  describe('setCurrentChat', () => {
    it('sets the current chat id', () => {
      const state = chatReducer(defaultState, setCurrentChat('chat-123'));
      expect(state.currentChatId).toBe('chat-123');
    });
  });

  describe('createNewChat', () => {
    it('resets chat-related state', () => {
      let state = chatReducer(defaultState, setCurrentChat('chat-123'));
      state = chatReducer(state, addMessage({ role: 'user', content: 'Hello' }));
      state = chatReducer(state, setInputValue('Draft'));
      state = chatReducer(state, setIsProcessing(true));
      state = chatReducer(state, setActiveProjectId('proj-1'));

      state = chatReducer(state, createNewChat());
      expect(state.currentChatId).toBeNull();
      expect(state.messages).toEqual([]);
      expect(state.inputValue).toBe('');
      expect(state.isProcessing).toBe(false);
      expect(state.activeProjectId).toBeNull();
      expect(state.selectedModality).toBe('text');
      expect(state.imageQuality).toBe('standard');
      expect(state.importedContext).toBeNull();
    });
  });

  describe('modality and image quality', () => {
    it('setSelectedModality sets the modality', () => {
      const state = chatReducer(defaultState, setSelectedModality('image'));
      expect(state.selectedModality).toBe('image');
    });

    it('setImageQuality sets the quality', () => {
      const state = chatReducer(defaultState, setImageQuality('hd'));
      expect(state.imageQuality).toBe('hd');
    });

    it('setPendingModality sets pending modality', () => {
      const state = chatReducer(defaultState, setPendingModality('image'));
      expect(state.pendingModality).toBe('image');
    });
  });

  describe('quick-prompt image override', () => {
    it('applyImageQuickPromptOverride saves previous values and switches to image + tier default', () => {
      const state = chatReducer(defaultState, applyImageQuickPromptOverride('hd'));
      expect(state.selectedModality).toBe('image');
      expect(state.imageQuality).toBe('hd');
      expect(state.quickPromptImageOverride).toEqual({
        previousModality: 'text',
        previousQuality: 'standard',
      });
    });

    it('repeated applyImageQuickPromptOverride does not overwrite the original previous values', () => {
      let state = chatReducer(defaultState, applyImageQuickPromptOverride('hd'));
      // Simulate a second click, which should keep the original previous values.
      state = chatReducer(state, applyImageQuickPromptOverride('ultra'));
      expect(state.quickPromptImageOverride).toEqual({
        previousModality: 'text',
        previousQuality: 'standard',
      });
      expect(state.imageQuality).toBe('ultra');
    });

    it('revertQuickPromptImageOverride restores previous modality and quality and clears the override', () => {
      let state = chatReducer(defaultState, applyImageQuickPromptOverride('ultra'));
      state = chatReducer(state, revertQuickPromptImageOverride());
      expect(state.selectedModality).toBe('text');
      expect(state.imageQuality).toBe('standard');
      expect(state.quickPromptImageOverride).toBeNull();
    });

    it('revertQuickPromptImageOverride is a no-op when no override is active', () => {
      const state = chatReducer(defaultState, revertQuickPromptImageOverride());
      expect(state).toEqual(defaultState);
    });

    it('a manual setSelectedModality to a different value clears the override (user wins)', () => {
      let state = chatReducer(defaultState, applyImageQuickPromptOverride('hd'));
      state = chatReducer(state, setSelectedModality('text'));
      expect(state.selectedModality).toBe('text');
      expect(state.quickPromptImageOverride).toBeNull();
    });

    it('a manual setImageQuality to a different value clears the override (user wins)', () => {
      let state = chatReducer(defaultState, applyImageQuickPromptOverride('hd'));
      state = chatReducer(state, setImageQuality('ultra'));
      expect(state.imageQuality).toBe('ultra');
      expect(state.quickPromptImageOverride).toBeNull();
    });

    it('a no-op manual setSelectedModality (same value) keeps the one-shot alive', () => {
      let state = chatReducer(defaultState, applyImageQuickPromptOverride('hd'));
      // User reselects "image" — already set by the override, no actual change.
      state = chatReducer(state, setSelectedModality('image'));
      expect(state.quickPromptImageOverride).toEqual({
        previousModality: 'text',
        previousQuality: 'standard',
      });
    });

    it('a no-op manual setImageQuality (same value) keeps the one-shot alive', () => {
      let state = chatReducer(defaultState, applyImageQuickPromptOverride('hd'));
      state = chatReducer(state, setImageQuality('hd'));
      expect(state.quickPromptImageOverride).toEqual({
        previousModality: 'text',
        previousQuality: 'standard',
      });
    });

    it('createNewChat clears any active override', () => {
      let state = chatReducer(defaultState, applyImageQuickPromptOverride('ultra'));
      state = chatReducer(state, createNewChat());
      expect(state.quickPromptImageOverride).toBeNull();
      expect(state.selectedModality).toBe('text');
      expect(state.imageQuality).toBe('standard');
    });

    it('selectQuickPromptImageOverride returns the current override shape', () => {
      const state = chatReducer(defaultState, applyImageQuickPromptOverride('hd'));
      expect(selectQuickPromptImageOverride({ chat: state })).toEqual({
        previousModality: 'text',
        previousQuality: 'standard',
      });
    });
  });

  describe('setCreditBalance', () => {
    it('sets the credit balance', () => {
      const balance = { monthly: 100, packs: 20 };
      const state = chatReducer(defaultState, setCreditBalance(balance));
      expect(state.creditBalance).toEqual(balance);
    });
  });

  describe('setActiveProjectId', () => {
    it('sets the active project id', () => {
      const state = chatReducer(defaultState, setActiveProjectId('proj-1'));
      expect(state.activeProjectId).toBe('proj-1');
    });
  });

  describe('setImportedContext', () => {
    it('sets imported context', () => {
      const ctx = { importedConversationId: 'imp-1', provider: 'claude' };
      const state = chatReducer(defaultState, setImportedContext(ctx));
      expect(state.importedContext).toEqual(ctx);
    });
  });

  describe('setPendingAutoSubmit', () => {
    it('sets pending auto submit flag', () => {
      const state = chatReducer(defaultState, setPendingAutoSubmit(true));
      expect(state.pendingAutoSubmit).toBe(true);
    });
  });

  describe('conversation management', () => {
    it('setConversations sets conversations and total', () => {
      const state = chatReducer(
        defaultState,
        setConversations({ conversations: [{ id: '1' }], total: 5 })
      );
      expect(state.conversations).toEqual([{ id: '1' }]);
      expect(state.conversationsTotal).toBe(5);
    });

    it('appendConversations appends to existing', () => {
      let state = chatReducer(
        defaultState,
        setConversations({ conversations: [{ id: '1' }], total: 3 })
      );
      state = chatReducer(state, appendConversations({ conversations: [{ id: '2' }], total: 3 }));
      expect(state.conversations).toHaveLength(2);
      expect(state.conversationsTotal).toBe(3);
    });

    it('setConversationsLoading sets loading state', () => {
      const state = chatReducer(defaultState, setConversationsLoading(true));
      expect(state.conversationsLoading).toBe(true);
    });

    it('updateConversationTitle updates a matching conversation title', () => {
      let state = chatReducer(
        defaultState,
        setConversations({
          conversations: [
            { id: 'c1', title: 'Old...' },
            { id: 'c2', title: 'Other' },
          ],
          total: 2,
        })
      );
      state = chatReducer(state, updateConversationTitle({ id: 'c1', title: 'Fresh title' }));
      expect(state.conversations[0].title).toBe('Fresh title');
      expect(state.conversations[1].title).toBe('Other');
    });

    it('updateConversationTitle is a no-op for unknown ids', () => {
      let state = chatReducer(
        defaultState,
        setConversations({ conversations: [{ id: 'c1', title: 'Old' }], total: 1 })
      );
      state = chatReducer(state, updateConversationTitle({ id: 'missing', title: 'Nope' }));
      expect(state.conversations[0].title).toBe('Old');
    });

    it('updateConversationTitle ignores empty or missing titles', () => {
      let state = chatReducer(
        defaultState,
        setConversations({ conversations: [{ id: 'c1', title: 'Old' }], total: 1 })
      );
      state = chatReducer(state, updateConversationTitle({ id: 'c1', title: '' }));
      state = chatReducer(state, updateConversationTitle({ id: 'c1' }));
      state = chatReducer(state, updateConversationTitle());
      expect(state.conversations[0].title).toBe('Old');
    });
  });

  describe('resetChatState', () => {
    it('resets to initial state but preserves selectedModelId', () => {
      let state = chatReducer(defaultState, setSelectedModel('claude-opus-4-6'));
      state = chatReducer(state, addMessage({ role: 'user', content: 'Hello' }));
      state = chatReducer(state, setTone('professional'));

      state = chatReducer(state, resetChatState());
      expect(state.selectedModelId).toBe('claude-opus-4-6');
      expect(state.messages).toEqual([]);
      expect(state.tone).toBe('default');
    });
  });

  describe('selectors', () => {
    const rootState = {
      chat: {
        inputValue: 'test',
        mode: 'code',
        selectedModelId: 'gpt-4o',
        extendedThinking: true,
        deepResearch: false,
        googleThinking: false,
        webSearchEnabled: true,
        tone: 'friendly',
        mood: 'happy',
        autoStrategy: 'taskBased',
        messages: [{ role: 'user', content: 'hi' }],
        isProcessing: true,
        currentChatId: 'chat-1',
        pendingAutoSubmit: false,
        pendingModality: null,
        selectedModality: 'image',
        imageQuality: 'hd',
        creditBalance: { monthly: 50 },
        activeProjectId: 'proj-1',
        conversations: [{ id: 'c1' }],
        conversationsTotal: 10,
        conversationsLoading: false,
        importedContext: { provider: 'claude' },
      },
    };

    it('selectInputValue', () => expect(selectInputValue(rootState)).toBe('test'));
    it('selectMode', () => expect(selectMode(rootState)).toBe('code'));
    it('selectSelectedModelId', () => expect(selectSelectedModelId(rootState)).toBe('gpt-4o'));
    it('selectExtendedThinking', () => expect(selectExtendedThinking(rootState)).toBe(true));
    it('selectDeepResearch', () => expect(selectDeepResearch(rootState)).toBe(false));
    it('selectGoogleThinking', () => expect(selectGoogleThinking(rootState)).toBe(false));
    it('selectWebSearchEnabled', () => expect(selectWebSearchEnabled(rootState)).toBe(true));
    it('selectTone', () => expect(selectTone(rootState)).toBe('friendly'));
    it('selectMood', () => expect(selectMood(rootState)).toBe('happy'));
    it('selectAutoStrategy', () => expect(selectAutoStrategy(rootState)).toBe('taskBased'));
    it('selectMessages', () => expect(selectMessages(rootState)).toHaveLength(1));
    it('selectIsProcessing', () => expect(selectIsProcessing(rootState)).toBe(true));
    it('selectCurrentChatId', () => expect(selectCurrentChatId(rootState)).toBe('chat-1'));
    it('selectPendingAutoSubmit', () => expect(selectPendingAutoSubmit(rootState)).toBe(false));
    it('selectPendingModality', () => expect(selectPendingModality(rootState)).toBeNull());
    it('selectSelectedModality', () => expect(selectSelectedModality(rootState)).toBe('image'));
    it('selectImageQuality', () => expect(selectImageQuality(rootState)).toBe('hd'));
    it('selectCreditBalance', () =>
      expect(selectCreditBalance(rootState)).toEqual({ monthly: 50 }));
    it('selectActiveProjectId', () => expect(selectActiveProjectId(rootState)).toBe('proj-1'));
    it('selectConversations', () => expect(selectConversations(rootState)).toHaveLength(1));
    it('selectConversationsTotal', () => expect(selectConversationsTotal(rootState)).toBe(10));
    it('selectConversationsLoading', () =>
      expect(selectConversationsLoading(rootState)).toBe(false));
    it('selectImportedContext', () =>
      expect(selectImportedContext(rootState)).toEqual({ provider: 'claude' }));
  });
});
