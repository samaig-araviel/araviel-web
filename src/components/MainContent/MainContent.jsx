import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  selectActiveProjectId,
  setTone,
  setMood,
  setPendingAutoSubmit,
  setPendingModality,
  setImportedContext,
  setActiveProjectId,
  selectConversations,
  selectConversationsTotal,
  setConversations,
  updateConversationTitle,
  selectSelectedModality,
  selectImageQuality,
  selectCreditBalance,
  setCreditBalance,
  setSelectedModality,
  revertQuickPromptImageOverride,
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
  ProjectsIcon,
  ChevronDownIcon,
  EditIcon,
  RefreshIcon,
} from '../Icons';
import ModelSelector from '../ModelSelector/ModelSelector';
import MessageList from '../MessageList/MessageList';
import MarkdownTextarea from '../MarkdownTextarea/MarkdownTextarea';
import {
  sendMessage,
  consumeSSEStream,
  fetchConversation,
  updateConversation,
  reportConversation,
  createProject as createProjectApi,
} from '../../services/api';
import { useToast } from '../Toast/Toast';
import { logger } from '../../lib/logger';
import { selectProjects, addProject } from '../../store/slices/projectsSlice';
import {
  showUpgradeModal,
  setTextCredits,
  selectCurrentTier,
  setImageCredits,
} from '../../store/slices/subscriptionSlice';
import { getNextTier, getUpgradeCtaLabel } from '../../config/subscription';
import { PROVIDERS, isImageGenerationModel } from '../../data/models';
import { getProviderLogo } from '../getProviderLogo';
import { compressImage, isAcceptedImageType } from '../../utils/imageCompression';
import { takePendingAttachments } from '../../utils/pendingAttachments';
import useFileDrop from '../../hooks/useFileDrop';
import usePasteImages from '../../hooks/usePasteImages';
import DropOverlay from '../DropOverlay';
import {
  canGenerateImage,
  recordGeneration,
  saveGeneratedImage,
  getLimitInfo,
} from '../../services/imageGeneration';
import { fetchCreditBalance } from '../../services/credits';
import { getCreditCost } from '../../services/credits';
import { saveSettings } from '../../services/settings';
import { readBooleanSetting } from '../../lib/localSettings';
import ModalityBar from '../ModalityBar/ModalityBar';
import BuyPacksModal from '../BuyPacksModal/BuyPacksModal';
import ShareModal from '../ShareModal/ShareModal';
import ResearchModeChip from './ResearchModeChip';
import { selectEffectiveTheme } from '../../store/slices/themeSlice';
import { selectIsAuthenticated } from '../../store/slices/authSlice';
import {
  hasReachedGuestLimit,
  incrementGuestPromptCount,
  hasReachedGuestImageLimit,
  incrementGuestImageCount,
} from '../../utils/guestSession';
import DynamicSubtitle from '../DynamicSubtitle/DynamicSubtitle';
import useUserLocation from '../../hooks/useUserLocation';
import useDeleteConversation from '../../hooks/useDeleteConversation';
import styles from './MainContent.module.css';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning.';
  if (hour < 18) return 'Good afternoon.';
  return 'Good evening.';
};

// Ambient provider badges anchored as a horizontal strip near the bottom of
// the landing screen. Purely decorative; communicates the range of providers
// Araveil orchestrates. Array order is the visual reading order.
const AMBIENT_PROVIDERS = [
  { id: 'anthropic', label: 'Claude', subLabel: 'Opus 4.7', available: true },
  { id: 'xai', label: 'Grok', subLabel: 'Coming soon', available: false },
  { id: 'openai', label: 'ChatGPT', subLabel: 'GPT-5', available: true },
  { id: 'perplexity', label: 'Perplexity', subLabel: 'Sonar Large', available: true },
  { id: 'elevenlabs', label: 'ElevenLabs', subLabel: 'Coming soon', available: false },
  { id: 'google', label: 'Gemini', subLabel: '2.5 Pro', available: true },
];

const MODE_CONFIG = [
  {
    key: 'extendedThinking',
    label: 'Extended Thinking',
    description: 'Deep chain-of-thought reasoning',
    providerLabel: 'Claude',
    providerId: 'anthropic',
    Icon: BrainIcon,
    action: setExtendedThinking,
    requiredTier: 'pro',
  },
  {
    key: 'deepResearch',
    label: 'Deep Research',
    description: 'Multi-step research & analysis',
    providerLabel: 'OpenAI',
    providerId: 'openai',
    Icon: BeakerIcon,
    action: setDeepResearch,
    requiredTier: 'lite',
  },
  {
    key: 'googleThinking',
    label: 'Thinking Mode',
    description: 'Enhanced reasoning with Gemini',
    providerLabel: 'Gemini',
    providerId: 'google',
    Icon: CpuIcon,
    action: setGoogleThinking,
    requiredTier: 'pro',
  },
];

// Tone options matching ADE Tone enum
const TONE_OPTIONS = [
  { id: 'default', label: 'Default', desc: 'Preset style and tone' },
  { id: 'professional', label: 'Professional', desc: 'Polished and precise' },
  { id: 'friendly', label: 'Friendly', desc: 'Warm and chatty' },
  { id: 'candid', label: 'Candid', desc: 'Direct and encouraging' },
  { id: 'quirky', label: 'Quirky', desc: 'Playful and imaginative' },
  { id: 'efficient', label: 'Efficient', desc: 'Concise and plain' },
  { id: 'cynical', label: 'Cynical', desc: 'Critical and sarcastic' },
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

import { promptsData, quickPromptKeys } from '../../utils/quickPromptsData';
import { handleQuickPromptSelection } from '../../utils/quickPromptHandler';

// SVG icon components for cloud providers
function GoogleDriveIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8.5 2L1 15h7l7.5-13z" />
      <path d="M15.5 2L23 15H8.5" />
      <path d="M1 15l3.5 7h15l3.5-7" />
    </svg>
  );
}

function OneDriveIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  );
}

function SharePointIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="5" />
      <circle cx="7" cy="16" r="4" />
      <circle cx="17" cy="16" r="4" />
    </svg>
  );
}

function DropboxIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2L5.5 6 12 10 18.5 6z" />
      <path d="M5.5 6L12 10 5.5 14 12 18" />
      <path d="M18.5 6L12 10 18.5 14 12 18" />
    </svg>
  );
}

const CLOUD_PROVIDER_ICONS = {
  'google-drive': GoogleDriveIcon,
  onedrive: OneDriveIcon,
  sharepoint: SharePointIcon,
  dropbox: DropboxIcon,
};

// Cloud storage providers for file import
const CLOUD_PROVIDERS = [
  {
    id: 'google-drive',
    name: 'Google Drive',
    pickerUrl: 'https://drive.google.com/file/d/',
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    pickerUrl: 'https://onedrive.live.com/picker',
  },
  {
    id: 'sharepoint',
    name: 'SharePoint',
    pickerUrl: null,
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    pickerUrl: null,
  },
];

// promptsData and quickPromptKeys imported from ../../utils/quickPromptsData

