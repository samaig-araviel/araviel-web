import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { selectCurrentChat, addMessage, updateMessageContent } from '../../store/chatSlice';
import { setStreaming } from '../../store/uiSlice';
import { MODEL_OPTIONS } from '../../types';
import type { Message, FileAttachment } from '../../types';
import {
  AravielIcon,
  CopyIcon,
  ShareIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  VolumeIcon,
  ChevronDownIcon,
  PaperclipIcon,
  ArrowUpIcon,
  StopCircleIcon,
  XIcon,
  FileTextIcon,
  ImageIcon,
  CodeIcon,
  FileIcon,
} from '../Icons';
import { Avatar } from '../Common';
import { truncateText } from '../../utils/formatters';
import { v4 as uuidv4 } from 'uuid';
import styles from './ChatView.module.css';

// Sample responses for streaming simulation
const SAMPLE_RESPONSES = [
  "I'd be happy to help you with that! Let me provide a comprehensive answer.\n\nHere's what you need to know:\n\n1. **First Point**: This is an important consideration that you should keep in mind.\n\n2. **Second Point**: Building on the first, this adds more context to your question.\n\n3. **Third Point**: Finally, this wraps up the key concepts.\n\nWould you like me to elaborate on any of these points?",
  "That's an excellent question! Let me break this down for you.\n\n## Overview\n\nThe topic you're asking about has several important aspects:\n\n- **Aspect A**: This relates to the fundamental principles\n- **Aspect B**: This covers the practical applications\n- **Aspect C**: This addresses common misconceptions\n\n### Key Takeaways\n\nRemember that understanding these concepts will help you make better decisions. Feel free to ask if you need more clarification!",
  "I understand what you're looking for. Here's a detailed explanation:\n\n```javascript\n// Example code\nfunction example() {\n  const result = processData();\n  return result;\n}\n```\n\nThis code demonstrates the concept in action. The key thing to notice is how the function handles the data processing.\n\nLet me know if you'd like to see more examples or have any questions!",
];

