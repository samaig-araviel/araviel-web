"use client";

import type { Message } from "ai";
import { PanelLeft, Send, Square } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ChatAreaProps {
  messages: Message[];
  input: string;
  isLoading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function ChatArea({
  messages,
  input,
  isLoading,
  onInputChange,
  onSubmit,
  sidebarOpen,
  onToggleSidebar,
}: ChatAreaProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  return (
    <main className="flex-1 flex flex-col h-full">
      {/* Header */}
      <header className="h-14 border-b border-[var(--border)] flex items-center px-4 gap-3">
        {!sidebarOpen && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg hover:bg-[var(--accent)] transition-colors text-[var(--muted)]"
            aria-label="Open sidebar"
          >
            <PanelLeft size={18} />
          </button>
        )}
        <h2 className="text-sm font-medium text-[var(--foreground)]">
          {messages.length > 0 ? "Chat" : "New conversation"}
        </h2>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md px-4">
              <div className="w-16 h-16 rounded-2xl bg-[var(--primary)] flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">A</span>
              </div>
              <h1 className="text-2xl font-semibold mb-2 text-[var(--foreground)]">
                How can I help you today?
              </h1>
              <p className="text-[var(--muted)]">
                Ask me anything. I can help with coding, writing, analysis, and more.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.role === "user" ? "justify-end" : ""}`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-white">A</span>
                  </div>
                )}
                <div
                  className={`max-w-[80%] ${
                    message.role === "user"
                      ? "bg-[var(--input-bg)] rounded-2xl rounded-br-md px-4 py-3"
                      : "prose"
                  }`}
                >
                  {message.role === "user" ? (
                    <p className="text-[var(--foreground)] whitespace-pre-wrap">
                      {message.content}
                    </p>
                  ) : (
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-white">A</span>
                </div>
                <div className="flex items-center gap-1 py-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--muted)] animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2 h-2 rounded-full bg-[var(--muted)] animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 rounded-full bg-[var(--muted)] animate-bounce" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-[var(--border)] p-4">
        <form onSubmit={onSubmit} className="max-w-3xl mx-auto">
          <div className="relative bg-[var(--input-bg)] rounded-xl border border-[var(--border)] focus-within:border-[var(--primary)] transition-colors">
            <textarea
              value={input}
              onChange={onInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Message Araviel..."
              rows={1}
              className="w-full resize-none bg-transparent px-4 py-3 pr-12 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none max-h-48"
              style={{ minHeight: "48px" }}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 bottom-2 p-2 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label={isLoading ? "Stop" : "Send message"}
            >
              {isLoading ? (
                <Square size={16} className="text-white" />
              ) : (
                <Send size={16} className="text-white" />
              )}
            </button>
          </div>
          <p className="text-xs text-[var(--muted)] text-center mt-2">
            Araviel can make mistakes. Consider checking important information.
          </p>
        </form>
      </div>
    </main>
  );
}