// Timeline stage factory. The timeline only renders when the backend signals
// `showThinking` (or a thinking/research event arrives mid-stream), so this
// factory no longer emits a "Routing" stage — model selection is already
// surfaced by the model pill at the response footer.
function createStages(status, modelName, researchProgress) {
  if (researchProgress) {
    const rp = researchProgress;
    const stages = [
      {
        label: rp.statusLabel || 'Researching...',
        status: 'pending',
        showModel: true,
        isResearch: true,
      },
      { label: 'Writing answer...', status: 'pending', showModel: false },
    ];

    if (status === 'researching') {
      stages[0].status = 'active';
    } else if (status === 'thinking' || status === 'writing') {
      stages[0].status = 'complete';
      stages[1].status = 'active';
    } else if (status === 'complete') {
      stages[0].status = 'complete';
      stages[1].status = 'complete';
    }

    return stages;
  }

  const stages = [
    {
      label: modelName ? `Thinking with` : 'Thinking...',
      status: 'pending',
      showModel: true,
    },
    { label: 'Writing answer...', status: 'pending', showModel: false },
  ];

  if (status === 'thinking') {
    stages[0].status = 'active';
  } else if (status === 'writing') {
    stages[0].status = 'complete';
    stages[1].status = 'active';
  } else if (status === 'complete') {
    stages[0].status = 'complete';
    stages[1].status = 'complete';
  }

  return stages;
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

  const isPro = useSelector(selectCurrentTier) === 'pro';

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
function ImageLimitPrompt({ onClose, onBuyCredits, onUpgrade }) {
  const creditBalance = useSelector(selectCreditBalance);
  const currentTier = useSelector(selectCurrentTier);
  const isFree = !currentTier || currentTier === 'free';

  // Use real credit data from server when available, fall back to tier defaults
  const monthlyLimit =
    creditBalance?.monthly?.total ??
    (currentTier === 'pro' ? 150 : currentTier === 'lite' ? 50 : 5);
  const cycleResetsAt = creditBalance?.cycleResetsAt;
  const resetTime = cycleResetsAt
    ? new Date(cycleResetsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

        <h3 className={styles.imageLimitTitle}>Monthly image limit reached</h3>

        <p className={styles.imageLimitDesc}>
          {isFree
            ? `You’ve used all ${monthlyLimit} free image generation${
                monthlyLimit !== 1 ? 's' : ''
              } for this month.`
            : `You’ve used all ${monthlyLimit} image generation${
                monthlyLimit !== 1 ? 's' : ''
              } included with your ${currentTier === 'lite' ? 'Lite' : 'Pro'} plan this month.`}
          {resetTime && <> Your monthly credits reset at {resetTime}.</>}
        </p>

        {isFree ? (
          <div className={styles.imageLimitUpgrade}>
            <p className={styles.imageLimitUpgradeText}>
              Upgrade to Pro for 150 image credits per month, plus access to premium AI models.
            </p>
            <button className={styles.imageLimitUpgradeBtn} onClick={onUpgrade ?? onClose}>
              Upgrade to Pro
            </button>
          </div>
        ) : (
          <div className={styles.imageLimitUpgrade}>
            <p className={styles.imageLimitUpgradeText}>
              Need more? Purchase an Image Generation add-on for additional credits beyond your
              monthly plan allowance.
            </p>
            <button className={styles.imageLimitUpgradeBtn} onClick={onBuyCredits ?? onClose}>
              Get Image Generation Add-on
            </button>
          </div>
        )}

        <p className={styles.imageLimitFooter}>
          {isFree
            ? `Free plan: ${monthlyLimit} image credit${monthlyLimit !== 1 ? 's' : ''} / month`
            : `${currentTier === 'lite' ? 'Lite' : 'Pro'} plan: ${monthlyLimit} image credit${
                monthlyLimit !== 1 ? 's' : ''
              } / month`}
        </p>
      </div>
    </div>
  );
}

export default function MainContent() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const inputValue = useSelector(selectInputValue);
  const mode = useSelector(selectMode);
  const messages = useSelector(selectMessages);
  const isProcessing = useSelector(selectIsProcessing);
  const selectedModelId = useSelector(selectSelectedModelId);
  const currentChatId = useSelector(selectCurrentChatId);
  const deleteConversation = useDeleteConversation();
  const webSearchEnabled = useSelector(selectWebSearchEnabled);
  const extendedThinking = useSelector(selectExtendedThinking);
  const deepResearch = useSelector(selectDeepResearch);
  const googleThinking = useSelector(selectGoogleThinking);
  const currentTier = useSelector(selectCurrentTier);
  const tone = useSelector(selectTone);
  const mood = useSelector(selectMood);
  const autoStrategy = useSelector(selectAutoStrategy);
  const pendingAutoSubmit = useSelector(selectPendingAutoSubmit);
  const pendingModality = useSelector(selectPendingModality);
  const selectedModality = useSelector(selectSelectedModality);
  const imageQuality = useSelector(selectImageQuality);
  const creditBalance = useSelector(selectCreditBalance);
  const importedContext = useSelector(selectImportedContext);
  const activeProjectId = useSelector(selectActiveProjectId);
  const projects = useSelector(selectProjects);
  const conversations = useSelector(selectConversations);
  const conversationsTotal = useSelector(selectConversationsTotal);
  const effectiveTheme = useSelector(selectEffectiveTheme);
  const isDark = effectiveTheme === 'dark';
  const { showError, showSuccess } = useToast();
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
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showBuyPacksModal, setShowBuyPacksModal] = useState(false);
  const [reportDetails, setReportDetails] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [isSubConvPanelOpen, setIsSubConvPanelOpen] = useState(false);
  const [isCodePanelOpen, setIsCodePanelOpen] = useState(false);
  const [isSourcesPanelOpen, setIsSourcesPanelOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [mobileFileSubmenu, setMobileFileSubmenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [showLimitToast, setShowLimitToast] = useState(false);
  const [showImageLimitPrompt, setShowImageLimitPrompt] = useState(false);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  // conversationProject is now derived from Redux — see below
  const [conversationTitle, setConversationTitle] = useState('');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showProjectCreate, setShowProjectCreate] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);
  const [showRemoveFromProject, setShowRemoveFromProject] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [isRenamingTitle, setIsRenamingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const newProjectInputRef = useRef(null);
  const projectSearchRef = useRef(null);
  const projectDropdownRef = useRef(null);
  const titleRenameInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const attachDropdownRef = useRef(null);
  const chatMenuRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const dropTargetRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Derive conversationProject from Redux conversations (single source of truth)
  const currentConv = conversations.find((c) => c.id === currentChatId);
  const conversationProject = (() => {
    if (!currentConv?.projectId) return null;
    const proj = projects.find((p) => p.id === currentConv.projectId);
    return { id: currentConv.projectId, name: proj?.name || 'Project' };
  })();

  useEffect(() => {
    if (!currentChatId) {
      setConversationTitle('');
      return;
    }
    let cancelled = false;
    fetchConversation(currentChatId)
      .then((conv) => {
        if (!cancelled) setConversationTitle(conv.title || 'Untitled');
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [currentChatId]);

  // Fetch credit balance on mount and when modality switches to image (authenticated users only)
  useEffect(() => {
    if (!isAuthenticated) return;
    if (selectedModality === 'image' || !creditBalance) {
      fetchCreditBalance()
        .then((data) => {
          if (data.balance) {
            dispatch(setCreditBalance(data.balance));
            dispatch(
              setImageCredits({
                used: data.balance.monthly?.used ?? 0,
                limit: data.balance.monthly?.total ?? 5,
                remaining: data.balance.monthly?.remaining ?? 0,
                packRemaining: data.balance.packs?.remaining ?? 0,
                cycleResetsAt: data.balance.cycleResetsAt ?? null,
              })
            );
          }
        })
        .catch(() => {});
    }
  }, [selectedModality, isAuthenticated, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync saved settings to chat Redux state on mount (read from localStorage cache for speed)
  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('araviel-settings') || '{}');
      if (cached.responseTone && cached.responseTone !== 'default') {
        dispatch(setTone(cached.responseTone));
      }
      // Web search preference
      if (cached.webSearchDefault === 'always') dispatch(setWebSearchEnabled(true));
      else if (cached.webSearchDefault === 'never') dispatch(setWebSearchEnabled(false));
      // else null = auto (default)

      // Image quality preference
      if (cached.imageQualityDefault && cached.imageQualityDefault !== 'standard') {
        dispatch(setImageQuality(cached.imageQualityDefault));
      }

      // Reasoning preference
      if (cached.enableReasoning === true) {
        dispatch(setExtendedThinking(true));
      }
    } catch {
      // ignore parse errors
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Helper to dispatch conversation updates with correct payload shape
  const updateConvState = (newConversations) => {
    dispatch(setConversations({ conversations: newConversations, total: conversationsTotal }));
  };

  const handleRemoveFromProject = async () => {
    if (!currentChatId || !conversationProject) return;
    const prev = [...conversations];
    updateConvState(
      conversations.map((c) => (c.id === currentChatId ? { ...c, projectId: null } : c))
    );
    setShowRemoveFromProject(false);
    try {
      await updateConversation(currentChatId, { project_id: null });
      showSuccess('Removed from project');
    } catch {
      updateConvState(prev);
      showError('Could not remove from project. Try again.');
    }
  };

  const handleChangeProject = async (projectId) => {
    if (!currentChatId) return;
    const prev = [...conversations];
    updateConvState(conversations.map((c) => (c.id === currentChatId ? { ...c, projectId } : c)));
    setShowProjectPicker(false);
    setShowProjectCreate(false);
    setShowProjectDropdown(false);
    setProjectSearch('');
    try {
      await updateConversation(currentChatId, { project_id: projectId });
    } catch {
      updateConvState(prev);
      showError('Could not assign to project. Try again.');
    }
  };

  const handleCreateAndAssignProject = async (e) => {
    e.preventDefault();
    const trimmed = newProjectName.trim();
    if (!trimmed || creatingProject || !currentChatId) return;
    setCreatingProject(true);
    try {
      const data = await createProjectApi({ name: trimmed });
      const newProject = data.project || data;
      dispatch(addProject(newProject));
      setNewProjectName('');
      setShowProjectCreate(false);
      await handleChangeProject(newProject.id);
    } catch {
      showError("Couldn't create project. Please try again.");
    } finally {
      setCreatingProject(false);
    }
  };

  // Handle report submission
  const handleReport = async () => {
    if (!currentChatId || !reportReason) return;
    setIsReporting(true);
    try {
      await reportConversation(currentChatId, reportReason, reportDetails);
      updateConvState(
        conversations.map((c) => (c.id === currentChatId ? { ...c, isReported: true } : c))
      );
      setShowReportDialog(false);
      setReportReason('');
      setReportDetails('');
      showSuccess('Report submitted. Thank you for your feedback.');
    } catch {
      showError('Could not submit report. Try again.');
    } finally {
      setIsReporting(false);
    }
  };

  const handleUnreport = async () => {
    if (!currentChatId) return;
    const prev = [...conversations];
    updateConvState(
      conversations.map((c) => (c.id === currentChatId ? { ...c, isReported: false } : c))
    );
    try {
      await updateConversation(currentChatId, { is_reported: false });
      showSuccess('Report removed.');
    } catch {
      updateConvState(prev);
      showError('Could not remove report. Try again.');
    }
  };

  const handleToggleStar = async () => {
    if (!currentChatId) return;
    const isStarred = currentConv?.isStarred || false;
    const prev = [...conversations];
    updateConvState(
      conversations.map((c) => (c.id === currentChatId ? { ...c, isStarred: !isStarred } : c))
    );
    try {
      await updateConversation(currentChatId, { is_starred: !isStarred });
    } catch {
      updateConvState(prev);
      showError('Could not update star status.');
    }
  };

  const handleToggleArchive = async () => {
    if (!currentChatId) return;
    const isArchived = currentConv?.isArchived || false;
    const prev = [...conversations];
    updateConvState(
      conversations.map((c) => (c.id === currentChatId ? { ...c, isArchived: !isArchived } : c))
    );
    try {
      await updateConversation(currentChatId, { is_archived: !isArchived });
      showSuccess(isArchived ? 'Conversation unarchived' : 'Conversation archived');
    } catch {
      updateConvState(prev);
      showError('Could not update archive status.');
    }
  };

  const handleNavigateToProject = () => {
    if (!conversationProject) return;
    navigate(`/projects/${conversationProject.id}`);
  };

  const handleStartRename = () => {
    setTitleDraft(conversationTitle || '');
    setIsRenamingTitle(true);
    setShowProjectDropdown(false);
  };

  const handleCommitRename = async () => {
    const trimmed = titleDraft.trim();
    setIsRenamingTitle(false);
    if (!currentChatId) return;
    if (!trimmed || trimmed === conversationTitle) return;

    const previousTitle = conversationTitle;
    const prevConversations = [...conversations];
    setConversationTitle(trimmed);
    updateConvState(
      conversations.map((c) => (c.id === currentChatId ? { ...c, title: trimmed } : c))
    );
    try {
      await updateConversation(currentChatId, { title: trimmed });
    } catch {
      setConversationTitle(previousTitle);
      updateConvState(prevConversations);
      showError('Could not rename conversation. Try again.');
    }
  };

  const handleCancelRename = () => {
    setIsRenamingTitle(false);
    setTitleDraft('');
  };

  // Close project dropdown on outside click
  useEffect(() => {
    if (!showProjectDropdown) return;
    const handleClick = (e) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(e.target)) {
        setShowProjectDropdown(false);
        setShowProjectPicker(false);
        setShowProjectCreate(false);
        setNewProjectName('');
        setProjectSearch('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showProjectDropdown]);

  // Focus the new project name input when the create form appears
  useEffect(() => {
    if (showProjectCreate && newProjectInputRef.current) {
      newProjectInputRef.current.focus();
    }
  }, [showProjectCreate]);

  // Focus the search input when the project picker opens
  useEffect(() => {
    if (showProjectPicker && !showProjectCreate && projectSearchRef.current) {
      projectSearchRef.current.focus();
    }
  }, [showProjectPicker, showProjectCreate]);

  // Focus + select the rename input when rename mode activates
  useEffect(() => {
    if (isRenamingTitle && titleRenameInputRef.current) {
      const el = titleRenameInputRef.current;
      el.focus();
      el.select();
    }
  }, [isRenamingTitle]);

  // Cancel rename if the user switches conversation mid-edit
  useEffect(() => {
    setIsRenamingTitle(false);
    setTitleDraft('');
  }, [currentChatId]);

  // Streaming / timeline state
  const [pipelineStatus, setPipelineStatus] = useState('idle'); // idle | researching | thinking | writing | complete
  const [researchProgress, setResearchProgress] = useState(null); // { status, sources, actions, statusLabel }
  const [routeResult, setRouteResult] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  // Gates the "Thinking" timeline. Stays false for quick prompts so the user
  // sees the response stream in immediately; flipped on by the backend's
  // `showThinking` flag, by the research flow, or as a safety net when a
  // provider unexpectedly emits a thinking chunk.
  const [showThinkingUI, setShowThinkingUI] = useState(false);

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
          ...(options.images ? { images: options.images } : {}),
        };
        dispatch(addMessage(userMsg));
      }

      dispatch(setIsProcessing(true));
      setPipelineStatus('idle');
      setRouteResult(null);
      // Flip `isStreaming` on at submit so the bubble enters its streaming
      // affordance immediately. Until the first `delta` arrives, the bubble
      // shows pulsing dots (see Message render) instead of streamed text.
      setIsStreaming(true);
      setStreamedText('');
      setShowThinkingUI(false);

      // Drop a placeholder assistant bubble in immediately so the user's
      // message isn't stranded during ADE latency. The bubble renders pulsing
      // dots until the first token arrives; the `routing` SSE handler patches
      // in the real model info (and `done` patches in the final usage).
      const placeholderAssistantId = `pending-${Date.now()}`;
      const placeholderCreatedAt = Date.now();
      dispatch(
        addMessage({
          id: placeholderAssistantId,
          role: 'assistant',
          content: '',
          timestamp: placeholderCreatedAt,
          isPlaceholder: true,
          ...(options.modality === 'image' ? { requestedModality: 'image' } : {}),
          generationStartedAt: placeholderCreatedAt,
        })
      );

      const routingStart = Date.now();
      // Placeholder bubble already dispatched above, so updates start working
      // immediately — no need to wait for `routing` before patching content.
      let assistantMsgAdded = true;
      let accumulatedContent = '';
      let accumulatedThinking = '';
      let accumulatedImages = null;
      let receivedDone = false;
      let routeInfo = null;
      let assistantMessageId = placeholderAssistantId;
      let currentAlternates = [];
      // Tracks whether this request earned a thinking panel — backend flag,
      // research mode, or provider-emitted thinking. Drives `thinkingData`
      // attachment on `done` so quick prompts don't acquire a panel on replay.
      let thinkingPanelEarned = false;

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
          imageQuality: options.imageQuality || undefined,
          webSearch: webSearchParam,
          userLocation: locationPayload,
          tone: tone && tone !== 'default' ? tone : undefined,
          mood: mood || undefined,
          autoStrategy: autoStrategy || undefined,
          weather: userLocation?.weather || undefined,
          requestFollowUps: readBooleanSetting('enableFollowUps', true),
          extendedThinking: extendedThinking || undefined,
          deepResearch: deepResearch || undefined,
          googleThinking: googleThinking || undefined,
          conversationHasImages: options.conversationHasImages || undefined,
          importedConversationId: importedContext?.importedConversationId || undefined,
          projectId: activeProjectId || undefined,
          userTier: currentTier,
          images: options.images || undefined,
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
                // Notify sidebar to refresh conversations list immediately
                window.dispatchEvent(new CustomEvent('araviel-conversation-updated'));
                // Once the backend creates a native conversation, clear imported context
                // so subsequent messages use the native conversation's history
                if (importedContext) {
                  dispatch(setImportedContext(null));
                }
                // Clear active project ID once the conversation is created with the project link
                if (activeProjectId) {
                  dispatch(setActiveProjectId(null));
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

              // Reveal the thinking timeline only when the backend says this
              // prompt deserves it. Otherwise leave status `idle` so the
              // placeholder bubble's pulsing dots stay until the first delta
              // flips us to `writing`.
              const willShowThinking = data.showThinking === true;
              if (willShowThinking) {
                thinkingPanelEarned = true;
                setShowThinkingUI(true);
                setPipelineStatus('thinking');
              }

              // Build alternate models list from backupModels
              const alternates = (data.backupModels || []).map((m) => ({
                modelId: m.id,
                modelName: m.name,
                provider: m.provider,
                score: m.score,
                reasoning: m.reasoning,
              }));
              currentAlternates = alternates;

              // Patch the placeholder bubble in place with the real model
              // info. We only attach `thinkingData` when the panel is meant
              // to show — otherwise the historical `ThinkingBlock` would
              // render for normal messages on later replays.
              assistantMessageId = data.messageId || placeholderAssistantId;
              const assistantPatch = {
                id: assistantMessageId,
                isPlaceholder: false,
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
              };
              if (willShowThinking) {
                assistantPatch.thinkingData = {
                  routingDuration,
                  thinkingDuration: '0.0',
                  totalDuration: routingDuration,
                };
              }
              dispatch(updateLastMessage(assistantPatch));
            } else if (type === 'research_status') {
              // Deep research progress — update the researching pipeline phase
              const statusMap = {
                queued: 'Starting research...',
                planning: 'Planning research...',
                researching:
                  data.sources > 0
                    ? `Searching the web (${data.sources} source${
                        data.sources !== 1 ? 's' : ''
                      })...`
                    : 'Searching the web...',
                synthesizing: 'Synthesizing findings...',
              };
              const statusLabel = statusMap[data.status] || 'Researching...';
              setResearchProgress({
                status: data.status,
                sources: data.sources || 0,
                actions: data.actions || [],
                statusLabel,
              });
              // Research always shows the timeline — even if the backend's
              // initial `routing` flag was somehow false for this request.
              thinkingPanelEarned = true;
              setShowThinkingUI(true);
              setPipelineStatus('researching');
              // Feed search actions into thinking content so they show in the timeline
              if (data.actions && data.actions.length > 0) {
                const latestAction = data.actions[data.actions.length - 1];
                if (latestAction.query) {
                  accumulatedThinking = (data.actions || [])
                    .filter((a) => a.query)
                    .map((a) => `Searching: ${a.query}`)
                    .join('\n');
                  if (assistantMsgAdded) {
                    dispatch(updateLastMessage({ thinkingContent: accumulatedThinking }));
                  }
                }
              }
            } else if (type === 'thinking') {
              // Transition to thinking phase (handles both normal and post-research flows).
              // Also serves as a safety net: if the provider emits reasoning
              // chunks when the backend didn't predict it, reveal the panel.
              thinkingPanelEarned = true;
              setShowThinkingUI(true);
              setPipelineStatus('thinking');
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
              // Images are now uploaded to Supabase Storage; URL is a public URL (not base64)
              const imageUrl =
                data.url || (data.b64_json ? `data:image/png;base64,${data.b64_json}` : null);
              if (assistantMsgAdded && imageUrl) {
                const imgEntry = saveGeneratedImage({
                  id: data.id, // Use the ID from backend (Supabase Storage)
                  url: imageUrl,
                  prompt: data.prompt || prompt,
                  model: data.model || routeInfo?.modelName,
                  provider: data.provider || routeInfo?.provider,
                  size: data.size,
                  style: data.style,
                  messageId: assistantMessageId,
                });
                recordGeneration();
                const newImages = [
                  ...(accumulatedImages || []),
                  {
                    url: imageUrl,
                    prompt: data.prompt || prompt,
                    model: data.model || routeInfo?.modelName,
                    provider: data.provider || routeInfo?.provider,
                    id: imgEntry.id,
                    size: data.size,
                  },
                ];
                dispatch(updateLastMessage({ generatedImages: newImages }));
                accumulatedImages = newImages;
              }
            } else if (type === 'title') {
              if (
                data?.conversationId &&
                typeof data?.title === 'string' &&
                data.title.length > 0
              ) {
                // Sidebar reflects the new title instantly via Redux; breadcrumb
                // is updated in place since this handler already short-circuits
                // on abort above (so the user is still viewing this chat).
                dispatch(updateConversationTitle({ id: data.conversationId, title: data.title }));
                setConversationTitle(data.title);
              }
            } else if (type === 'followups') {
              if (assistantMsgAdded && data.suggestions) {
                dispatch(updateLastMessage({ followUps: data.suggestions }));
              }
            } else if (type === 'questions') {
              if (assistantMsgAdded && data.questions) {
                dispatch(updateLastMessage({ questions: data.questions }));
              }
            } else if (type === 'done') {
              receivedDone = true;
              const totalDuration = ((Date.now() - routingStart) / 1000).toFixed(1);
              // Authoritative final model from the backend. Reaffirms the
              // identity already swapped on PROVIDER_RETRY, and corrects any
              // edge case where a fallback path didn't emit one.
              if (data.model && data.model.id) {
                routeInfo = {
                  modelId: data.model.id,
                  modelName: data.model.name,
                  provider: data.model.provider,
                };
              }
              if (assistantMsgAdded) {
                dispatch(
                  updateLastMessage({
                    ...(data.model && data.model.id
                      ? {
                          modelId: data.model.id,
                          modelName: data.model.name,
                          provider: data.model.provider,
                          score: data.model.score,
                          reasoning: data.model.reasoning,
                        }
                      : {}),
                    usage: data.usage,
                    costUsd: data.usage?.costUsd,
                    latencyMs: data.latencyMs,
                    adeLatencyMs: data.adeLatencyMs,
                    // Only persist the thinking summary if this request
                    // earned a panel — otherwise historical replays would
                    // resurrect the timeline for prompts that streamed
                    // straight through with no reasoning.
                    ...(thinkingPanelEarned
                      ? {
                          thinkingData: {
                            routingDuration: ((data.adeLatencyMs || 0) / 1000).toFixed(1),
                            thinkingDuration: '0.0',
                            totalDuration,
                          },
                        }
                      : {}),
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
              // Update both Redux slices from the authoritative post-charge balance embedded
              // in the done event. No extra round-trip to /api/credits needed.
              if (data.imageBalance) {
                dispatch(setCreditBalance(data.imageBalance));
                dispatch(
                  setImageCredits({
                    used: data.imageBalance.monthly?.used ?? 0,
                    limit: data.imageBalance.monthly?.total ?? 5,
                    remaining: data.imageBalance.monthly?.remaining ?? 0,
                    packRemaining: data.imageBalance.packs?.remaining ?? 0,
                    cycleResetsAt: data.imageBalance.cycleResetsAt ?? null,
                  })
                );
                // Signal SettingsView (and any component with local credit state) to re-fetch
                window.dispatchEvent(new CustomEvent('araviel-credits-updated'));
              }
              // Sync text credits from SSE done event
              if (data.textCredits) {
                dispatch(
                  setTextCredits({
                    monthlyUsed: data.textCredits.monthlyUsed,
                    monthlyLimit: data.textCredits.monthlyLimit,
                    windowUsed: data.textCredits.windowUsed,
                    windowLimit: data.textCredits.windowLimit,
                    windowResetAt: data.textCredits.windowResetAt,
                  })
                );
              }
              // Refresh sidebar conversations after stream completes (title may now be set)
              window.dispatchEvent(new CustomEvent('araviel-conversation-updated'));
            } else if (type === 'error') {
              if (data.code === 'PROVIDER_RETRY') {
                // Backup is producing the authoritative response — abandon any
                // partial primary output and swap the message identity over so
                // the badge, analytics, and alternates list all reflect the
                // backup that actually responded.
                accumulatedContent = '';
                accumulatedThinking = '';
                accumulatedImages = null;
                setStreamedText('');

                if (assistantMsgAdded) {
                  const prevPrimary = routeInfo;
                  const demotedPrimary =
                    prevPrimary && prevPrimary.modelId
                      ? {
                          modelId: prevPrimary.modelId,
                          modelName: prevPrimary.modelName,
                          provider: prevPrimary.provider,
                        }
                      : null;
                  const filteredAlternates = (currentAlternates || []).filter(
                    (m) => m.modelId !== data.toModelId
                  );
                  const nextAlternates = demotedPrimary
                    ? [demotedPrimary, ...filteredAlternates]
                    : filteredAlternates;

                  currentAlternates = nextAlternates;
                  routeInfo = {
                    modelId: data.toModelId,
                    modelName: data.toModel || 'Unknown',
                    provider: data.toProvider,
                  };

                  dispatch(
                    updateLastMessage({
                      content: '',
                      thinkingContent: '',
                      citations: null,
                      toolUse: null,
                      webSearchUsed: false,
                      modelId: data.toModelId,
                      modelName: data.toModel || 'Unknown',
                      provider: data.toProvider,
                      score: data.toScore,
                      reasoning: data.toReasoning || 'Selected after primary model failed',
                      isManualSelection: false,
                      alternateModels: nextAlternates,
                      providerRetry: {
                        fromModel: data.fromModel || 'Unknown',
                        toModel: data.toModel || 'Unknown',
                        reason: data.reason || 'Retrying with a different model',
                      },
                    })
                  );
                }
              } else if (data.code === 'MONTHLY_CREDITS_EXHAUSTED') {
                dispatch(setIsProcessing(false));
                dispatch(
                  showUpgradeModal({
                    reason: 'credit_limit',
                    suggestedTier: getNextTier(data.tier || 'free'),
                    message: data.message || "You've used all your monthly credits.",
                  })
                );
                if (assistantMsgAdded) {
                  dispatch(
                    updateLastMessage({
                      content: '',
                      error: {
                        message: data.message || 'Monthly credit limit reached',
                        code: data.code,
                      },
                    })
                  );
                }
              } else if (data.code === 'WINDOW_CREDITS_EXHAUSTED') {
                dispatch(setIsProcessing(false));
                // Softer message for window limit - no upgrade modal
                if (assistantMsgAdded) {
                  dispatch(
                    updateLastMessage({
                      content: '',
                      error: {
                        message: data.message || '3-hour window limit reached',
                        code: data.code,
                      },
                    })
                  );
                }
              } else if (data.code === 'GUEST_LIMIT') {
                dispatch(setIsProcessing(false));
                // Guest limit reached — show sign-up auth modal
                navigate('/signup', { state: { from: location.pathname + location.search } });
                if (assistantMsgAdded) {
                  dispatch(
                    updateLastMessage({
                      content: '',
                      error: {
                        message: data.message || 'Sign up free to keep chatting',
                        code: data.code,
                      },
                    })
                  );
                }
              } else if (data.code === 'INSUFFICIENT_CREDITS') {
                // Image credit limit reached — show buy packs modal
                dispatch(setIsProcessing(false));
                setShowBuyPacksModal(true);
                if (assistantMsgAdded) {
                  dispatch(
                    updateLastMessage({
                      content: '',
                      error: {
                        message: data.message || 'Insufficient image credits',
                        code: data.code,
                      },
                    })
                  );
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
        const errorCode = err.code || 'INTERNAL_ERROR';
        const errorPayload = {
          message: err.message || 'Connection failed',
          code: errorCode,
        };
        if (assistantMsgAdded) {
          dispatch(
            updateLastMessage({
              content: accumulatedContent || '',
              error: errorPayload,
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
              error: errorPayload,
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
        setResearchProgress(null);
        setShowThinkingUI(false);
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
      activeProjectId,
      currentTier,
    ]
  );

  /**
   * Main submit handler.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const prompt = inputValue.trim();
    if ((!prompt && attachedFiles.length === 0) || isProcessing) return;

    // Determine if this prompt will generate an image
    const willGenerateImage =
      (selectedModelId && isImageGenerationModel(selectedModelId)) ||
      pendingModality === 'image' ||
      selectedModality === 'image';

    // Guest limit checks — separate text and image counters
    if (!isAuthenticated) {
      if (willGenerateImage && hasReachedGuestImageLimit()) {
        navigate('/signup', { state: { from: location.pathname + location.search } });
        return;
      }
      if (!willGenerateImage && hasReachedGuestLimit()) {
        navigate('/signup', { state: { from: location.pathname + location.search } });
        return;
      }
    }

    // Authenticated user image generation limits
    if (willGenerateImage && isAuthenticated) {
      // Check credit balance (client-side fast check)
      if (creditBalance && creditBalance.combined < getCreditCost(imageQuality)) {
        setShowBuyPacksModal(true);
        return;
      }
      // Optimistic deduction: reflect the cost immediately so the UI responds
      // before the server confirms. The done event corrects with the real balance.
      if (creditBalance) {
        const cost = getCreditCost(imageQuality);
        const monthlyDelta = Math.min(cost, creditBalance.monthly?.remaining ?? 0);
        const packDelta = cost - monthlyDelta;
        dispatch(
          setCreditBalance({
            ...creditBalance,
            monthly: {
              ...creditBalance.monthly,
              remaining: Math.max(0, (creditBalance.monthly?.remaining ?? 0) - monthlyDelta),
              used: (creditBalance.monthly?.used ?? 0) + monthlyDelta,
            },
            packs: {
              ...creditBalance.packs,
              remaining: Math.max(0, (creditBalance.packs?.remaining ?? 0) - packDelta),
              used: (creditBalance.packs?.used ?? 0) + packDelta,
            },
            combined: Math.max(0, (creditBalance.combined ?? 0) - cost),
          })
        );
        dispatch(
          setImageCredits({
            remaining: Math.max(0, (creditBalance.monthly?.remaining ?? 0) - monthlyDelta),
            used: (creditBalance.monthly?.used ?? 0) + monthlyDelta,
            packRemaining: Math.max(0, (creditBalance.packs?.remaining ?? 0) - packDelta),
          })
        );
      }
    }

    // Capture image files before clearing state
    const imageFiles = attachedFiles.filter((f) => f.file && isAcceptedImageType(f.file));

    dispatch(setInputValue(''));
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setActiveDropdown(null);
    setShowAttachDropdown(false);
    clearAttachedFiles();

    // Compress images in parallel
    let compressedImages = [];
    if (imageFiles.length > 0) {
      try {
        compressedImages = await Promise.all(imageFiles.map((f) => compressImage(f.file)));
      } catch (err) {
        logger.warn('Image compression failed', {
          route: 'chat.submit',
          error: err?.message,
        });
        // Continue without images — don't block the message
        compressedImages = [];
      }
    }

    // Let the backend router know if this conversation already has generated
    // or uploaded images so it can factor that into model selection
    const conversationHasImages = messages.some(
      (m) =>
        (m.generatedImages && m.generatedImages.length > 0) ||
        (m.images && m.images.length > 0) ||
        (m.attachments && m.attachments.length > 0)
    );

    // Set modality to 'image' when an image generation model is explicitly selected or ModalityBar
    const modality =
      selectedModality === 'image'
        ? 'image'
        : selectedModelId && isImageGenerationModel(selectedModelId)
        ? 'image'
        : undefined;

    // Track guest prompt usage — separate text and image counters
    if (!isAuthenticated) {
      if (willGenerateImage) {
        incrementGuestImageCount();
      } else {
        incrementGuestPromptCount();
      }
    }

    await runSSEPipeline(prompt, {
      selectedModelId: selectedModelId || undefined,
      addUserMessage: true,
      webSearch: webSearchEnabled,
      conversationHasImages: conversationHasImages || compressedImages.length > 0 || undefined,
      modality,
      imageQuality: willGenerateImage ? imageQuality : undefined,
      images: compressedImages.length > 0 ? compressedImages : undefined,
    });

    // Image quick-prompt one-shot: after the message completes, revert
    // modality + quality to whatever the user had before clicking the pill.
    // A no-op when no override is active.
    dispatch(revertQuickPromptImageOverride());
  };

  // Auto-submit when navigating from another view (e.g. Image Gallery quick
  // prompt, Project workspace). Picks up any handed-off attachments from the
  // pending-attachments cache so a file uploaded in another view travels with
  // the message. The fired flag is reset when pendingAutoSubmit goes false so
  // the next cycle can fire, while still guarding against StrictMode double-runs.
  const autoSubmitFiredRef = useRef(false);
  useEffect(() => {
    if (!pendingAutoSubmit) {
      autoSubmitFiredRef.current = false;
      return;
    }
    if (isProcessing || autoSubmitFiredRef.current) return;

    const prompt = inputValue.trim();
    const handedOffFiles = takePendingAttachments();
    if (!prompt && handedOffFiles.length === 0) return;
    autoSubmitFiredRef.current = true;

    const modality = pendingModality || undefined;
    if (modality === 'image') {
      dispatch(setSelectedModality('image'));
    }

    const willGenImage =
      modality === 'image' || (selectedModelId && isImageGenerationModel(selectedModelId));

    if (!isAuthenticated && willGenImage && hasReachedGuestImageLimit()) {
      dispatch(setPendingAutoSubmit(false));
      dispatch(setPendingModality(null));
      navigate('/signup', { state: { from: location.pathname + location.search } });
      return;
    }

    if (
      isAuthenticated &&
      willGenImage &&
      creditBalance &&
      creditBalance.combined < getCreditCost(imageQuality)
    ) {
      dispatch(setPendingAutoSubmit(false));
      dispatch(setPendingModality(null));
      setShowBuyPacksModal(true);
      return;
    }

    dispatch(setPendingAutoSubmit(false));
    dispatch(setPendingModality(null));
    dispatch(setInputValue(''));
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    (async () => {
      let compressedImages = [];
      const imageFiles = handedOffFiles.filter(isAcceptedImageType);
      if (imageFiles.length > 0) {
        try {
          compressedImages = await Promise.all(imageFiles.map((f) => compressImage(f)));
        } catch (err) {
          logger.warn('Image compression failed', {
            route: 'chat.auto-submit',
            error: err?.message,
          });
          compressedImages = [];
        }
      }
      runSSEPipeline(prompt, {
        selectedModelId: selectedModelId || undefined,
        addUserMessage: true,
        webSearch: webSearchEnabled,
        modality,
        imageQuality: willGenImage ? imageQuality : undefined,
        conversationHasImages: compressedImages.length > 0 || undefined,
        images: compressedImages.length > 0 ? compressedImages : undefined,
      });
    })();
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

    // If the user cancels before any tokens arrived, the placeholder
    // assistant bubble has no content — drop it so the conversation doesn't
    // end on an empty card. Once content has streamed in, we keep the partial.
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'assistant' && !lastMsg.content) {
      dispatch(removeLastAssistantMessage());
    }

    setIsStreaming(false);
    setStreamedText('');
    setPipelineStatus('idle');
    setRouteResult(null);
    setIsManualRequest(false);
    setShowThinkingUI(false);
    dispatch(setIsProcessing(false));
  }, [dispatch, messages]);

  const handleModeClick = (newMode) => {
    if (activeDropdown === newMode) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(newMode);
      setShowAttachDropdown(false);
      dispatch(setMode(newMode));
    }
  };

  const handlePromptSelect = (pillKey, itemIndex) => {
    const applied = handleQuickPromptSelection({
      dispatch,
      pillKey,
      itemIndex,
      currentTier,
    });
    if (!applied) return;
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

  const handleOpenRecent = useCallback(
    (conversationId) => {
      if (!conversationId) return;
      navigate(`/conversations/${conversationId}`);
      requestAnimationFrame(() => focusInput());
    },
    [navigate, focusInput]
  );

  const handleCloseDropdown = () => {
    setActiveDropdown(null);
  };

  const handleKeyDown = (e) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    const sendWithEnter = readBooleanSetting('sendWithEnter', true);
    const modifierPressed = e.metaKey || e.ctrlKey;
    // With "Send with Enter" on, plain Enter and Cmd/Ctrl+Enter both submit.
    // With it off, only Cmd/Ctrl+Enter submits and plain Enter falls through
    // to the browser's default newline behaviour.
    if (sendWithEnter || modifierPressed) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  /**
   * Retry handler.
   */
  const handleRetry = useCallback(
    async (userPrompt, userImages) => {
      if (isProcessing) return;
      dispatch(removeLastAssistantMessage());

      await new Promise((resolve) => setTimeout(resolve, 150));

      const images = Array.isArray(userImages) && userImages.length > 0 ? userImages : undefined;

      await runSSEPipeline(userPrompt, {
        selectedModelId: selectedModelId || undefined,
        conversationId: currentChatId || undefined,
        addUserMessage: false,
        webSearch: webSearchEnabled,
        imageQuality: imageQuality || undefined,
        images,
        conversationHasImages: images ? true : undefined,
      });
    },
    [
      dispatch,
      isProcessing,
      selectedModelId,
      currentChatId,
      runSSEPipeline,
      webSearchEnabled,
      imageQuality,
    ]
  );

  /**
   * Alternate model request handler.
   */
  const handleAlternateModelRequest = useCallback(
    async (userPrompt, alternateModel, userImages) => {
      if (isProcessing) return;

      await new Promise((resolve) => setTimeout(resolve, 150));

      const images = Array.isArray(userImages) && userImages.length > 0 ? userImages : undefined;

      await runSSEPipeline(userPrompt, {
        selectedModelId: alternateModel.modelId,
        conversationId: currentChatId || undefined,
        addUserMessage: false,
        imageQuality: imageQuality || undefined,
        images,
        conversationHasImages: images ? true : undefined,
      });
    },
    [isProcessing, currentChatId, runSSEPipeline, imageQuality]
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
      label:
        tone && tone !== 'default'
          ? `Tone: ${tone.charAt(0).toUpperCase() + tone.slice(1)}`
          : 'Tone',
      icon: MicIcon,
    },
    {
      id: 'mood',
      label: mood ? `Mood: ${mood.charAt(0).toUpperCase() + mood.slice(1)}` : 'Mood',
      icon: SmileIcon,
    },
  ];

  const maxAttachments = currentTier === 'pro' ? 10 : currentTier === 'lite' ? 5 : 1;

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
      TXT: '#6b7280',
      CSV: '#22c55e',
      JSON: '#eab308',
      XML: '#06b6d4',
    };
    return colors[ext] || '#6b7280';
  };

  const handleAttachFiles = useCallback(
    (incomingFiles) => {
      if (!incomingFiles || incomingFiles.length === 0) return;
      const remainingSlots = maxAttachments - attachedFiles.length;
      if (remainingSlots <= 0) {
        setShowLimitToast(true);
        return;
      }
      const filesToAdd = incomingFiles.slice(0, remainingSlots);
      if (filesToAdd.length < incomingFiles.length) {
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
    },
    [attachedFiles.length, maxAttachments]
  );

  const handleFileSelect = (e) => {
    handleAttachFiles(Array.from(e.target.files || []));
    if (e.target) e.target.value = '';
  };

  const { isDragging } = useFileDrop(dropTargetRef, {
    onFiles: handleAttachFiles,
    enabled: !isProcessing,
  });
  usePasteImages({ onFiles: handleAttachFiles, enabled: !isProcessing });

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
      // Screen-capture rejection is user-initiated; log at debug so it shows
      // up only in dev — this is not an application error.
      logger.debug('Screenshot capture cancelled', { reason: err?.message });
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
    // Tier gating: check if user has access to this mode
    if (modeConf.requiredTier) {
      const tierOrder = ['free', 'lite', 'pro'];
      const userLevel = tierOrder.indexOf(currentTier);
      const requiredLevel = tierOrder.indexOf(modeConf.requiredTier);
      if (userLevel < requiredLevel) {
        dispatch(
          showUpgradeModal({
            reason: 'feature_gated',
            suggestedTier: modeConf.requiredTier,
            message: `${modeConf.label} requires the ${
              modeConf.requiredTier.charAt(0).toUpperCase() + modeConf.requiredTier.slice(1)
            } plan.`,
          })
        );
        return;
      }
    }
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

  // Build timeline stages. Gated on `showThinkingUI` so quick prompts never
  // build a stage array — `MessageList` skips the timeline wrapper when this
  // is null, and the response streams straight into the assistant bubble.
  const timelineStages =
    showThinkingUI && pipelineStatus !== 'idle'
      ? createStages(pipelineStatus, routeResult ? routeResult.modelName : null, researchProgress)
      : null;

  return (
    <main
      ref={dropTargetRef}
      className={`${styles.main} ${hasMessages ? styles.hasMessages : ''} ${
        isSubConvPanelOpen ? styles.subConvPanelOpen : ''
      } ${isCodePanelOpen ? styles.codePanelOpen : ''} ${
        isSourcesPanelOpen ? styles.sourcesPanelOpen : ''
      }`}
    >
      <DropOverlay visible={isDragging} />
      {/* Top nav bar */}
      <div className={styles.topNav}>
        {/* Breadcrumb — title + project context */}
        {currentChatId && conversationTitle && (
          <div className={styles.breadcrumb} ref={projectDropdownRef}>
            {conversationProject && (
              <>
                <button
                  className={styles.breadcrumbProject}
                  onClick={handleNavigateToProject}
                  title={`Open ${conversationProject.name}`}
                >
                  <ProjectsIcon />
                  <span>{conversationProject.name}</span>
                </button>
                <span className={styles.breadcrumbSep} aria-hidden="true">
                  /
                </span>
              </>
            )}

            {isRenamingTitle ? (
              <input
                ref={titleRenameInputRef}
                type="text"
                className={styles.breadcrumbRenameInput}
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={handleCommitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCommitRename();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    handleCancelRename();
                  }
                }}
                maxLength={200}
                aria-label="Rename conversation"
              />
            ) : (
              <button
                className={`${styles.breadcrumbTitleBtn} ${
                  showProjectDropdown ? styles.breadcrumbTitleBtnOpen : ''
                }`}
                onClick={() => {
                  setShowProjectDropdown(!showProjectDropdown);
                  setShowProjectPicker(false);
                  setShowProjectCreate(false);
                  setProjectSearch('');
                }}
                aria-haspopup="menu"
                aria-expanded={showProjectDropdown}
                aria-label="Conversation options"
              >
                <span
                  key={conversationTitle}
                  className={styles.breadcrumbTitle}
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {conversationTitle}
                </span>
                <ChevronDownIcon />
              </button>
            )}

            {/* Main dropdown menu */}
            {showProjectDropdown && !showProjectPicker && !showProjectCreate && (
              <div className={styles.projectDropdown} role="menu">
                <button
                  className={styles.projectDropdownItem}
                  role="menuitem"
                  onClick={handleStartRename}
                >
                  <EditIcon />
                  <span>Rename</span>
                </button>
                <button
                  className={styles.projectDropdownItem}
                  role="menuitem"
                  onClick={() => setShowProjectPicker(true)}
                >
                  <ProjectsIcon />
                  <span>{conversationProject ? 'Change project' : 'Add to project'}</span>
                </button>
                {conversationProject && (
                  <button
                    className={`${styles.projectDropdownItem} ${styles.projectDropdownItemDanger}`}
                    role="menuitem"
                    onClick={() => {
                      setShowProjectDropdown(false);
                      setShowRemoveFromProject(true);
                    }}
                  >
                    <CloseIcon />
                    <span>Remove from project</span>
                  </button>
                )}
              </div>
            )}

            {/* Project picker sub-menu */}
            {showProjectDropdown && showProjectPicker && !showProjectCreate && (
              <div className={styles.projectDropdown}>
                <div className={styles.projectPickerHeader}>
                  <button
                    className={styles.projectPickerBack}
                    onClick={() => {
                      setShowProjectPicker(false);
                      setProjectSearch('');
                    }}
                    aria-label="Back"
                  >
                    <ChevronLeftIcon />
                  </button>
                  <div className={styles.projectPickerSearchWrap}>
                    <SearchIcon />
                    <input
                      ref={projectSearchRef}
                      className={styles.projectPickerSearchInput}
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      placeholder="Search projects..."
                      autoComplete="off"
                    />
                  </div>
                </div>
                <div className={styles.projectPickerList}>
                  {!projectSearch.trim() && (
                    <button
                      className={styles.projectPickerCreate}
                      onClick={() => setShowProjectCreate(true)}
                    >
                      <PlusIcon />
                      <span>New project</span>
                    </button>
                  )}
                  {(() => {
                    const available = projects
                      .filter(
                        (p) =>
                          !p.is_archived &&
                          (!conversationProject || p.id !== conversationProject.id)
                      )
                      .filter(
                        (p) =>
                          !projectSearch.trim() ||
                          p.name.toLowerCase().includes(projectSearch.trim().toLowerCase())
                      );
                    if (available.length === 0) {
                      return (
                        <p className={styles.projectPickerEmpty}>
                          {projectSearch.trim()
                            ? `No projects match "${projectSearch.trim()}"`
                            : conversationProject
                            ? 'No other projects available'
                            : 'No projects yet — create one above'}
                        </p>
                      );
                    }
                    return available.map((project) => (
                      <button
                        key={project.id}
                        className={styles.projectPickerItem}
                        onClick={() => handleChangeProject(project.id)}
                      >
                        <ProjectsIcon />
                        <span>{project.name}</span>
                      </button>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Inline create project form */}
            {showProjectDropdown && showProjectCreate && (
              <div className={styles.projectDropdown}>
                <div className={styles.projectPickerHeader}>
                  <button
                    className={styles.projectPickerBack}
                    onClick={() => {
                      setShowProjectCreate(false);
                      setNewProjectName('');
                    }}
                    aria-label="Back"
                  >
                    <ChevronLeftIcon />
                  </button>
                  <span className={styles.projectPickerHeaderTitle}>New project</span>
                </div>
                <form className={styles.projectCreateForm} onSubmit={handleCreateAndAssignProject}>
                  <input
                    ref={newProjectInputRef}
                    className={styles.projectCreateInput}
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Project name"
                    maxLength={100}
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    className={styles.projectCreateSubmit}
                    disabled={!newProjectName.trim() || creatingProject}
                  >
                    {creatingProject ? 'Creating...' : 'Create & assign'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
        <div className={styles.topNavInner}>
          {currentChatId && (
            <>
              {currentConv?.isReported && (
                <span className={styles.reportedFlag} title="This conversation has been reported">
                  <FlagIcon />
                </span>
              )}
              <button
                className={styles.shareBtn}
                onClick={() => setShowShareModal(true)}
                title="Share"
                aria-label="Share conversation"
              >
                <ShareIcon />
              </button>
            </>
          )}
          {isAuthenticated ? (
            <>
              {(() => {
                const upgradeLabel = getUpgradeCtaLabel(currentTier);
                if (!upgradeLabel) return null;
                return (
                  <button
                    type="button"
                    className={styles.upgradeNavBtn}
                    onClick={() => navigate('/plans')}
                    title={`${upgradeLabel} your plan`}
                    aria-label={`${upgradeLabel} your plan`}
                  >
                    <ZapIcon />
                    <span className={styles.upgradeNavBtnLabel}>{upgradeLabel}</span>
                  </button>
                );
              })()}
            </>
          ) : (
            <>
              <button
                type="button"
                className={styles.signInNavBtn}
                onClick={() =>
                  navigate('/login', {
                    state: { from: location.pathname + location.search },
                  })
                }
                aria-label="Sign in"
              >
                <span className={styles.signInNavBtnLabel}>Sign in</span>
              </button>
              <button
                type="button"
                className={styles.signUpNavBtn}
                onClick={() =>
                  navigate('/signup', {
                    state: { from: location.pathname + location.search },
                  })
                }
                aria-label="Sign up"
              >
                <span className={styles.signUpNavBtnLabel}>Sign up</span>
              </button>
            </>
          )}
          {currentChatId && (
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
                      handleToggleStar();
                    }}
                  >
                    <StarIcon />
                    <span>{currentConv?.isStarred ? 'Unstar' : 'Star conversation'}</span>
                  </button>
                  <button
                    className={styles.chatMenuItem}
                    onClick={() => {
                      setShowChatMenu(false);
                      handleToggleArchive();
                    }}
                  >
                    <ArchiveIcon />
                    <span>{currentConv?.isArchived ? 'Unarchive' : 'Archive'}</span>
                  </button>
                  <button
                    className={`${styles.chatMenuItem} ${
                      currentConv?.isReported ? styles.chatMenuItemReported : ''
                    }`}
                    onClick={() => {
                      setShowChatMenu(false);
                      if (currentConv?.isReported) {
                        handleUnreport();
                      } else {
                        setShowReportDialog(true);
                      }
                    }}
                  >
                    <FlagIcon />
                    <span>{currentConv?.isReported ? 'Unreport' : 'Report'}</span>
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
          )}
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
                  if (currentChatId) deleteConversation(currentChatId);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove from project confirmation */}
      {showRemoveFromProject && conversationProject && (
        <div className={styles.confirmOverlay} onClick={() => setShowRemoveFromProject(false)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmIconProject}>
              <ProjectsIcon />
            </div>
            <h3 className={styles.confirmTitle}>Remove from project?</h3>
            <p className={styles.confirmDesc}>
              This conversation will be removed from <strong>{conversationProject.name}</strong>. It
              won&apos;t be deleted — you can add it back anytime.
            </p>
            <div className={styles.confirmActions}>
              <button
                className={styles.confirmCancelBtn}
                onClick={() => setShowRemoveFromProject(false)}
              >
                Keep in project
              </button>
              <button className={styles.confirmRemoveBtn} onClick={handleRemoveFromProject}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report dialog */}
      {showReportDialog && (
        <div
          className={styles.confirmOverlay}
          onClick={() => {
            setShowReportDialog(false);
            setReportReason('');
            setReportDetails('');
          }}
        >
          <div
            className={styles.confirmDialog}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 420 }}
          >
            <div className={styles.confirmIcon} style={{ color: 'var(--warning-color, #f59e0b)' }}>
              <FlagIcon />
            </div>
            <h3 className={styles.confirmTitle}>Report conversation</h3>
            <p className={styles.confirmDesc}>
              Help us improve by flagging conversations that don&apos;t meet quality standards.
            </p>
            <div className={styles.reportReasons}>
              {[
                { value: 'harmful', label: 'Harmful content' },
                { value: 'inaccurate', label: 'Inaccurate response' },
                { value: 'inappropriate', label: 'Inappropriate content' },
                { value: 'other', label: 'Other' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`${styles.reportReasonLabel} ${
                    reportReason === opt.value ? styles.reportReasonSelected : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={opt.value}
                    checked={reportReason === opt.value}
                    onChange={() => setReportReason(opt.value)}
                    className={styles.reportReasonRadio}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            <textarea
              className={styles.reportDetailsInput}
              placeholder="Additional details (optional)"
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              rows={3}
            />
            <div className={styles.confirmActions}>
              <button
                className={styles.confirmCancelBtn}
                onClick={() => {
                  setShowReportDialog(false);
                  setReportReason('');
                  setReportDetails('');
                }}
              >
                Cancel
              </button>
              <button
                className={styles.confirmRemoveBtn}
                onClick={handleReport}
                disabled={!reportReason || isReporting}
                style={{ opacity: !reportReason || isReporting ? 0.5 : 1 }}
              >
                {isReporting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share modal */}
      {showShareModal && currentChatId && (
        <ShareModal
          conversationId={currentChatId}
          conversationTitle={currentConv?.title}
          messages={messages}
          onClose={() => setShowShareModal(false)}
          onSuccess={showSuccess}
          onError={showError}
        />
      )}

      {showBuyPacksModal && <BuyPacksModal onClose={() => setShowBuyPacksModal(false)} />}

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
      {showImageLimitPrompt && (
        <ImageLimitPrompt
          onClose={() => setShowImageLimitPrompt(false)}
          onBuyCredits={() => {
            setShowImageLimitPrompt(false);
            setShowBuyPacksModal(true);
          }}
          onUpgrade={() => {
            setShowImageLimitPrompt(false);
            navigate('/plans');
          }}
        />
      )}

      {/* Messages area — only shown when there are messages */}
      {hasMessages && (
        <MessageList
          messages={messages}
          isProcessing={isProcessing}
          timelineStages={timelineStages}
          timelineFading={pipelineStatus === 'complete'}
          modelName={routeResult ? routeResult.modelName : null}
          provider={routeResult ? routeResult.provider : null}
          isStreaming={isStreaming}
          streamedText={streamedText}
          onRetry={handleRetry}
          onSessionExpired={() =>
            navigate('/login', { state: { from: location.pathname + location.search } })
          }
          onAlternateModelRequest={handleAlternateModelRequest}
          onSubConvPanelToggle={setIsSubConvPanelOpen}
          onCodePanelToggle={setIsCodePanelOpen}
          onSourcesPanelToggle={setIsSourcesPanelOpen}
          focusInput={focusInput}
          currentChatId={currentChatId}
          webSearchEnabled={webSearchEnabled}
          onSendMessage={runSSEPipeline}
        />
      )}

      <div className={`${styles.container} ${hasMessages ? styles.containerBottom : ''}`}>
        {/* Greeting — only when no messages */}
        {!hasMessages && (
          <>
            <h1 className={styles.greeting}>{getGreeting()}</h1>
            <DynamicSubtitle onOpen={handleOpenRecent} isInputActive={isInputFocused} />
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
              <MarkdownTextarea
                ref={textareaRef}
                className={styles.input}
                placeholder={hasMessages ? 'Reply...' : 'Ask anything...'}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
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
                            const tierOrder = ['free', 'lite', 'pro'];
                            const isLocked =
                              modeConf.requiredTier &&
                              tierOrder.indexOf(currentTier) <
                                tierOrder.indexOf(modeConf.requiredTier);
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
                                  <span className={styles.researchModeName}>
                                    {modeConf.label}
                                    {isLocked && (
                                      <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        style={{
                                          marginLeft: 4,
                                          opacity: 0.5,
                                          verticalAlign: 'middle',
                                        }}
                                      >
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                      </svg>
                                    )}
                                  </span>
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
                                  // Persist tone to user settings
                                  saveSettings({ responseTone: opt.id });
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
                          {CLOUD_PROVIDERS.map((provider) => {
                            const ProviderIcon = CLOUD_PROVIDER_ICONS[provider.id];
                            return (
                              <button
                                key={provider.id}
                                className={styles.cloudProviderOption}
                                onClick={() => handleCloudProviderClick(provider)}
                              >
                                <span className={styles.cloudProviderIcon}>
                                  {ProviderIcon && <ProviderIcon />}
                                </span>
                                <span className={styles.cloudProviderName}>{provider.name}</span>
                                <span className={styles.cloudProviderArrow}>
                                  <ExternalLinkIcon />
                                </span>
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
                  <ModalityBar />
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
                  <ResearchModeChip
                    disabled={isProcessing}
                    onReopen={() => {
                      // The research panel is rendered inside the attach
                      // dropdown, so we have to open both to deep-link into
                      // it from outside the normal "+ → Research" path.
                      setShowAttachDropdown(true);
                      setShowResearchModes(true);
                      setActiveDropdown(null);
                    }}
                  />
                </div>
                <div className={styles.rightActions}>
                  <ModelSelector />
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
                      className={`${styles.submitBtn} ${
                        inputValue.trim() || attachedFiles.length > 0 ? styles.active : ''
                      }`}
                      disabled={!inputValue.trim() && attachedFiles.length === 0}
                      aria-label="Send message"
                    >
                      <SendIcon />
                    </button>
                  )}
                </div>
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
          {hasMessages && (
            <p className={styles.disclaimer}>AI outputs can be wrong. Always verify.</p>
          )}

          {!hasMessages && activeDropdown && currentPromptData && (
            <div className={styles.promptsDropdown} ref={dropdownRef}>
              <div className={styles.promptsTabs}>
                {quickPromptKeys.map((key) => {
                  const tabData = promptsData[key];
                  const TabIcon = tabData.icon;
                  return (
                    <button
                      key={key}
                      className={`${styles.promptsTab} ${
                        activeDropdown === key ? styles.promptsTabActive : ''
                      }`}
                      onClick={() => setActiveDropdown(key)}
                    >
                      <TabIcon />
                      <span>{tabData.title}</span>
                    </button>
                  );
                })}
              </div>
              <div className={styles.promptsList}>
                {currentPromptData.items.map((item, index) => {
                  const ItemIcon = item.icon;
                  return (
                    <button
                      key={index}
                      className={styles.promptItem}
                      onClick={() => handlePromptSelect(activeDropdown, index)}
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

      {!hasMessages && (
        <div className={styles.ambientProviders} aria-hidden="true">
          {AMBIENT_PROVIDERS.map(({ id, label, subLabel, available }) => {
            const Logo = getProviderLogo(id);
            return (
              <div
                key={id}
                className={`${styles.ambientProvider} ${
                  available ? '' : styles.ambientProviderComingSoon
                }`}
              >
                <span className={styles.ambientProviderIcon}>
                  <Logo size={18} />
                </span>
                <span
                  className={`${styles.ambientProviderDot} ${
                    available ? '' : styles.ambientProviderDotMuted
                  }`}
                />
                <span className={styles.ambientProviderText}>
                  <span className={styles.ambientProviderLabel}>{label}</span>
                  <span className={styles.ambientProviderSubLabel}>{subLabel}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
