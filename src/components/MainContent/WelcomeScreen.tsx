import React, { useState, useRef, useEffect } from 'react';
import { useAppDispatch } from '../../store';
import { createChat, addMessage } from '../../store/chatSlice';
import { openModal, setStreaming } from '../../store/uiSlice';
import { ACTION_BUTTONS, MODEL_OPTIONS } from '../../types';
import type { FileAttachment } from '../../types';
import {
  AravielIcon,
  PaperclipIcon,
  ChevronDownIcon,
  ArrowUpIcon,
  XIcon,
  FileTextIcon,
  ImageIcon,
  CodeIcon,
  FileIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '../Icons';
import { getDynamicGreeting, truncateText } from '../../utils/formatters';
import { v4 as uuidv4 } from 'uuid';
import styles from './WelcomeScreen.module.css';

const WelcomeScreen: React.FC = () => {
  const dispatch = useAppDispatch();

  const [inputValue, setInputValue] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [selectedModel, setSelectedModel] = useState(MODEL_OPTIONS[0].id);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
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

  // Check scroll state for action buttons
  const checkScrollState = () => {
    if (actionsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = actionsRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollState();
    const actionsEl = actionsRef.current;
    if (actionsEl) {
      actionsEl.addEventListener('scroll', checkScrollState);
      window.addEventListener('resize', checkScrollState);
      return () => {
        actionsEl.removeEventListener('scroll', checkScrollState);
        window.removeEventListener('resize', checkScrollState);
      };
    }
  }, []);

  const scrollActions = (direction: 'left' | 'right') => {
    if (actionsRef.current) {
      const scrollAmount = 200;
      actionsRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const maxFiles = 10;
    const currentCount = attachments.length;

    if (currentCount + files.length > maxFiles) {
      dispatch(openModal({ type: 'fileLimit' }));
      return;
    }

    Array.from(files).forEach((file) => {
      const attachment: FileAttachment = {
        id: uuidv4(),
        name: file.name,
        size: formatSize(file.size),
        type: file.type,
      };

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setAttachments((prev) => [...prev, { ...attachment, preview: reader.result as string }]);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachments((prev) => [...prev, attachment]);
      }
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
    if (type.startsWith('image/')) return <ImageIcon size={16} />;
    if (type.includes('pdf') || type.includes('document')) return <FileTextIcon size={16} />;
    if (type.includes('javascript') || type.includes('typescript') || type.includes('json') || type.includes('text/')) {
      return <CodeIcon size={16} />;
    }
    return <FileIcon size={16} />;
  };

  const handleSubmit = () => {
    if (!inputValue.trim() && attachments.length === 0) return;

    const chatTitle = inputValue.trim().slice(0, 50) || 'New conversation';

    // Create new chat (this also sets it as current)
    dispatch(createChat({
      projectId: null,
      title: chatTitle,
    }));

    // We need to get the chat ID from the store after creation
    // For now, we'll add the message with a slight delay
    setTimeout(() => {
      const stored = localStorage.getItem('araviel_active_state');
      if (stored) {
        const { chatId } = JSON.parse(stored);
        if (chatId) {
          // Add user message
          dispatch(addMessage({
            chatId,
            type: 'query',
            content: inputValue.trim(),
            model: selectedModel,
            attachments: attachments.length > 0 ? attachments : undefined,
          }));

          // Start streaming response
          dispatch(setStreaming(true));
        }
      }
    }, 10);

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

  const handleActionClick = (actionLabel: string) => {
    setInputValue(actionLabel);
    textareaRef.current?.focus();
  };

  const selectedModelInfo = MODEL_OPTIONS.find((m) => m.id === selectedModel);

  return (
    <div className={styles.welcomeScreen}>
      <div className={styles.welcomeContent}>
        {/* Greeting */}
        <div className={styles.greeting}>
          <AravielIcon size={48} className={styles.logo} />
          <h1 className={styles.greetingText}>{getDynamicGreeting()}</h1>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionsContainer}>
          {canScrollLeft && (
            <button
              className={`${styles.scrollButton} ${styles.scrollLeft}`}
              onClick={() => scrollActions('left')}
              aria-label="Scroll left"
            >
              <ChevronLeftIcon size={16} />
            </button>
          )}

          <div className={styles.actions} ref={actionsRef}>
            {ACTION_BUTTONS.map((action) => (
              <button
                key={action.id}
                className={styles.actionButton}
                onClick={() => handleActionClick(action.label)}
              >
                {action.label}
              </button>
            ))}
          </div>

          {canScrollRight && (
            <button
              className={`${styles.scrollButton} ${styles.scrollRight}`}
              onClick={() => scrollActions('right')}
              aria-label="Scroll right"
            >
              <ChevronRightIcon size={16} />
            </button>
          )}
        </div>

        {/* Chat Input */}
        <div className={styles.inputContainer}>
          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className={styles.attachmentsPreview}>
              {attachments.map((attachment) => (
                <div key={attachment.id} className={styles.attachmentItem}>
                  {attachment.preview ? (
                    <img
                      src={attachment.preview}
                      alt={attachment.name}
                      className={styles.attachmentImage}
                    />
                  ) : (
                    <div className={styles.attachmentFile}>
                      {getFileIcon(attachment.type)}
                    </div>
                  )}
                  <div className={styles.attachmentInfo}>
                    <span className={styles.attachmentName}>
                      {truncateText(attachment.name, 20)}
                    </span>
                    <span className={styles.attachmentSize}>
                      {attachment.size}
                    </span>
                  </div>
                  <button
                    className={styles.attachmentRemove}
                    onClick={() => removeAttachment(attachment.id)}
                    aria-label="Remove attachment"
                  >
                    <XIcon size={14} />
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
                aria-label="Attach file"
              >
                <PaperclipIcon size={20} />
              </button>

              {showAttachMenu && (
                <div className={styles.attachMenu}>
                  <button
                    className={styles.attachOption}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileIcon size={18} />
                    <span>Upload from computer</span>
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className={styles.fileInput}
                accept="image/*,.pdf,.doc,.docx,.txt,.js,.ts,.jsx,.tsx,.json,.md,.csv"
              />
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              className={styles.textarea}
              rows={1}
            />

            {/* Model Selector */}
            <div className={styles.modelWrapper} ref={modelDropdownRef}>
              <button
                className={styles.modelButton}
                onClick={() => setShowModelDropdown(!showModelDropdown)}
              >
                <span className={styles.modelName}>{selectedModelInfo?.name}</span>
                <ChevronDownIcon size={16} />
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
                      <div className={styles.modelInfo}>
                        <span className={styles.modelOptionName}>{model.name}</span>
                        <span className={styles.modelDescription}>{model.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              className={`${styles.submitButton} ${inputValue.trim() || attachments.length > 0 ? styles.active : ''}`}
              onClick={handleSubmit}
              disabled={!inputValue.trim() && attachments.length === 0}
              aria-label="Send message"
            >
              <ArrowUpIcon size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
