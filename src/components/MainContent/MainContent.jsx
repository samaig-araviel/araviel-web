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
  selectPendingAutoSubmit,
  selectPendingModality,
  selectImportedContext,
  setTone,
  setMood,
  setPendingAutoSubmit,
  setPendingModality,
  setImportedContext,
} from '../../store/slices/chatSlice';
import { recordMessage } from '../../store/slices/analyticsSlice';
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
  CloudIcon,
  ExternalLinkIcon,
  MoreVerticalIcon,
  StarIcon,
  ArchiveIcon,
  FlagIcon,
  TrashIcon,
} from '../Icons';
import ModelSelector from '../ModelSelector/ModelSelector';
import MessageList from '../MessageList/MessageList';
import { sendMessage, consumeSSEStream } from '../../services/api';
import { getUserTier, PROVIDERS, isImageGenerationModel } from '../../data/models';
import {
  canGenerateImage,
  recordGeneration,
  saveGeneratedImage,
  getLimitInfo,
} from '../../services/imageGeneration';
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

// Cloud storage providers for file import
const CLOUD_PROVIDERS = [
  {
    id: 'google-drive',
    name: 'Google Drive',
    color: '#4285F4',
    icon: '📁',
    pickerUrl: 'https://drive.google.com/file/d/',
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    color: '#0078D4',
    icon: '☁️',
    pickerUrl: 'https://onedrive.live.com/picker',
  },
  {
    id: 'sharepoint',
    name: 'SharePoint',
    color: '#038387',
    icon: '🏢',
    pickerUrl: null,
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    color: '#0061FF',
    icon: '💧',
    pickerUrl: null,
  },
  {
    id: 'box',
    name: 'Box',
    color: '#0061D5',
    icon: '📦',
    pickerUrl: null,
  },
];

