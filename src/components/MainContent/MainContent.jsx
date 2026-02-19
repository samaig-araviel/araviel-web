import { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectInputValue,
  selectMode,
  selectMessages,
  selectIsProcessing,
  setInputValue,
  setMode,
  addMessage,
  setIsProcessing,
  updateLastMessage,
  createNewChat,
  removeLastAssistantMessage,
} from '../../store/slices/chatSlice';
import {
  SendIcon,
  CodeIcon,
  PenIcon,
  CloseIcon,
  SearchIcon,
  ChartIcon,
  SparkleIcon,
  BookIcon,
  NewChatIcon,
  PlusIcon,
  CameraIcon,
  FilePlusIcon,
  GlobeIcon,
  MicIcon,
  BugIcon,
  LightbulbIcon,
  ZapIcon,
  MailIcon,
  FileTextIcon,
  CopyIcon,
  TrendingUpIcon,
  ClipboardIcon,
  EyeIcon,
  PuzzleIcon,
  LayersIcon,
  HelpCircleIcon,
  ShareIcon,
  LinkIcon,
  CheckIcon,
} from '../Icons';
import ModelSelector from '../ModelSelector/ModelSelector';
import MessageList from '../MessageList/MessageList';
import useStreamingText from '../../hooks/useStreamingText';
import { routePrompt } from '../../services/adeApi';
import { generateMockResponse } from '../../services/mockResponseGenerator';
import { MODELS } from '../../data/models';
import styles from './MainContent.module.css';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning.';
  if (hour < 18) return 'Good afternoon.';
  return 'Good evening.';
};

const promptsData = {
  code: {
    title: 'Code',
    icon: CodeIcon,
    items: [
      { text: 'Debug my code', icon: BugIcon },
      { text: 'Write a function', icon: CodeIcon },
      { text: 'Explain this code', icon: LightbulbIcon },
      { text: 'Optimize performance', icon: ZapIcon },
    ],
  },
  write: {
    title: 'Write',
    icon: PenIcon,
    items: [
      { text: 'Draft an email', icon: MailIcon },
      { text: 'Summarize content', icon: FileTextIcon },
      { text: 'Create marketing copy', icon: CopyIcon },
      { text: 'Write documentation', icon: ClipboardIcon },
    ],
  },
  research: {
    title: 'Research',
    icon: SearchIcon,
    items: [
      { text: 'Find information', icon: SearchIcon },
      { text: 'Compare alternatives', icon: LayersIcon },
      { text: 'Analyze market trends', icon: TrendingUpIcon },
      { text: 'Summarize findings', icon: ClipboardIcon },
    ],
  },
  analyze: {
    title: 'Analyze',
    icon: ChartIcon,
    items: [
      { text: 'Review this data', icon: EyeIcon },
      { text: 'Find patterns', icon: PuzzleIcon },
      { text: 'Generate insights', icon: LightbulbIcon },
      { text: 'Create a report', icon: ClipboardIcon },
    ],
  },
  create: {
    title: 'Create',
    icon: SparkleIcon,
    items: [
      { text: 'Generate ideas', icon: LightbulbIcon },
      { text: 'Design a solution', icon: PuzzleIcon },
      { text: 'Build a prototype', icon: LayersIcon },
      { text: 'Create content', icon: SparkleIcon },
    ],
  },
  learn: {
    title: 'Learn',
    icon: BookIcon,
    items: [
      { text: 'Explain a concept', icon: LightbulbIcon },
      { text: 'Teach me about this', icon: BookIcon },
      { text: 'Break down this topic', icon: LayersIcon },
      { text: 'Quiz me on this', icon: HelpCircleIcon },
    ],
  },
};

const attachOptions = [
  { id: 'files', label: 'Add files or Photos', icon: FilePlusIcon },
  { id: 'camera', label: 'Camera', icon: CameraIcon },
  { id: 'websearch', label: 'Web Search', icon: GlobeIcon },
  { id: 'research', label: 'Research', icon: BookIcon },
  { id: 'tone', label: 'Tone', icon: MicIcon },
];

const quickPromptKeys = ['code', 'write', 'research', 'analyze', 'create', 'learn'];

// Timeline stage factory
function createStages(status, modelName) {
  const stages = [
    { label: 'Routing to optimal model...', status: 'pending', showModel: false },
    {
      label: modelName ? `Thinking with` : 'Thinking...',
      status: 'pending',
      showModel: true,
    },
    { label: 'Writing response...', status: 'pending', showModel: false },
  ];

  if (status === 'routing') {
    stages[0].status = 'active';
  } else if (status === 'thinking') {
    stages[0].status = 'complete';
    stages[1].status = 'active';
  } else if (status === 'writing') {
    stages[0].status = 'complete';
    stages[1].status = 'complete';
    stages[2].status = 'active';
  } else if (status === 'complete') {
    stages[0].status = 'complete';
    stages[1].status = 'complete';
    stages[2].status = 'complete';
  }

  return stages;
}

