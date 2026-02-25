import { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectInputValue,
  selectMode,
  selectMessages,
  selectIsProcessing,
  selectSelectedModelId,
  selectCurrentChatId,
  selectWebSearchEnabled,
  setInputValue,
  setMode,
  addMessage,
  setIsProcessing,
  updateLastMessage,
  createNewChat,
  setCurrentChat,
  removeLastAssistantMessage,
  setWebSearchEnabled,
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
  StopIcon,
} from '../Icons';
import ModelSelector from '../ModelSelector/ModelSelector';
import MessageList from '../MessageList/MessageList';
import { sendMessage, consumeSSEStream } from '../../services/api';
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
      { text: 'Design a modern UI layout', icon: PuzzleIcon },
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
function createStages(status, modelName, isManualSelection) {
  const stages = [
    {
      label: isManualSelection ? 'Using selected model...' : 'Routing to optimal model...',
      status: 'pending',
      showModel: false,
    },
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
  const selectedModelId = useSelector(selectSelectedModelId);
  const currentChatId = useSelector(selectCurrentChatId);
  const webSearchEnabled = useSelector(selectWebSearchEnabled);

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showAttachDropdown, setShowAttachDropdown] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSubConvPanelOpen, setIsSubConvPanelOpen] = useState(false);
  const dropdownRef = useRef(null);
  const attachDropdownRef = useRef(null);
  const textareaRef = useRef(null);

  // Streaming / timeline state
  const [pipelineStatus, setPipelineStatus] = useState('idle'); // idle | routing | thinking | writing | complete
  const [routeResult, setRouteResult] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');

  // Stop-request state
  const [isManualRequest, setIsManualRequest] = useState(false);
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef(null);
  const completeTimeoutRef = useRef(null);

  const hasMessages = messages.length > 0;

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
   * Core SSE streaming pipeline. Used by handleSubmit, handleRetry, and handleAlternateModelRequest.
   * @param {string} prompt - User message text
   * @param {object} options
   * @param {string} [options.selectedModelId] - Manual model override
   * @param {string} [options.conversationId] - Existing conversation to continue
   * @param {boolean} [options.addUserMessage] - Whether to add a user message to Redux
   * @param {boolean|null} [options.webSearch] - Web search preference (null = auto)
   */
  const runSSEPipeline = useCallback(
    async (prompt, options = {}) => {
      const myRequestId = ++requestIdRef.current;
      const isManual = !!options.selectedModelId;
      setIsManualRequest(isManual);

      // Abort any previous in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      if (options.addUserMessage !== false) {
        const userMsg = {
          id: `user-${Date.now()}`,
          role: 'user',
          content: prompt,
          timestamp: Date.now(),
        };
        dispatch(addMessage(userMsg));
      }

      dispatch(setIsProcessing(true));
      setPipelineStatus('routing');
      setRouteResult(null);
      setIsStreaming(false);
      setStreamedText('');

      const routingStart = Date.now();
      let assistantMsgAdded = false;
      let accumulatedContent = '';
      let accumulatedThinking = '';
      let receivedDone = false;

      try {
        const webSearchParam =
          options.webSearch === true ? true : options.webSearch === false ? false : undefined;
        const response = await sendMessage({
          message: prompt,
          conversationId: options.conversationId || currentChatId || undefined,
          selectedModelId: options.selectedModelId || undefined,
          webSearch: webSearchParam,
        });

        if (abortController.signal.aborted || requestIdRef.current !== myRequestId) return;

        await consumeSSEStream(
          response,
          (event) => {
            if (abortController.signal.aborted || requestIdRef.current !== myRequestId) return;

            const { type, data } = event;

            if (type === 'routing') {
              const routingDuration = ((Date.now() - routingStart) / 1000).toFixed(1);

              // Save the conversationId from backend (may be newly created)
              if (data.conversationId) {
                dispatch(setCurrentChat(data.conversationId));
              }

              const routeData = {
                modelName: data.model?.name || 'AI',
                provider: data.model?.provider || 'anthropic',
                modelId: data.model?.id,
                score: data.confidence || data.model?.score,
                reasoning: data.model?.reasoning,
                analysis: data.analysis,
                isManualSelection: data.isManualSelection,
                upgradeHint: data.upgradeHint,
                providerHint: data.providerHint,
                webSearchUsed: data.webSearchUsed || false,
                webSearchAutoDetected: data.webSearchAutoDetected || false,
              };
              setRouteResult(routeData);
              setPipelineStatus('thinking');

              // Build alternate models list from backupModels
              const alternates = (data.backupModels || []).map((m) => ({
                modelId: m.id,
                modelName: m.name,
                provider: m.provider,
                score: m.score,
                reasoning: m.reasoning,
              }));

              // Add empty assistant message
              const assistantMsg = {
                id: data.messageId || `assistant-${Date.now()}`,
                role: 'assistant',
                content: '',
                timestamp: Date.now(),
                modelId: data.model?.id,
                modelName: data.model?.name || 'AI',
                provider: data.model?.provider || 'anthropic',
                score: data.confidence || data.model?.score,
                reasoning: data.model?.reasoning || 'Best match for your request',
                isManualSelection: data.isManualSelection || isManual,
                alternateModels: alternates,
                analysis: data.analysis,
                upgradeHint: data.upgradeHint,
                providerHint: data.providerHint,
                webSearchUsed: data.webSearchUsed || false,
                webSearchAutoDetected: data.webSearchAutoDetected || false,
                thinkingData: {
                  routingDuration,
                  thinkingDuration: '0.0',
                  totalDuration: routingDuration,
                },
              };
              dispatch(addMessage(assistantMsg));
              assistantMsgAdded = true;
            } else if (type === 'thinking') {
              accumulatedThinking += data.content || '';
              if (assistantMsgAdded) {
                dispatch(updateLastMessage({ thinkingContent: accumulatedThinking }));
              }
            } else if (type === 'delta') {
              setPipelineStatus('writing');
              accumulatedContent += data.content || '';
              setStreamedText(accumulatedContent);
              setIsStreaming(true);
              if (assistantMsgAdded) {
                dispatch(updateLastMessage({ content: accumulatedContent }));
              }
            } else if (type === 'tool_use') {
              if (assistantMsgAdded) {
                dispatch(updateLastMessage({ toolUse: data }));
                // If the tool is web_search, mark the message as having used web search
                if (data.tool === 'web_search') {
                  dispatch(updateLastMessage({ webSearchUsed: true }));
                }
              }
            } else if (type === 'citations') {
              if (assistantMsgAdded && data.citations) {
                dispatch(updateLastMessage({ citations: data.citations }));
              }
            } else if (type === 'done') {
              receivedDone = true;
              const totalDuration = ((Date.now() - routingStart) / 1000).toFixed(1);
              if (assistantMsgAdded) {
                dispatch(
                  updateLastMessage({
                    usage: data.usage,
                    costUsd: data.usage?.costUsd,
                    latencyMs: data.latencyMs,
                    adeLatencyMs: data.adeLatencyMs,
                    thinkingData: {
                      routingDuration: ((data.adeLatencyMs || 0) / 1000).toFixed(1),
                      thinkingDuration: '0.0',
                      totalDuration,
                    },
                  })
                );
              }
            } else if (type === 'error') {
              if (data.code === 'PROVIDER_RETRY') {
                // Non-fatal — show a brief notification but keep listening
                if (assistantMsgAdded) {
                  dispatch(updateLastMessage({ providerRetry: true }));
                }
              } else {
                // Fatal error
                if (assistantMsgAdded) {
                  dispatch(
                    updateLastMessage({
                      content: accumulatedContent || '',
                      error: {
                        message: data.message,
                        code: data.code,
                        suggestedPlatforms: data.suggestedPlatforms,
                      },
                    })
                  );
                }
              }
            }
          },
          abortController.signal
        );
      } catch (err) {
        if (abortController.signal.aborted || requestIdRef.current !== myRequestId) return;
        // Network or fetch error
        if (assistantMsgAdded) {
          dispatch(
            updateLastMessage({
              content: accumulatedContent || '',
              error: { message: err.message || 'Connection failed', code: 'INTERNAL_ERROR' },
            })
          );
        } else {
          // No assistant message was added yet — add an error message
          dispatch(
            addMessage({
              id: `error-${Date.now()}`,
              role: 'assistant',
              content: '',
              timestamp: Date.now(),
              error: { message: err.message || 'Connection failed', code: 'INTERNAL_ERROR' },
            })
          );
        }
      }

      if (requestIdRef.current !== myRequestId) return;

      // Stream ended — handle timeout (no done event)
      if (!receivedDone && accumulatedContent) {
        dispatch(updateLastMessage({ streamTimeout: true }));
      }

      // Finalize
      setPipelineStatus('complete');
      setIsStreaming(false);
      dispatch(setIsProcessing(false));

      // Brief delay then clear timeline
      const id = requestIdRef.current;
      completeTimeoutRef.current = setTimeout(() => {
        if (requestIdRef.current !== id) return;
        setPipelineStatus('idle');
        setRouteResult(null);
        setStreamedText('');
      }, 600);
    },
    [dispatch, currentChatId]
  );

  /**
   * Main submit handler.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const prompt = inputValue.trim();
    if (!prompt || isProcessing) return;

    dispatch(setInputValue(''));
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setActiveDropdown(null);
    setShowAttachDropdown(false);

    await runSSEPipeline(prompt, {
      selectedModelId: selectedModelId || undefined,
      addUserMessage: true,
      webSearch: webSearchEnabled,
    });
  };

  /**
   * Stop handler.
   */
  const handleStop = useCallback(() => {
    requestIdRef.current++;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (completeTimeoutRef.current) {
      clearTimeout(completeTimeoutRef.current);
      completeTimeoutRef.current = null;
    }

    setIsStreaming(false);
    setStreamedText('');
    setPipelineStatus('idle');
    setRouteResult(null);
    setIsManualRequest(false);
    dispatch(setIsProcessing(false));
  }, [dispatch]);

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

  const focusInput = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

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
    requestIdRef.current++;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (completeTimeoutRef.current) {
      clearTimeout(completeTimeoutRef.current);
      completeTimeoutRef.current = null;
    }

    dispatch(createNewChat());
    dispatch(setInputValue(''));
    setActiveDropdown(null);
    setPipelineStatus('idle');
    setIsStreaming(false);
    setStreamedText('');
    setRouteResult(null);
    setIsManualRequest(false);
  };

  /**
   * Retry handler.
   */
  const handleRetry = useCallback(
    async (userPrompt) => {
      if (isProcessing) return;
      dispatch(removeLastAssistantMessage());

      await new Promise((resolve) => setTimeout(resolve, 150));

      await runSSEPipeline(userPrompt, {
        selectedModelId: selectedModelId || undefined,
        conversationId: currentChatId || undefined,
        addUserMessage: false,
        webSearch: webSearchEnabled,
      });
    },
    [dispatch, isProcessing, selectedModelId, currentChatId, runSSEPipeline, webSearchEnabled]
  );

  /**
   * Alternate model request handler.
   */
  const handleAlternateModelRequest = useCallback(
    async (userPrompt, alternateModel) => {
      if (isProcessing) return;

      await new Promise((resolve) => setTimeout(resolve, 150));

      await runSSEPipeline(userPrompt, {
        selectedModelId: alternateModel.modelId,
        conversationId: currentChatId || undefined,
        addUserMessage: false,
      });
    },
    [isProcessing, currentChatId, runSSEPipeline]
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
      ? createStages(pipelineStatus, routeResult ? routeResult.modelName : null, isManualRequest)
      : null;

  return (
    <main
      className={`${styles.main} ${hasMessages ? styles.hasMessages : ''} ${
        isSubConvPanelOpen ? styles.subConvPanelOpen : ''
      }`}
    >
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
          onAlternateModelRequest={handleAlternateModelRequest}
          onSubConvPanelToggle={setIsSubConvPanelOpen}
          focusInput={focusInput}
          currentChatId={currentChatId}
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
                  <button
                    type="button"
                    className={`${styles.webSearchToggle} ${
                      webSearchEnabled === true ? styles.webSearchToggleOn : ''
                    } ${webSearchEnabled === null ? styles.webSearchToggleAuto : ''}`}
                    onClick={() => {
                      // Cycle: null (auto) → true (on) → false (off) → null (auto)
                      if (webSearchEnabled === null) {
                        dispatch(setWebSearchEnabled(true));
                      } else if (webSearchEnabled === true) {
                        dispatch(setWebSearchEnabled(false));
                      } else {
                        dispatch(setWebSearchEnabled(null));
                      }
                    }}
                    disabled={isProcessing}
                    title={
                      webSearchEnabled === true
                        ? 'Web search: On'
                        : webSearchEnabled === false
                        ? 'Web search: Off'
                        : 'Web search: Auto'
                    }
                    aria-label="Toggle web search"
                  >
                    <GlobeIcon />
                    <span className={styles.webSearchToggleLabel}>
                      {webSearchEnabled === true
                        ? 'Search'
                        : webSearchEnabled === false
                        ? 'Search off'
                        : 'Search'}
                    </span>
                  </button>
                </div>
                {isProcessing ? (
                  <button
                    type="button"
                    className={styles.stopBtn}
                    onClick={handleStop}
                    aria-label="Stop request"
                  >
                    <span className={styles.stopBtnRing} />
                    <StopIcon />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className={`${styles.submitBtn} ${inputValue.trim() ? styles.active : ''}`}
                    disabled={!inputValue.trim()}
                    aria-label="Send message"
                  >
                    <SendIcon />
                  </button>
                )}
              </div>
            </div>
          </form>
          <p className={styles.disclaimer}>
            Araviel can make mistakes. Please verify important information.
          </p>

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
