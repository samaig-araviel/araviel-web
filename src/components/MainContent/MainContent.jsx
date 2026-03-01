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
  selectExtendedThinking,
  selectDeepResearch,
  selectGoogleThinking,
  setInputValue,
  setMode,
  addMessage,
  setIsProcessing,
  updateLastMessage,
  createNewChat,
  setCurrentChat,
  removeLastAssistantMessage,
  setWebSearchEnabled,
  setExtendedThinking,
  setDeepResearch,
  setGoogleThinking,
  selectTone,
  selectMood,
  selectAutoStrategy,
  setTone,
  setMood,
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
  PhotoIcon,
  FileIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  BrainIcon,
  BeakerIcon,
  CpuIcon,
  MapPinIcon,
  SmileIcon,
} from '../Icons';
import ModelSelector from '../ModelSelector/ModelSelector';
import MessageList from '../MessageList/MessageList';
import { sendMessage, consumeSSEStream } from '../../services/api';
import { getUserTier, PROVIDERS } from '../../data/models';
import { selectEffectiveTheme } from '../../store/slices/themeSlice';
import useUserLocation from '../../hooks/useUserLocation';
import styles from './MainContent.module.css';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning.';
  if (hour < 18) return 'Good afternoon.';
  return 'Good evening.';
};

const MODE_CONFIG = [
  {
    key: 'extendedThinking',
    label: 'Extended Thinking',
    description: 'Deep chain-of-thought reasoning',
    providerLabel: 'Claude',
    providerId: 'anthropic',
    Icon: BrainIcon,
    action: setExtendedThinking,
  },
  {
    key: 'deepResearch',
    label: 'Deep Research',
    description: 'Multi-step research & analysis',
    providerLabel: 'OpenAI',
    providerId: 'openai',
    Icon: BeakerIcon,
    action: setDeepResearch,
  },
  {
    key: 'googleThinking',
    label: 'Thinking Mode',
    description: 'Enhanced reasoning with Gemini',
    providerLabel: 'Gemini',
    providerId: 'google',
    Icon: CpuIcon,
    action: setGoogleThinking,
  },
];

// Tone options matching ADE Tone enum
const TONE_OPTIONS = [
  { id: null, label: 'Auto-detect', desc: 'ADE detects tone from your message' },
  { id: 'casual', label: 'Casual', desc: 'Relaxed, informal conversation' },
  { id: 'focused', label: 'Focused', desc: 'Clear and direct responses' },
  { id: 'curious', label: 'Curious', desc: 'Exploratory and inquisitive' },
  { id: 'frustrated', label: 'Frustrated', desc: 'Patient, empathetic responses' },
  { id: 'urgent', label: 'Urgent', desc: 'Quick, action-oriented answers' },
  { id: 'playful', label: 'Playful', desc: 'Fun and lighthearted style' },
  { id: 'professional', label: 'Professional', desc: 'Formal and business-like' },
];

// Mood options matching ADE Mood enum
const MOOD_OPTIONS = [
  { id: null, label: 'Not set', desc: 'No mood context sent' },
  { id: 'happy', label: 'Happy', desc: 'Feeling good and positive' },
  { id: 'neutral', label: 'Neutral', desc: 'Balanced, no strong mood' },
  { id: 'stressed', label: 'Stressed', desc: 'Under pressure or overwhelmed' },
  { id: 'frustrated', label: 'Frustrated', desc: 'Stuck or annoyed' },
  { id: 'excited', label: 'Excited', desc: 'Energetic and enthusiastic' },
  { id: 'tired', label: 'Tired', desc: 'Low energy, need concise answers' },
  { id: 'anxious', label: 'Anxious', desc: 'Worried or uncertain' },
  { id: 'calm', label: 'Calm', desc: 'Relaxed and at ease' },
];

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

/**
 * Full-screen gallery preview for attached images.
 */