const promptsData = {
  code: {
    title: 'Code',
    icon: CodeIcon,
    items: [
      {
        text: 'Help me debug this error: "TypeError: Cannot read properties of undefined" in my React component',
        icon: BugIcon,
      },
      {
        text: 'Write a Python function that takes a CSV file and returns a cleaned pandas DataFrame with duplicates removed and missing values handled',
        icon: CodeIcon,
      },
      {
        text: 'Explain how JavaScript closures work with a practical example I can use in my project',
        icon: LightbulbIcon,
      },
      {
        text: 'Review my API endpoint for performance bottlenecks and suggest optimizations for handling 10k+ concurrent requests',
        icon: ZapIcon,
      },
    ],
  },
  write: {
    title: 'Write',
    icon: PenIcon,
    items: [
      {
        text: 'Draft a professional email to my team announcing a new project timeline with key milestones and deadlines',
        icon: MailIcon,
      },
      {
        text: 'Summarize this 2000-word article into a concise 3-paragraph executive brief with key takeaways',
        icon: FileTextIcon,
      },
      {
        text: 'Write compelling landing page copy for a SaaS product that helps teams collaborate on design projects',
        icon: CopyIcon,
      },
      {
        text: 'Create comprehensive API documentation for a REST endpoint with request/response examples and error codes',
        icon: ClipboardIcon,
      },
    ],
  },
  research: {
    title: 'Research',
    icon: SearchIcon,
    items: [
      {
        text: 'Research the latest advancements in large language models from the past 6 months and summarize the key breakthroughs',
        icon: SearchIcon,
      },
      {
        text: 'Compare React, Vue, and Svelte for building a large-scale enterprise dashboard — pros, cons, and performance benchmarks',
        icon: LayersIcon,
      },
      {
        text: 'Analyze the current AI startup landscape: top funded companies, emerging trends, and market opportunities in 2026',
        icon: TrendingUpIcon,
      },
      {
        text: 'Compile a research brief on the environmental impact of cloud computing with statistics and recent studies',
        icon: ClipboardIcon,
      },
    ],
  },
  analyze: {
    title: 'Analyze',
    icon: ChartIcon,
    items: [
      {
        text: 'Analyze this dataset of customer churn rates and identify the top 5 factors driving customer attrition',
        icon: EyeIcon,
      },
      {
        text: 'Find patterns in my monthly sales data and predict trends for the next quarter using statistical methods',
        icon: PuzzleIcon,
      },
      {
        text: 'Generate actionable business insights from our user engagement metrics — what should we prioritize next?',
        icon: LightbulbIcon,
      },
      {
        text: 'Create a comprehensive competitive analysis report comparing our product features against our top 3 competitors',
        icon: ClipboardIcon,
      },
    ],
  },
  create: {
    title: 'Create',
    icon: SparkleIcon,
    items: [
      {
        text: 'Generate 10 creative startup ideas that combine AI with healthcare to solve real-world problems',
        icon: LightbulbIcon,
      },
      {
        text: 'Design a modern, accessible dashboard layout for a project management tool with dark mode support',
        icon: PuzzleIcon,
      },
      {
        text: 'Build a prototype specification for a mobile app that helps users track their daily habits and productivity',
        icon: LayersIcon,
      },
      {
        text: 'Create a comprehensive content calendar for a tech blog with 12 article ideas, titles, and brief outlines',
        icon: SparkleIcon,
      },
    ],
  },
  learn: {
    title: 'Learn',
    icon: BookIcon,
    items: [
      {
        text: 'Explain how neural networks learn through backpropagation — use simple analogies and build up to the math',
        icon: LightbulbIcon,
      },
      {
        text: 'Teach me about distributed systems architecture: CAP theorem, consistency models, and real-world trade-offs',
        icon: BookIcon,
      },
      {
        text: 'Break down how Git branching strategies work — compare GitFlow, trunk-based development, and GitHub Flow',
        icon: LayersIcon,
      },
      {
        text: 'Quiz me on data structures and algorithms — start with medium difficulty and adjust based on my answers',
        icon: HelpCircleIcon,
      },
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

/**
 * Image generation limit prompt — shown when the user has exhausted their image generation quota.
 * Free users are prompted to upgrade to Pro.
 * Pro users are prompted to purchase an image generation addon.
 */
function ImageLimitPrompt({ onClose }) {
  const limitInfo = getLimitInfo();
  const isFree = limitInfo.tier === 'free';

  const resetTime = limitInfo.resetAt
    ? new Date(limitInfo.resetAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className={styles.imageLimitOverlay} onClick={onClose}>
      <div className={styles.imageLimitCard} onClick={(e) => e.stopPropagation()}>
        <button className={styles.imageLimitClose} onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>

        <div className={styles.imageLimitIcon}>
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
        </div>

        <h3 className={styles.imageLimitTitle}>
          {isFree ? 'Image generation limit reached' : 'Daily image limit reached'}
        </h3>

        <p className={styles.imageLimitDesc}>
          {isFree
            ? `You\u2019ve used all ${limitInfo.limit} free image generations for today.`
            : `You\u2019ve used all ${limitInfo.limit} image generations included with your Pro plan today.`}
          {resetTime && <> Your limit resets at {resetTime}.</>}
        </p>

        {isFree ? (
          <div className={styles.imageLimitUpgrade}>
            <p className={styles.imageLimitUpgradeText}>
              Upgrade to Pro for {10} image generations per day, plus access to premium AI models.
            </p>
            <button className={styles.imageLimitUpgradeBtn} onClick={onClose}>
              Upgrade to Pro
            </button>
          </div>
        ) : (
          <div className={styles.imageLimitUpgrade}>
            <p className={styles.imageLimitUpgradeText}>
              Need more? Purchase the Image Generation add-on for additional usage beyond your daily
              Pro limit.
            </p>
            <button className={styles.imageLimitUpgradeBtn} onClick={onClose}>
              Get Image Generation Add-on
            </button>
          </div>
        )}

        <p className={styles.imageLimitFooter}>
          {isFree
            ? `Free plan: ${limitInfo.limit} images / 24 hours`
            : `Pro plan: ${limitInfo.limit} images / 24 hours`}
        </p>
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
  const extendedThinking = useSelector(selectExtendedThinking);
  const deepResearch = useSelector(selectDeepResearch);
  const googleThinking = useSelector(selectGoogleThinking);
  const tone = useSelector(selectTone);
  const mood = useSelector(selectMood);
  const autoStrategy = useSelector(selectAutoStrategy);
  const pendingAutoSubmit = useSelector(selectPendingAutoSubmit);
  const pendingModality = useSelector(selectPendingModality);
  const importedContext = useSelector(selectImportedContext);
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
  const [showCloudSubmenu, setShowCloudSubmenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSubConvPanelOpen, setIsSubConvPanelOpen] = useState(false);
  const [isCodePanelOpen, setIsCodePanelOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [mobileFileSubmenu, setMobileFileSubmenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [showLimitToast, setShowLimitToast] = useState(false);
  const [showImageLimitPrompt, setShowImageLimitPrompt] = useState(false);
  const dropdownRef = useRef(null);
  const attachDropdownRef = useRef(null);
  const chatMenuRef = useRef(null);
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
      if (chatMenuRef.current && !chatMenuRef.current.contains(e.target)) {
        setShowChatMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showCloudSubmenu) {
          setShowCloudSubmenu(false);
        } else if (showToneSubmenu) {
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
  }, [showResearchModes, showToneSubmenu, showMoodSubmenu, showCloudSubmenu]);

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
      setShowCloudSubmenu(false);
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
      let accumulatedImages = null;
      let receivedDone = false;
      let routeInfo = null;

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
          modality: options.modality || undefined,
          webSearch: webSearchParam,
          userLocation: locationPayload,
          tone: tone || undefined,
          mood: mood || undefined,
          autoStrategy: autoStrategy || undefined,
          weather: userLocation?.weather || undefined,
          requestFollowUps: true,
          extendedThinking: extendedThinking || undefined,
          deepResearch: deepResearch || undefined,
          googleThinking: googleThinking || undefined,
          conversationHasImages: options.conversationHasImages || undefined,
          importedConversationId: importedContext?.importedConversationId || undefined,
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
                // Once the backend creates a native conversation, clear imported context
                // so subsequent messages use the native conversation's history
                if (importedContext) {
                  dispatch(setImportedContext(null));
                }
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
              routeInfo = {
                modelId: data.model?.id,
                modelName: data.model?.name,
                provider: data.model?.provider,
              };
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
            } else if (type === 'image_generation') {
              // Handle generated image from the backend
              if (assistantMsgAdded && data.url) {
                const imgEntry = saveGeneratedImage({
                  url: data.url,
                  prompt: data.prompt || prompt,
                  model: data.model || routeInfo?.modelName,
                  provider: data.provider || routeInfo?.provider,
                  size: data.size,
                  style: data.style,
                });
                recordGeneration();
                dispatch(
                  updateLastMessage({
                    generatedImages: [
                      ...(accumulatedImages || []),
                      {
                        url: data.url,
                        prompt: data.prompt || prompt,
                        model: data.model || routeInfo?.modelName,
                        provider: data.provider || routeInfo?.provider,
                        id: imgEntry.id,
                      },
                    ],
                  })
                );
                accumulatedImages = accumulatedImages || [];
                accumulatedImages.push({
                  url: data.url,
                  prompt: data.prompt || prompt,
                  model: data.model || routeInfo?.modelName,
                });
              }
            } else if (type === 'followups') {
              if (assistantMsgAdded && data.suggestions) {
                dispatch(updateLastMessage({ followUps: data.suggestions }));
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
                // Record analytics for this message
                dispatch(
                  recordMessage({
                    modelId: routeInfo?.modelId,
                    modelName: routeInfo?.modelName,
                    provider: routeInfo?.provider,
                    costUsd: data.usage?.costUsd || 0,
                    inputTokens: data.usage?.promptTokens || data.usage?.inputTokens || 0,
                    outputTokens: data.usage?.completionTokens || data.usage?.outputTokens || 0,
                    latencyMs: data.latencyMs || 0,
                    timestamp: Date.now(),
                    promptSnippet: prompt?.slice(0, 100) || '',
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
    [
      dispatch,
      currentChatId,
      userLocation,
      tone,
      mood,
      autoStrategy,
      extendedThinking,
      deepResearch,
      googleThinking,
      importedContext,
    ]
  );

  /**
   * Main submit handler.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const prompt = inputValue.trim();
    if (!prompt || isProcessing) return;

    // Check image generation limits if the selected model is an image gen model
    if (selectedModelId && isImageGenerationModel(selectedModelId)) {
      if (!canGenerateImage()) {
        setShowImageLimitPrompt(true);
        return;
      }
    }

    dispatch(setInputValue(''));
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setActiveDropdown(null);
    setShowAttachDropdown(false);
    clearAttachedFiles();

    // Let the backend router know if this conversation already has generated
    // images so it can factor that into model selection (without forcing modality)
    const conversationHasImages = messages.some(
      (m) => m.generatedImages && m.generatedImages.length > 0
    );

    await runSSEPipeline(prompt, {
      selectedModelId: selectedModelId || undefined,
      addUserMessage: true,
      webSearch: webSearchEnabled,
      conversationHasImages: conversationHasImages || undefined,
    });
  };

  // Auto-submit when navigating from another view (e.g. Image Gallery quick prompt).
  // Uses a ref guard to guarantee this fires exactly once, even with StrictMode.
  const autoSubmitFiredRef = useRef(null);
  useEffect(() => {
    if (!pendingAutoSubmit || !inputValue.trim() || isProcessing) return;
    // Guard: skip if we already fired for this exact prompt
    const prompt = inputValue.trim();
    if (autoSubmitFiredRef.current === prompt) return;
    autoSubmitFiredRef.current = prompt;
    const modality = pendingModality || undefined;
    dispatch(setPendingAutoSubmit(false));
    dispatch(setPendingModality(null));
    dispatch(setInputValue(''));
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    runSSEPipeline(prompt, {
      selectedModelId: selectedModelId || undefined,
      addUserMessage: true,
      webSearch: webSearchEnabled,
      modality,
    });
  }, [pendingAutoSubmit]); // eslint-disable-line react-hooks/exhaustive-deps

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
    { id: 'files', label: 'Upload files or images', icon: FilePlusIcon },
    { id: 'cloud', label: 'Add files from cloud', icon: CloudIcon },
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

  const handleCloudProviderClick = (provider) => {
    // Open a file picker or redirect to the cloud provider
    // For now, show a toast or open the provider's file picker
    const pickerUrls = {
      'google-drive': 'https://drive.google.com',
      onedrive: 'https://onedrive.live.com',
      sharepoint: 'https://www.office.com/launch/sharepoint',
      dropbox: 'https://www.dropbox.com/home',
      box: 'https://app.box.com',
    };
    const url = pickerUrls[provider.id];
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    setShowCloudSubmenu(false);
    setShowAttachDropdown(false);
  };

  const handleAttachOptionClick = (optionId) => {
    if (optionId === 'websearch') {
      dispatch(setWebSearchEnabled(webSearchEnabled === true ? false : true));
      return;
    }
    if (optionId === 'cloud') {
      setShowCloudSubmenu(true);
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
      } ${isCodePanelOpen ? styles.codePanelOpen : ''}`}
    >
      {/* Top nav bar with share + new chat + menu buttons */}
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
            className={styles.newChatNavBtn}
            onClick={handleNewChat}
            title="New Chat"
            aria-label="Start new chat"
          >
            <NewChatIcon />
          </button>
          <div className={styles.chatMenuWrapper} ref={chatMenuRef}>
            <button
              className={`${styles.chatMenuBtn} ${showChatMenu ? styles.chatMenuBtnActive : ''}`}
              onClick={() => setShowChatMenu(!showChatMenu)}
              title="More options"
              aria-label="More options"
            >
              <MoreVerticalIcon />
            </button>
            {showChatMenu && (
              <div className={styles.chatMenuDropdown}>
                <button
                  className={styles.chatMenuItem}
                  onClick={() => {
                    setShowChatMenu(false);
                  }}
                >
                  <StarIcon />
                  <span>Star conversation</span>
                </button>
                <button
                  className={styles.chatMenuItem}
                  onClick={() => {
                    setShowChatMenu(false);
                  }}
                >
                  <ArchiveIcon />
                  <span>Archive</span>
                </button>
                <button
                  className={styles.chatMenuItem}
                  onClick={() => {
                    setShowChatMenu(false);
                  }}
                >
                  <FlagIcon />
                  <span>Report</span>
                </button>
                <div className={styles.chatMenuDivider} />
                <button
                  className={`${styles.chatMenuItem} ${styles.chatMenuItemDanger}`}
                  onClick={() => {
                    setShowChatMenu(false);
                    setShowDeleteConfirm(true);
                  }}
                >
                  <TrashIcon />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className={styles.confirmOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmIcon}>
              <TrashIcon />
            </div>
            <h3 className={styles.confirmTitle}>Delete conversation?</h3>
            <p className={styles.confirmDesc}>
              This will permanently delete this conversation and all its messages. This action
              cannot be undone.
            </p>
            <div className={styles.confirmActions}>
              <button
                className={styles.confirmCancelBtn}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className={styles.confirmDeleteBtn}
                onClick={() => {
                  setShowDeleteConfirm(false);
                  handleNewChat();
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Image generation limit prompt */}
      {showImageLimitPrompt && <ImageLimitPrompt onClose={() => setShowImageLimitPrompt(false)} />}

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
          onCodePanelToggle={setIsCodePanelOpen}
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
                      ) : showCloudSubmenu ? (
                        <div className={styles.attachSubmenu}>
                          <button
                            className={styles.attachSubmenuBack}
                            onClick={() => setShowCloudSubmenu(false)}
                          >
                            <ChevronLeftIcon />
                            <span>Back</span>
                          </button>
                          <div className={styles.submenuLabel}>Cloud Storage</div>
                          {CLOUD_PROVIDERS.map((provider) => (
                            <button
                              key={provider.id}
                              className={styles.cloudProviderOption}
                              onClick={() => handleCloudProviderClick(provider)}
                            >
                              <span
                                className={styles.cloudProviderIcon}
                                style={{
                                  backgroundColor: provider.color + '15',
                                  color: provider.color,
                                }}
                              >
                                {provider.icon}
                              </span>
                              <span className={styles.cloudProviderName}>{provider.name}</span>
                              <span className={styles.cloudProviderArrow}>
                                <ExternalLinkIcon />
                              </span>
                            </button>
                          ))}
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
                                option.id === 'cloud' ||
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
                  {/* Location is detected automatically behind the scenes */}
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
