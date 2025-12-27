"use client";

import { Plus, MessageSquare, Trash2, PanelLeftClose } from "lucide-react";
import { Conversation } from "./types";

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({
  conversations,
  activeConversationId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  isOpen,
  onToggle,
}: SidebarProps) {
  if (!isOpen) return null;

  return (
    <aside className="w-64 bg-[var(--sidebar-bg)] border-r border-[var(--border)] flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-[var(--border)] flex items-center justify-between">
        <h1 className="text-lg font-semibold text-[var(--foreground)]">Araviel</h1>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-[var(--accent)] transition-colors text-[var(--muted)]"
          aria-label="Close sidebar"
        >
          <PanelLeftClose size={18} />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[var(--border)] hover:bg-[var(--accent)] transition-colors text-[var(--foreground)]"
        >
          <Plus size={18} />
          <span>New chat</span>
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-2">
        {conversations.length === 0 ? (
          <p className="text-[var(--muted)] text-sm text-center py-8">
            No conversations yet
          </p>
        ) : (
          <div className="space-y-1">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  activeConversationId === conversation.id
                    ? "bg-[var(--accent)]"
                    : "hover:bg-[var(--accent)]"
                }`}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <MessageSquare size={16} className="text-[var(--muted)] shrink-0" />
                <span className="text-sm truncate flex-1 text-[var(--foreground)]">
                  {conversation.title}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conversation.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--input-bg)] transition-all text-[var(--muted)] hover:text-red-400"
                  aria-label="Delete conversation"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--border)]">
        <p className="text-xs text-[var(--muted)] text-center">
          Powered by Claude
        </p>
      </div>
    </aside>
  );
}
