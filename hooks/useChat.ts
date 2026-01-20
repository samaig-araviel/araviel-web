'use client';

import { useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import type { ModelSelection, QuickAction } from '@/types';

export function useChat() {
  const {
    conversations,
    activeConversationId,
    selectedModel,
    isGenerating,
    setSelectedModel,
    createConversation,
    deleteConversation,
    setActiveConversation,
    updateConversationTitle,
    sendMessage,
    stopGenerating,
    getActiveConversation,
  } = useAppStore();

  const activeConversation = getActiveConversation();

  const handleNewChat = useCallback(() => {
    const id = createConversation();
    return id;
  }, [createConversation]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      await sendMessage(content);
    },
    [sendMessage]
  );

  const handleSelectQuickAction = useCallback(
    (action: QuickAction) => {
      // Return the prompt starter so the input can be prefilled
      return action.promptStarter;
    },
    []
  );

  const handleModelChange = useCallback(
    (model: ModelSelection) => {
      setSelectedModel(model);
    },
    [setSelectedModel]
  );

  const handleSelectConversation = useCallback(
    (id: string) => {
      setActiveConversation(id);
    },
    [setActiveConversation]
  );

  const handleRenameConversation = useCallback(
    (id: string, title: string) => {
      updateConversationTitle(id, title);
    },
    [updateConversationTitle]
  );

  const handleDeleteConversation = useCallback(
    (id: string) => {
      deleteConversation(id);
    },
    [deleteConversation]
  );

  return {
    // State
    conversations,
    activeConversationId,
    activeConversation,
    selectedModel,
    isGenerating,

    // Actions
    handleNewChat,
    handleSendMessage,
    handleSelectQuickAction,
    handleModelChange,
    handleSelectConversation,
    handleRenameConversation,
    handleDeleteConversation,
    stopGenerating,
  };
}