function GalleryPreview({ files, initialIndex, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const file = files[currentIndex];

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0) setCurrentIndex((i) => i - 1);
      if (e.key === 'ArrowRight' && currentIndex < files.length - 1) setCurrentIndex((i) => i + 1);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [currentIndex, files.length, onClose]);

  if (!file) return null;

  return (
    <div className={styles.galleryOverlay} onClick={onClose}>
      <button className={styles.galleryClose} onClick={onClose} aria-label="Close gallery">
        <CloseIcon />
      </button>
      <div className={styles.galleryMain} onClick={(e) => e.stopPropagation()}>
        {currentIndex > 0 && (
          <button
            className={`${styles.galleryNav} ${styles.galleryNavLeft}`}
            onClick={() => setCurrentIndex((i) => i - 1)}
            aria-label="Previous image"
          >
            <ChevronLeftIcon />
          </button>
        )}
        <div className={styles.galleryImageContainer}>
          <img key={file.id} src={file.preview} alt={file.name} className={styles.galleryImage} />
        </div>
        {currentIndex < files.length - 1 && (
          <button
            className={`${styles.galleryNav} ${styles.galleryNavRight}`}
            onClick={() => setCurrentIndex((i) => i + 1)}
            aria-label="Next image"
          >
            <ChevronRightIcon />
          </button>
        )}
      </div>
      <div className={styles.galleryFooter} onClick={(e) => e.stopPropagation()}>
        <span className={styles.galleryFileName}>{file.name}</span>
        <span className={styles.galleryCounter}>
          {currentIndex + 1} / {files.length}
        </span>
      </div>
    </div>
  );
}

/**
 * Limit reached toast notification.
 */