/**
 * Share modal component.
 */
function ShareModal({ onClose }) {
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopyLink = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    });
  };

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className={styles.shareOverlay} onClick={onClose}>
      <div className={styles.shareModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.shareModalHeader}>
          <h3>Share conversation</h3>
          <button className={styles.shareModalClose} onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <p className={styles.shareModalDesc}>
          Create a public link to share this conversation. Anyone with the link will be able to view
          it.
        </p>

        <div className={styles.shareModalPreview}>
          <div className={styles.sharePreviewIcon}>
            <SparkleIcon />
          </div>
          <div className={styles.sharePreviewInfo}>
            <span className={styles.sharePreviewTitle}>Araviel Conversation</span>
            <span className={styles.sharePreviewUrl}>araviel.com/share/...</span>
          </div>
        </div>

        <div className={styles.shareModalActions}>
          <button
            className={`${styles.shareActionBtn} ${styles.shareCopyBtn} ${
              linkCopied ? styles.copied : ''
            }`}
            onClick={handleCopyLink}
          >
            {linkCopied ? (
              <>
                <CheckIcon />
                <span>Link copied</span>
              </>
            ) : (
              <>
                <LinkIcon />
                <span>Copy link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MainContent() {
  const dispatch = useDispatch();
  const inputValue = useSelector(selectInputValue);
  const mode = useSelector(selectMode);
  const messages = useSelector(selectMessages);
  const isProcessing = useSelector(selectIsProcessing);

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showAttachDropdown, setShowAttachDropdown] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const dropdownRef = useRef(null);
  const attachDropdownRef = useRef(null);
  const textareaRef = useRef(null);

  // Streaming / timeline state
  const [pipelineStatus, setPipelineStatus] = useState('idle'); // idle | routing | thinking | writing | complete
  const [routeResult, setRouteResult] = useState(null);
  const [fullResponseText, setFullResponseText] = useState('');
  const [shouldStream, setShouldStream] = useState(false);

  const hasMessages = messages.length > 0;

  // Streaming hook
  const { streamedText, isStreaming } = useStreamingText(fullResponseText, shouldStream, {
    baseDelay: 25,
    variance: 18,
    punctuationPause: 70,
    paragraphPause: 120,
    onComplete: useCallback(() => {
      // Ensure final content is persisted in Redux
      dispatch(updateLastMessage({ content: fullResponseText }));
      setPipelineStatus('complete');
      dispatch(setIsProcessing(false));

      // Brief delay then clear timeline
      setTimeout(() => {
        setPipelineStatus('idle');
        setShouldStream(false);
        setFullResponseText('');
        setRouteResult(null);
      }, 600);
    }, [dispatch, fullResponseText]),
  });

  // Update the assistant message content as streaming progresses
  useEffect(() => {
    if (isStreaming && streamedText) {
      dispatch(updateLastMessage({ content: streamedText }));
    }
  }, [streamedText, isStreaming, dispatch]);

  // Click-outside handlers
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        const clickedOnQuickPrompt = e.target.closest(`.${styles.actionBtn}`);
        if (!clickedOnQuickPrompt) {
          setActiveDropdown(null);
        }
      }
      if (attachDropdownRef.current && !attachDropdownRef.current.contains(e.target)) {
        const clickedOnAttach = e.target.closest(`.${styles.attachBtn}`);
        if (!clickedOnAttach) {
          setShowAttachDropdown(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
        setShowAttachDropdown(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Auto-resize textarea
  const autoResizeTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const lineHeight = 24;
      const maxHeight = lineHeight * 15;
      textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
    }
  };

  const handleInputChange = (e) => {
    dispatch(setInputValue(e.target.value));
    autoResizeTextarea();
  };

  useEffect(() => {
    autoResizeTextarea();
  }, [inputValue]);

  // Focus textarea when not processing
  useEffect(() => {
    if (!isProcessing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isProcessing, messages.length]);

  /**
   * Main submit handler: orchestrates the full ADE pipeline.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const prompt = inputValue.trim();
    if (!prompt || isProcessing) return;

    // 1. Add user message
    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
    };
    dispatch(addMessage(userMsg));
    dispatch(setInputValue(''));
    dispatch(setIsProcessing(true));

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Close dropdowns
    setActiveDropdown(null);
    setShowAttachDropdown(false);

    // 2. Stage 1: Routing
    setPipelineStatus('routing');

    let routing;
    try {
      // Simulate a minimum routing time for visual effect
      const [result] = await Promise.all([
        routePrompt(prompt),
        new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 400)),
      ]);
      routing = result;
    } catch {
      routing = {
        modelId: 'claude-sonnet-4-5-20250929',
        modelName: 'Claude Sonnet 4.5',
        provider: 'anthropic',
        score: 0.88,
        reasoning: 'Fallback routing',
      };
    }

    // Resolve model name from our registry if not provided
    const model = MODELS.find((m) => m.id === routing.modelId);
    const resolvedModelName = routing.modelName || (model ? model.name : routing.modelId);
    const resolvedProvider = routing.provider || (model ? model.provider : 'anthropic');

    setRouteResult({
      ...routing,
      modelName: resolvedModelName,
      provider: resolvedProvider,
    });

    // 3. Stage 2: Thinking
    setPipelineStatus('thinking');

    // Generate mock response
    const responseText = generateMockResponse(
      prompt,
      resolvedProvider,
      resolvedModelName,
      routing.score
    );

    // Simulate thinking time based on response complexity
    const thinkingTime = 800 + Math.min(responseText.length * 0.8, 2000) + Math.random() * 600;
    await new Promise((resolve) => setTimeout(resolve, thinkingTime));

    // 4. Stage 3: Writing (streaming)
    setPipelineStatus('writing');

    // Add empty assistant message that will be filled by streaming
    const assistantMsg = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      modelId: routing.modelId,
      modelName: resolvedModelName,
      provider: resolvedProvider,
      score: routing.score,
      reasoning: routing.reasoning || 'Best match for your request',
    };
    dispatch(addMessage(assistantMsg));

    // Start streaming
    setFullResponseText(responseText);
    setShouldStream(true);
  };

  const handleModeClick = (newMode) => {
    if (activeDropdown === newMode) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(newMode);
      setShowAttachDropdown(false);
      dispatch(setMode(newMode));
    }
  };

  const handlePromptSelect = (text) => {
    dispatch(setInputValue(text + ' '));
    setActiveDropdown(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleCloseDropdown = () => {
    setActiveDropdown(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleNewChat = () => {
    dispatch(createNewChat());
    dispatch(setInputValue(''));
    setActiveDropdown(null);
    setPipelineStatus('idle');
    setShouldStream(false);
    setFullResponseText('');
    setRouteResult(null);
  };

  /**
   * Retry handler: removes last assistant message and re-runs the pipeline.
   */
  const handleRetry = useCallback(
    async (userPrompt) => {
      if (isProcessing) return;

      // Remove the last assistant message
      dispatch(removeLastAssistantMessage());

      // Reset pipeline state
      setPipelineStatus('idle');
      setShouldStream(false);
      setFullResponseText('');
      setRouteResult(null);

      // Small delay for visual feedback before restarting
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Re-run the pipeline
      dispatch(setIsProcessing(true));
      setPipelineStatus('routing');

      let routing;
      try {
        const [result] = await Promise.all([
          routePrompt(userPrompt),
          new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 400)),
        ]);
        routing = result;
      } catch {
        routing = {
          modelId: 'claude-sonnet-4-5-20250929',
          modelName: 'Claude Sonnet 4.5',
          provider: 'anthropic',
          score: 0.88,
          reasoning: 'Fallback routing',
        };
      }

      const model = MODELS.find((m) => m.id === routing.modelId);
      const resolvedModelName = routing.modelName || (model ? model.name : routing.modelId);
      const resolvedProvider = routing.provider || (model ? model.provider : 'anthropic');

      setRouteResult({
        ...routing,
        modelName: resolvedModelName,
        provider: resolvedProvider,
      });

      setPipelineStatus('thinking');

      const responseText = generateMockResponse(
        userPrompt,
        resolvedProvider,
        resolvedModelName,
        routing.score
      );

      const thinkingTime = 800 + Math.min(responseText.length * 0.8, 2000) + Math.random() * 600;
      await new Promise((resolve) => setTimeout(resolve, thinkingTime));

      setPipelineStatus('writing');

      const assistantMsg = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        modelId: routing.modelId,
        modelName: resolvedModelName,
        provider: resolvedProvider,
        score: routing.score,
        reasoning: routing.reasoning || 'Best match for your request',
      };
      dispatch(addMessage(assistantMsg));

      setFullResponseText(responseText);
      setShouldStream(true);
    },
    [dispatch, isProcessing]
  );

  const handleAttachClick = () => {
    setShowAttachDropdown(!showAttachDropdown);
    setActiveDropdown(null);
  };

  const handleAttachOptionClick = (optionId) => {
    console.log('Attach option selected:', optionId);
    setShowAttachDropdown(false);
  };

  const currentPromptData = activeDropdown ? promptsData[activeDropdown] : null;

  // Build timeline stages
  const timelineStages =
    pipelineStatus !== 'idle'
      ? createStages(pipelineStatus, routeResult ? routeResult.modelName : null)
      : null;

  return (
    <main className={`${styles.main} ${hasMessages ? styles.hasMessages : ''}`}>
      {/* Top nav bar with share + new chat buttons */}
      <div className={styles.topNav}>
        <div className={styles.topNavInner}>
          <button
            className={styles.shareBtn}
            onClick={() => setShowShareModal(true)}
            title="Share"
            aria-label="Share conversation"
          >
            <ShareIcon />
          </button>
          <button
            className={styles.newChatBtn}
            onClick={handleNewChat}
            title="New Chat"
            aria-label="Start new chat"
          >
            <NewChatIcon />
          </button>
        </div>
      </div>

      {/* Share modal */}
      {showShareModal && <ShareModal onClose={() => setShowShareModal(false)} />}

      {/* Messages area — only shown when there are messages */}
      {hasMessages && (
        <MessageList
          messages={messages}
          isProcessing={pipelineStatus !== 'idle'}
          timelineStages={timelineStages}
          timelineFading={pipelineStatus === 'complete'}
          modelName={routeResult ? routeResult.modelName : null}
          provider={routeResult ? routeResult.provider : null}
          isStreaming={isStreaming}
          streamedText={streamedText}
          onRetry={handleRetry}
        />
      )}

      <div className={`${styles.container} ${hasMessages ? styles.containerBottom : ''}`}>
        {/* Greeting — only when no messages */}
        {!hasMessages && (
          <>
            <h1 className={styles.greeting}>{getGreeting()}</h1>
            <p className={styles.subtitle}>What can I help you orchestrate today?</p>
          </>
        )}

        <div className={styles.inputSection}>
          <form className={styles.inputContainer} onSubmit={handleSubmit}>
            <div className={styles.inputWrapper}>
              <textarea
                ref={textareaRef}
                className={styles.input}
                placeholder={hasMessages ? 'Reply...' : 'Ask anything...'}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={isProcessing}
                rows={1}
                aria-label="Message input"
              />
              <div className={styles.inputActions}>
                <div className={styles.leftActions}>
                  <button
                    type="button"
                    className={`${styles.attachBtn} ${showAttachDropdown ? styles.active : ''}`}
                    onClick={handleAttachClick}
                    aria-label="Add content"
                    disabled={isProcessing}
                  >
                    <PlusIcon />
                  </button>
                  {showAttachDropdown && (
                    <div className={styles.attachDropdown} ref={attachDropdownRef}>
                      {attachOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.id}
                            className={styles.attachOption}
                            onClick={() => handleAttachOptionClick(option.id)}
                          >
                            <Icon />
                            <span>{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <ModelSelector />
                </div>
                <button
                  type="submit"
                  className={`${styles.submitBtn} ${
                    inputValue.trim() && !isProcessing ? styles.active : ''
                  }`}
                  disabled={!inputValue.trim() || isProcessing}
                  aria-label="Send message"
                >
                  {isProcessing ? <span className={styles.sendSpinner} /> : <SendIcon />}
                </button>
              </div>
            </div>
          </form>

          {!hasMessages && activeDropdown && currentPromptData && (
            <div className={styles.promptsDropdown} ref={dropdownRef}>
              <div className={styles.dropdownHeader}>
                <div className={styles.dropdownTitleWrapper}>
                  <currentPromptData.icon />
                  <span className={styles.dropdownTitle}>{currentPromptData.title}</span>
                </div>
                <button
                  className={styles.dropdownClose}
                  onClick={handleCloseDropdown}
                  aria-label="Close"
                >
                  <CloseIcon />
                </button>
              </div>
              <div className={styles.promptsList}>
                {currentPromptData.items.map((item, index) => {
                  const ItemIcon = item.icon;
                  return (
                    <button
                      key={index}
                      className={styles.promptItem}
                      onClick={() => handlePromptSelect(item.text)}
                    >
                      <span className={styles.promptItemIcon}>
                        <ItemIcon />
                      </span>
                      <span>{item.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {!hasMessages && (
          <div className={styles.actionButtons}>
            {quickPromptKeys.map((key) => {
              const data = promptsData[key];
              const Icon = data.icon;
              return (
                <button
                  key={key}
                  className={`${styles.actionBtn} ${
                    activeDropdown === key ? styles.activeAction : ''
                  }`}
                  onClick={() => handleModeClick(key)}
                >
                  <Icon />
                  <span>{data.title}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
