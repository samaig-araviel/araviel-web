"use client";

import { useState } from "react";
import { useChat } from "ai/react";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import { Conversation } from "@/components/types";

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: "/api/chat",
    onFinish: (message) => {
      if (activeConversationId) {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === activeConversationId
              ? { ...conv, messages: [...conv.messages, message], updatedAt: new Date() }
              : conv
          )
        );
      }
    },
  });

  const createNewChat = () => {
    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      title: "New conversation",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
    setMessages([]);
  };

  const selectConversation = (id: string) => {
    setActiveConversationId(id);
    const conversation = conversations.find((c) => c.id === id);
    if (conversation) {
      setMessages(conversation.messages);
    }
  };

  const deleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setMessages([]);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Create new conversation if none exists
    if (!activeConversationId) {
      const newConversation: Conversation = {
        id: crypto.randomUUID(),
        title: input.slice(0, 50) + (input.length > 50 ? "..." : ""),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setConversations((prev) => [newConversation, ...prev]);
      setActiveConversationId(newConversation.id);
    } else {
      // Update conversation title if it's the first message
      const conversation = conversations.find((c) => c.id === activeConversationId);
      if (conversation && conversation.messages.length === 0) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversationId
              ? { ...c, title: input.slice(0, 50) + (input.length > 50 ? "..." : "") }
              : c
          )
        );
      }
    }

    handleSubmit(e);
  };

  return (
    <div className="flex h-screen bg-[var(--background)]">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onNewChat={createNewChat}
        onSelectConversation={selectConversation}
        onDeleteConversation={deleteConversation}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <ChatArea
        messages={messages}
        input={input}
        isLoading={isLoading}
        onInputChange={handleInputChange}
        onSubmit={handleFormSubmit}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
    </div>
  );
}