function LimitToast({ maxCount, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isPro = getUserTier() === 'pro';

  return (
    <div className={styles.limitToast}>
      <div className={styles.limitToastIcon}>
        <SparkleIcon />
      </div>
      <div className={styles.limitToastContent}>
        <span className={styles.limitToastTitle}>
          {isPro ? 'Attachment limit reached' : 'Want to add more?'}
        </span>
        <span className={styles.limitToastDesc}>
          {isPro
            ? `You can attach up to ${maxCount} files per message.`
            : `Free plan supports up to ${maxCount} files. Upgrade to Pro for up to 15.`}
        </span>
      </div>
      <button className={styles.limitToastClose} onClick={onClose} aria-label="Dismiss">
        <CloseIcon />
      </button>
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
  const extendedThinking = useSelector(selectExtendedThinking);
  const deepResearch = useSelector(selectDeepResearch);
  const googleThinking = useSelector(selectGoogleThinking);
  const tone = useSelector(selectTone);
  const mood = useSelector(selectMood);
  const autoStrategy = useSelector(selectAutoStrategy);
  const effectiveTheme = useSelector(selectEffectiveTheme);
  const isDark = effectiveTheme === 'dark';
  const {
    location: userLocation,
    permission: locationPermission,
    requestLocation,
    clearLocation,
  } = useUserLocation();

  const modeValues = { extendedThinking, deepResearch, googleThinking };
  const anyModeActive = extendedThinking || deepResearch || googleThinking;

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showAttachDropdown, setShowAttachDropdown] = useState(false);
  const [showResearchModes, setShowResearchModes] = useState(false);
  const [showToneSubmenu, setShowToneSubmenu] = useState(false);
  const [showMoodSubmenu, setShowMoodSubmenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSubConvPanelOpen, setIsSubConvPanelOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [mobileFileSubmenu, setMobileFileSubmenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [showLimitToast, setShowLimitToast] = useState(false);
  const dropdownRef = useRef(null);
  const attachDropdownRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

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
          setShowResearchModes(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showToneSubmenu) {
          setShowToneSubmenu(false);
        } else if (showMoodSubmenu) {
          setShowMoodSubmenu(false);
        } else if (showResearchModes) {
          setShowResearchModes(false);
        } else {
          setActiveDropdown(null);
          setShowAttachDropdown(false);
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showResearchModes, showToneSubmenu, showMoodSubmenu]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset submenus when dropdown closes
  useEffect(() => {
    if (!showAttachDropdown) {
      setMobileFileSubmenu(false);
      setShowToneSubmenu(false);
      setShowMoodSubmenu(false);
    }
  }, [showAttachDropdown]);

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
        const locationPayload = userLocation
          ? {
              city: userLocation.city,
              region: userLocation.region,
              country: userLocation.country,
              countryCode: userLocation.countryCode,
            }
          : undefined;
        const response = await sendMessage({
          message: prompt,
          conversationId: options.conversationId || currentChatId || undefined,
          selectedModelId: options.selectedModelId || undefined,
          webSearch: webSearchParam,
          userLocation: locationPayload,
          tone: tone || undefined,
          mood: mood || undefined,
          autoStrategy: autoStrategy || undefined,
          weather: userLocation?.weather || undefined,
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
              if (assistantMsgAdded && data.sources) {
                dispatch(updateLastMessage({ citations: data.sources }));
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
    [dispatch, currentChatId, userLocation, tone, mood, autoStrategy]
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
    clearAttachedFiles();

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
    clearAttachedFiles();
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

  // Dynamic attach options (label changes based on device)
  const attachOptions = [
    { id: 'files', label: 'Add files or Photos', icon: FilePlusIcon },
    { id: 'camera', label: isMobile ? 'Camera' : 'Take a screenshot', icon: CameraIcon },
    { id: 'websearch', label: 'Web Search', icon: GlobeIcon },
    { id: 'research', label: 'Research', icon: BookIcon },
    {
      id: 'tone',
      label: tone ? `Tone: ${tone.charAt(0).toUpperCase() + tone.slice(1)}` : 'Tone',
      icon: MicIcon,
    },
    {
      id: 'mood',
      label: mood ? `Mood: ${mood.charAt(0).toUpperCase() + mood.slice(1)}` : 'Mood',
      icon: SmileIcon,
    },
  ];

  const maxAttachments = getUserTier() === 'pro' ? 15 : 5;

  const getFileExtension = (name) => {
    const parts = name.split('.');
    if (parts.length < 2) return 'FILE';
    const ext = parts.pop().toUpperCase();
    return ext.length <= 5 ? ext : 'FILE';
  };

  const getFileTypeColor = (ext) => {
    const colors = {
      PDF: '#ef4444',
      DOC: '#3b82f6',
      DOCX: '#3b82f6',
      XLS: '#22c55e',
      XLSX: '#22c55e',
      PPT: '#f97316',
      PPTX: '#f97316',
      TXT: '#8b5cf6',
      CSV: '#22c55e',
      JSON: '#eab308',
      XML: '#06b6d4',
    };
    return colors[ext] || '#6b7280';
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remainingSlots = maxAttachments - attachedFiles.length;
    if (remainingSlots <= 0) {
      setShowLimitToast(true);
      if (e.target) e.target.value = '';
      return;
    }
    const filesToAdd = files.slice(0, remainingSlots);
    if (filesToAdd.length < files.length) {
      setShowLimitToast(true);
    }
    const newFiles = filesToAdd.map((file) => ({
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      name: file.name,
      type: file.type,
      size: file.size,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    }));
    setAttachedFiles((prev) => [...prev, ...newFiles]);
    if (e.target) e.target.value = '';
  };

  const handleRemoveFile = (fileId) => {
    setAttachedFiles((prev) => {
      const file = prev.find((f) => f.id === fileId);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter((f) => f.id !== fileId);
    });
    setShowGallery(false);
  };

  const clearAttachedFiles = useCallback(() => {
    setAttachedFiles((prev) => {
      prev.forEach((f) => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
      return [];
    });
    setShowGallery(false);
  }, []);

  const handleFileClick = (file) => {
    if (file.preview) {
      const imageFiles = attachedFiles.filter((f) => f.preview);
      const idx = imageFiles.findIndex((f) => f.id === file.id);
      setGalleryFiles(imageFiles);
      setGalleryIndex(idx >= 0 ? idx : 0);
      setShowGallery(true);
    } else {
      const url = URL.createObjectURL(file.file);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
  };

  const handleScreenshot = async () => {
    try {
      if (attachedFiles.length >= maxAttachments) {
        setShowLimitToast(true);
        return;
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();
      await new Promise((resolve) => setTimeout(resolve, 150));
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      stream.getTracks().forEach((track) => track.stop());
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], `screenshot-${Date.now()}.png`, { type: 'image/png' });
      setAttachedFiles((prev) => [
        ...prev,
        {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          name: file.name,
          type: file.type,
          size: file.size,
          preview: URL.createObjectURL(file),
        },
      ]);
    } catch (err) {
      console.log('Screenshot cancelled:', err.message);
    }
  };

  const handleMobilePhotoLibrary = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('accept', 'image/*');
      fileInputRef.current.click();
    }
    setMobileFileSubmenu(false);
    setShowAttachDropdown(false);
  };

  const handleMobileChooseFiles = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('accept', 'image/*,.pdf,.doc,.docx,.txt,.csv,.json,.xml');
      fileInputRef.current.click();
    }
    setMobileFileSubmenu(false);
    setShowAttachDropdown(false);
  };

  const handleMobileTakePhoto = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
    setMobileFileSubmenu(false);
    setShowAttachDropdown(false);
  };

  const handleAttachClick = () => {
    setShowAttachDropdown(!showAttachDropdown);
    setShowResearchModes(false);
    setActiveDropdown(null);
  };

  const handleModeToggle = (modeConf) => {
    const currentValue = modeValues[modeConf.key];
    dispatch(modeConf.action(!currentValue));
  };

  const handleAttachOptionClick = (optionId) => {
    if (optionId === 'websearch') {
      dispatch(setWebSearchEnabled(webSearchEnabled === true ? false : true));
      return;
    }
    if (optionId === 'research') {
      setShowResearchModes(true);
      return;
    }
    if (optionId === 'files') {
      if (isMobile) {
        setMobileFileSubmenu(true);
        return;
      }
      if (fileInputRef.current) {
        fileInputRef.current.setAttribute('accept', 'image/*,.pdf,.doc,.docx,.txt,.csv,.json,.xml');
        fileInputRef.current.click();
      }
      setShowAttachDropdown(false);
      return;
    }
    if (optionId === 'camera') {
      if (isMobile) {
        if (cameraInputRef.current) {
          cameraInputRef.current.click();
        }
      } else {
        handleScreenshot();
      }
      setShowAttachDropdown(false);
      return;
    }
    if (optionId === 'tone') {
      setShowToneSubmenu(true);
      return;
    }
    if (optionId === 'mood') {
      setShowMoodSubmenu(true);
      return;
    }
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

      {/* Gallery preview */}
      {showGallery && galleryFiles.length > 0 && (
        <GalleryPreview
          files={galleryFiles}
          initialIndex={galleryIndex}
          onClose={() => setShowGallery(false)}
        />
      )}

      {/* Limit reached toast */}
      {showLimitToast && (
        <LimitToast maxCount={maxAttachments} onClose={() => setShowLimitToast(false)} />
      )}

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
              {attachedFiles.length > 0 && (
                <div className={styles.attachedFiles}>
                  <div className={styles.attachedFilesScroll}>
                    {attachedFiles.map((file) => {
                      const ext = getFileExtension(file.name);
                      return (
                        <div
                          key={file.id}
                          className={`${styles.attachedFileCard} ${
                            file.preview ? styles.imageCard : styles.fileCard
                          }`}
                          onClick={() => handleFileClick(file)}
                          role="button"
                          tabIndex={0}
                          aria-label={`Preview ${file.name}`}
                        >
                          {file.preview ? (
                            <img src={file.preview} alt={file.name} className={styles.cardThumb} />
                          ) : (
                            <div className={styles.cardFileContent}>
                              <div className={styles.cardFileIconWrapper}>
                                <FileIcon />
                              </div>
                              <span className={styles.cardFileName}>{file.name}</span>
                              <span
                                className={styles.cardFileType}
                                style={{ backgroundColor: getFileTypeColor(ext) }}
                              >
                                {ext}
                              </span>
                            </div>
                          )}
                          <button
                            className={styles.cardRemove}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile(file.id);
                            }}
                            aria-label={`Remove ${file.name}`}
                          >
                            <CloseIcon />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <span className={styles.attachedFilesCount}>
                    {attachedFiles.length}/{maxAttachments}
                  </span>
                </div>
              )}
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
                      {showResearchModes ? (
                        <div className={styles.attachSubmenu}>
                          <button
                            className={styles.attachSubmenuBack}
                            onClick={() => setShowResearchModes(false)}
                          >
                            <ChevronLeftIcon />
                            <span>Back</span>
                          </button>
                          <div className={styles.researchModesLabel}>Modes</div>
                          {MODE_CONFIG.map((modeConf) => {
                            const active = modeValues[modeConf.key];
                            const ModeIcon = modeConf.Icon;
                            const providerData = PROVIDERS[modeConf.providerId];
                            const providerAccent = providerData?.accentColor;
                            const providerBg = isDark
                              ? providerData?.accentBgDark
                              : providerData?.accentBg;
                            const providerText = isDark
                              ? providerData?.accentTextDark || providerData?.accentColor
                              : providerData?.accentText;
                            return (
                              <button
                                key={modeConf.key}
                                className={`${styles.researchModeOption} ${
                                  active ? styles.researchModeOptionActive : ''
                                }`}
                                onClick={() => handleModeToggle(modeConf)}
                                aria-pressed={active}
                                title={modeConf.description}
                                style={
                                  active
                                    ? {
                                        backgroundColor: providerBg,
                                        borderColor: providerAccent + '30',
                                      }
                                    : undefined
                                }
                              >
                                <span
                                  className={`${styles.researchModeIcon} ${
                                    active ? styles.researchModeIconActive : ''
                                  }`}
                                  style={
                                    active
                                      ? { backgroundColor: providerAccent, color: '#fff' }
                                      : { backgroundColor: providerBg, color: providerText }
                                  }
                                >
                                  <ModeIcon />
                                </span>
                                <div className={styles.researchModeContent}>
                                  <span className={styles.researchModeName}>{modeConf.label}</span>
                                  <span
                                    className={styles.researchModeProvider}
                                    style={{ color: active ? providerText : undefined }}
                                  >
                                    {modeConf.providerLabel}
                                  </span>
                                  <span className={styles.researchModeDesc}>
                                    {modeConf.description}
                                  </span>
                                </div>
                                <div
                                  className={`${styles.researchModeToggle} ${
                                    active ? styles.researchModeToggleOn : ''
                                  }`}
                                  style={
                                    active
                                      ? {
                                          backgroundColor: providerAccent,
                                          borderColor: providerAccent,
                                        }
                                      : undefined
                                  }
                                >
                                  <div className={styles.researchModeToggleThumb} />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : showToneSubmenu ? (
                        <div className={styles.attachSubmenu}>
                          <button
                            className={styles.attachSubmenuBack}
                            onClick={() => setShowToneSubmenu(false)}
                          >
                            <ChevronLeftIcon />
                            <span>Back</span>
                          </button>
                          <div className={styles.submenuLabel}>Tone</div>
                          {TONE_OPTIONS.map((opt) => {
                            const isActive = tone === opt.id;
                            return (
                              <button
                                key={opt.id ?? 'auto'}
                                className={`${styles.submenuOptionCompact} ${
                                  isActive ? styles.submenuOptionCompactActive : ''
                                }`}
                                onClick={() => {
                                  dispatch(setTone(opt.id));
                                  setShowToneSubmenu(false);
                                }}
                                data-tooltip={opt.desc}
                              >
                                <span className={styles.submenuOptionCompactName}>{opt.label}</span>
                                {isActive && (
                                  <span className={styles.attachOptionCheck}>
                                    <CheckIcon />
                                  </span>
                                )}
                                <span className={styles.submenuTooltip}>{opt.desc}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : showMoodSubmenu ? (
                        <div className={styles.attachSubmenu}>
                          <button
                            className={styles.attachSubmenuBack}
                            onClick={() => setShowMoodSubmenu(false)}
                          >
                            <ChevronLeftIcon />
                            <span>Back</span>
                          </button>
                          <div className={styles.submenuLabel}>Mood</div>
                          {MOOD_OPTIONS.map((opt) => {
                            const isActive = mood === opt.id;
                            return (
                              <button
                                key={opt.id ?? 'none'}
                                className={`${styles.submenuOptionCompact} ${
                                  isActive ? styles.submenuOptionCompactActive : ''
                                }`}
                                onClick={() => {
                                  dispatch(setMood(opt.id));
                                  setShowMoodSubmenu(false);
                                }}
                                data-tooltip={opt.desc}
                              >
                                <span className={styles.submenuOptionCompactName}>{opt.label}</span>
                                {isActive && (
                                  <span className={styles.attachOptionCheck}>
                                    <CheckIcon />
                                  </span>
                                )}
                                <span className={styles.submenuTooltip}>{opt.desc}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : mobileFileSubmenu && isMobile ? (
                        <div className={styles.attachSubmenu}>
                          <button
                            className={styles.attachSubmenuBack}
                            onClick={() => setMobileFileSubmenu(false)}
                          >
                            <ChevronLeftIcon />
                            <span>Back</span>
                          </button>
                          <button
                            className={styles.attachOption}
                            onClick={handleMobilePhotoLibrary}
                          >
                            <PhotoIcon />
                            <span>Photo library</span>
                          </button>
                          <button className={styles.attachOption} onClick={handleMobileChooseFiles}>
                            <FileIcon />
                            <span>Choose files</span>
                          </button>
                          <button className={styles.attachOption} onClick={handleMobileTakePhoto}>
                            <CameraIcon />
                            <span>Take Photo</span>
                          </button>
                        </div>
                      ) : (
                        attachOptions.map((option) => {
                          const Icon = option.icon;
                          const isWebSearch = option.id === 'websearch';
                          const isResearch = option.id === 'research';
                          const isTone = option.id === 'tone';
                          const isMood = option.id === 'mood';
                          const isActive =
                            (isWebSearch && webSearchEnabled === true) ||
                            (isResearch && anyModeActive) ||
                            (isTone && !!tone) ||
                            (isMood && !!mood);
                          return (
                            <button
                              key={option.id}
                              className={`${styles.attachOption} ${
                                isActive ? styles.attachOptionActive : ''
                              }`}
                              onClick={() => handleAttachOptionClick(option.id)}
                            >
                              <Icon />
                              <span>{option.label}</span>
                              {isWebSearch && isActive && (
                                <span className={styles.attachOptionCheck}>
                                  <CheckIcon />
                                </span>
                              )}
                              {isResearch && anyModeActive && (
                                <span className={styles.attachOptionCheck}>
                                  <CheckIcon />
                                </span>
                              )}
                              {(option.id === 'research' ||
                                option.id === 'tone' ||
                                option.id === 'mood' ||
                                (option.id === 'files' && isMobile)) && (
                                <span className={styles.attachOptionChevron}>
                                  <ChevronRightIcon />
                                </span>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                  <ModelSelector />
                  <button
                    type="button"
                    className={`${styles.webSearchToggle} ${
                      webSearchEnabled === true ? styles.webSearchToggleOn : ''
                    }`}
                    onClick={() => {
                      dispatch(setWebSearchEnabled(webSearchEnabled === true ? false : true));
                    }}
                    disabled={isProcessing}
                    title={webSearchEnabled === true ? 'Web search: On' : 'Web search: Off'}
                    aria-label="Toggle web search"
                  >
                    <GlobeIcon />
                  </button>
                  {locationPermission === 'granted' && userLocation?.city ? (
                    <button
                      type="button"
                      className={`${styles.locationPill} ${styles.locationPillActive}`}
                      onClick={clearLocation}
                      title={`Location: ${userLocation.city}${
                        userLocation.region ? ', ' + userLocation.region : ''
                      } — Click to remove`}
                      aria-label="Location detected"
                    >
                      <MapPinIcon />
                      <span>{userLocation.city}</span>
                    </button>
                  ) : locationPermission !== 'denied' && locationPermission !== 'unavailable' ? (
                    <button
                      type="button"
                      className={styles.locationPill}
                      onClick={requestLocation}
                      disabled={isProcessing}
                      title="Share your location for better local results"
                      aria-label="Share location"
                    >
                      <MapPinIcon />
                    </button>
                  ) : null}
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
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt,.csv,.json,.xml"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              aria-hidden="true"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              aria-hidden="true"
            />
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