const ChatView: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentChat = useAppSelector(selectCurrentChat);
  const { isStreaming } = useAppSelector((state) => state.ui);

  const [inputValue, setInputValue] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [selectedModel, setSelectedModel] = useState(MODEL_OPTIONS[0].id);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [dislikedIds, setDislikedIds] = useState<Set<string>>(new Set());

  const messagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const streamingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [currentChat?.messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [inputValue]);

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setShowModelDropdown(false);
      }
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setShowAttachMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check scroll position for scroll button
  const handleScroll = () => {
    if (messagesRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesRef.current;
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
    }
  };

  // Simulate streaming response
  useEffect(() => {
    if (isStreaming && currentChat) {
      const lastMessage = currentChat.messages[currentChat.messages.length - 1];
      if (lastMessage?.type === 'query') {
        // Pick a random response
        const responseText = SAMPLE_RESPONSES[Math.floor(Math.random() * SAMPLE_RESPONSES.length)];

        // Add empty assistant message
        dispatch(addMessage({
          chatId: currentChat.id,
          type: 'response',
          content: '',
        }));

        // Stream characters
        let charIndex = 0;
        const streamChar = () => {
          if (charIndex < responseText.length) {
            const charsToAdd = Math.min(3, responseText.length - charIndex);
            const newContent = responseText.slice(0, charIndex + charsToAdd);
            charIndex += charsToAdd;

            // Get the last message ID from the chat
            const storedChats = localStorage.getItem('araviel_chats');
            if (storedChats) {
              const chats = JSON.parse(storedChats);
              const chat = chats.find((c: { id: string }) => c.id === currentChat.id);
              if (chat && chat.messages.length > 0) {
                const lastMsg = chat.messages[chat.messages.length - 1];
                dispatch(updateMessageContent({
                  chatId: currentChat.id,
                  messageId: lastMsg.id,
                  content: newContent,
                }));
              }
            }

            streamingRef.current = setTimeout(streamChar, 20);
          } else {
            dispatch(setStreaming(false));
          }
        };

        // Start streaming after a short delay
        streamingRef.current = setTimeout(streamChar, 500);
      }
    }

    return () => {
      if (streamingRef.current) {
        clearTimeout(streamingRef.current);
      }
    };
  }, [isStreaming, currentChat?.id]);

  const scrollToBottom = () => {
    if (messagesRef.current) {
      messagesRef.current.scrollTo({
        top: messagesRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  const stopStreaming = () => {
    if (streamingRef.current) {
      clearTimeout(streamingRef.current);
    }
    dispatch(setStreaming(false));
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const attachment: FileAttachment = {
        id: uuidv4(),
        name: file.name,
        size: formatSize(file.size),
        type: file.type,
      };
      setAttachments((prev) => [...prev, attachment]);
    });

    setShowAttachMenu(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon size={14} />;
    if (type.includes('pdf') || type.includes('document')) return <FileTextIcon size={14} />;
    if (type.includes('javascript') || type.includes('typescript') || type.includes('json') || type.includes('text/')) {
      return <CodeIcon size={14} />;
    }
    return <FileIcon size={14} />;
  };

  const handleSubmit = () => {
    if (!inputValue.trim() && attachments.length === 0) return;
    if (!currentChat) return;

    // Add user message
    dispatch(addMessage({
      chatId: currentChat.id,
      type: 'query',
      content: inputValue.trim(),
      model: selectedModel,
      attachments: attachments.length > 0 ? attachments : undefined,
    }));

    // Start streaming
    dispatch(setStreaming(true));

    // Reset form
    setInputValue('');
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopy = async (content: string, messageId: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLike = (messageId: string) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
        setDislikedIds((d) => {
          const nd = new Set(d);
          nd.delete(messageId);
          return nd;
        });
      }
      return next;
    });
  };

  const handleDislike = (messageId: string) => {
    setDislikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
        setLikedIds((l) => {
          const nl = new Set(l);
          nl.delete(messageId);
          return nl;
        });
      }
      return next;
    });
  };

  const handleSpeak = (content: string) => {
    const utterance = new SpeechSynthesisUtterance(content.replace(/[#*`]/g, ''));
    window.speechSynthesis.speak(utterance);
  };

  const renderMessage = (message: Message) => {
    const isUser = message.type === 'query';
    const isLastAssistant = !isUser && currentChat?.messages[currentChat.messages.length - 1]?.id === message.id;

    return (
      <div
        key={message.id}
        className={`${styles.message} ${isUser ? styles.userMessage : styles.assistantMessage}`}
      >
        <div className={styles.messageAvatar}>
          {isUser ? (
            <Avatar name="User" size="md" />
          ) : (
            <div className={styles.assistantAvatar}>
              <AravielIcon size={20} />
            </div>
          )}
        </div>

        <div className={styles.messageContent}>
          <div className={styles.messageSender}>
            {isUser ? 'You' : 'Araviel'}
          </div>

          {message.attachments && message.attachments.length > 0 && (
            <div className={styles.messageAttachments}>
              {message.attachments.map((attachment) => (
                <div key={attachment.id} className={styles.messageAttachment}>
                  {getFileIcon(attachment.type)}
                  <span>{truncateText(attachment.name, 25)}</span>
                </div>
              ))}
            </div>
          )}

          <div
            className={styles.messageText}
            dangerouslySetInnerHTML={{
              __html: formatMessageContent(message.content),
            }}
          />

          {!isUser && message.content && (
            <div className={styles.messageActions}>
              <button
                className={`${styles.actionBtn} ${copiedId === message.id ? styles.copied : ''}`}
                onClick={() => handleCopy(message.content, message.id)}
                title="Copy"
              >
                <CopyIcon size={16} />
                {copiedId === message.id && <span className={styles.actionLabel}>Copied!</span>}
              </button>

              <button className={styles.actionBtn} title="Share">
                <ShareIcon size={16} />
              </button>

              <button
                className={`${styles.actionBtn} ${likedIds.has(message.id) ? styles.active : ''}`}
                onClick={() => handleLike(message.id)}
                title="Good response"
              >
                <ThumbsUpIcon size={16} />
              </button>

              <button
                className={`${styles.actionBtn} ${dislikedIds.has(message.id) ? styles.active : ''}`}
                onClick={() => handleDislike(message.id)}
                title="Bad response"
              >
                <ThumbsDownIcon size={16} />
              </button>

              <button
                className={styles.actionBtn}
                onClick={() => handleSpeak(message.content)}
                title="Read aloud"
              >
                <VolumeIcon size={16} />
              </button>
            </div>
          )}

          {isLastAssistant && isStreaming && (
            <div className={styles.streamingIndicator}>
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const selectedModelInfo = MODEL_OPTIONS.find((m) => m.id === selectedModel);

  if (!currentChat) return null;

  return (
    <div className={styles.chatView}>
      {/* Messages */}
      <div className={styles.messages} ref={messagesRef} onScroll={handleScroll}>
        <div className={styles.messagesInner}>
          {currentChat.messages.map(renderMessage)}
        </div>
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button className={styles.scrollButton} onClick={scrollToBottom}>
          <ChevronDownIcon size={20} />
        </button>
      )}

      {/* Input Area */}
      <div className={styles.inputArea}>
        <div className={styles.inputContainer}>
          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className={styles.attachmentsPreview}>
              {attachments.map((attachment) => (
                <div key={attachment.id} className={styles.attachmentItem}>
                  {getFileIcon(attachment.type)}
                  <span className={styles.attachmentName}>
                    {truncateText(attachment.name, 15)}
                  </span>
                  <button
                    className={styles.attachmentRemove}
                    onClick={() => removeAttachment(attachment.id)}
                  >
                    <XIcon size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className={styles.inputWrapper}>
            {/* Attachment Button */}
            <div className={styles.attachWrapper} ref={attachMenuRef}>
              <button
                className={styles.attachButton}
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                disabled={isStreaming}
              >
                <PaperclipIcon size={18} />
              </button>

              {showAttachMenu && (
                <div className={styles.attachMenu}>
                  <button
                    className={styles.attachOption}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileIcon size={16} />
                    <span>Upload file</span>
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className={styles.fileInput}
              />
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Continue the conversation..."
              className={styles.textarea}
              rows={1}
              disabled={isStreaming}
            />

            {/* Model Selector */}
            <div className={styles.modelWrapper} ref={modelDropdownRef}>
              <button
                className={styles.modelButton}
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                disabled={isStreaming}
              >
                <span>{selectedModelInfo?.name}</span>
                <ChevronDownIcon size={14} />
              </button>

              {showModelDropdown && (
                <div className={styles.modelDropdown}>
                  {MODEL_OPTIONS.map((model) => (
                    <button
                      key={model.id}
                      className={`${styles.modelOption} ${model.id === selectedModel ? styles.active : ''}`}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setShowModelDropdown(false);
                      }}
                    >
                      <span className={styles.modelName}>{model.name}</span>
                      <span className={styles.modelDesc}>{model.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Submit/Stop Button */}
            {isStreaming ? (
              <button className={styles.stopButton} onClick={stopStreaming}>
                <StopCircleIcon size={18} />
              </button>
            ) : (
              <button
                className={`${styles.submitButton} ${inputValue.trim() || attachments.length > 0 ? styles.active : ''}`}
                onClick={handleSubmit}
                disabled={!inputValue.trim() && attachments.length === 0}
              >
                <ArrowUpIcon size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple markdown-like formatting
function formatMessageContent(content: string): string {
  if (!content) return '';

  let formatted = content
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Headers
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    // Lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  // Wrap in paragraph
  formatted = `<p>${formatted}</p>`;

  // Fix list items
  formatted = formatted.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');

  return formatted;
}

export default ChatView;
