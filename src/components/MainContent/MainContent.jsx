import { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectInputValue,
  selectMode,
  selectMessages,
  selectIsProcessing,
  selectSelectedModelId,
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
  StopIcon,
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
  const [fullResponseText, setFullResponseText] = useState('');
  const [shouldStream, setShouldStream] = useState(false);

  // Stop-request state: use a generation counter so stale async work is ignored
  const [lastPrompt, setLastPrompt] = useState('');
  const [isManualRequest, setIsManualRequest] = useState(false);
  const requestIdRef = useRef(0);
  const pipelineTimeoutRef = useRef(null); // stores in-flight routing/thinking setTimeout
  const completeTimeoutRef = useRef(null); // stores the onComplete cleanup setTimeout

  const hasMessages = messages.length > 0;

  // Streaming hook
  const {
    streamedText,
    isStreaming,
    stop: stopStreaming,
  } = useStreamingText(fullResponseText, shouldStream, {
    baseDelay: 25,
    variance: 18,
    punctuationPause: 70,
    paragraphPause: 120,
    onComplete: useCallback(() => {
      // Guard: if request was cancelled, do nothing
      const id = requestIdRef.current;

      // Ensure final content is persisted in Redux
      dispatch(updateLastMessage({ content: fullResponseText }));
      setPipelineStatus('complete');
      dispatch(setIsProcessing(false));

      // Brief delay then clear timeline
      completeTimeoutRef.current = setTimeout(() => {
        // Only clean up if no new request has started
        if (requestIdRef.current !== id) return;
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
   * Cancellable delay that stores its timeout in the pipeline ref.
   * Resolves to false if the timeout is cleared externally (via handleStop).
   */
  const pipelineDelay = useCallback(
    (ms) =>
      new Promise((resolve) => {
        pipelineTimeoutRef.current = setTimeout(() => {
          pipelineTimeoutRef.current = null;
          resolve(true);
        }, ms);
      }),
    []
  );

  /**
   * Main submit handler: orchestrates the full ADE pipeline.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const prompt = inputValue.trim();
    if (!prompt || isProcessing) return;

    // Increment request generation — any previous in-flight request is now stale
    const myRequestId = ++requestIdRef.current;

    // Save prompt for stop functionality
    setLastPrompt(prompt);

    // Determine if user manually selected a model
    const manualModelId = selectedModelId;
    const isManual = !!manualModelId;
    setIsManualRequest(isManual);

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

    // 2. Stage 1: Routing — always call ADE (even for manual selection)
    setPipelineStatus('routing');

    let routing;
    const routingStart = Date.now();

    if (isManual) {
      // Manual selection — call ADE with preferModel so we still get alternates
      const model = MODELS.find((m) => m.id === manualModelId);
      try {
        const [adeResult] = await Promise.all([
          routePrompt(prompt, { preferModel: manualModelId }),
          pipelineDelay(300),
        ]);
        routing = {
          modelId: manualModelId,
          modelName: model ? model.name : manualModelId,
          provider: model ? model.provider : 'anthropic',
          score: null,
          reasoning: 'Selected by you',
          alternateModels: (adeResult.alternateModels || []).filter(
            (m) => m.modelId !== manualModelId
          ),
        };
      } catch {
        routing = {
          modelId: manualModelId,
          modelName: model ? model.name : manualModelId,
          provider: model ? model.provider : 'anthropic',
          score: null,
          reasoning: 'Selected by you',
          alternateModels: [],
        };
      }
    } else {
      // Auto mode — route through ADE
      try {
        const [result] = await Promise.all([
          routePrompt(prompt),
          pipelineDelay(600 + Math.random() * 400),
        ]);
        routing = result;
      } catch {
        routing = {
          modelId: 'claude-sonnet-4-5-20250929',
          modelName: 'Claude Sonnet 4.5',
          provider: 'anthropic',
          score: 0.88,
          reasoning: 'Fallback routing',
          alternateModels: [],
        };
      }
    }

    // Bail out if this request was cancelled (stop clicked or new request started)
    if (requestIdRef.current !== myRequestId) return;
    const routingDuration = ((Date.now() - routingStart) / 1000).toFixed(1);

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
    const thinkingStart = Date.now();
    const thinkingTime = isManual
      ? 600 + Math.min(responseText.length * 0.5, 1200) + Math.random() * 400
      : 800 + Math.min(responseText.length * 0.8, 2000) + Math.random() * 600;
    await pipelineDelay(thinkingTime);

    if (requestIdRef.current !== myRequestId) return;
    const thinkingDuration = ((Date.now() - thinkingStart) / 1000).toFixed(1);

    // 4. Stage 3: Writing (streaming)
    setPipelineStatus('writing');

    // Resolve alternate model names from registry
    const resolvedAlternates = (routing.alternateModels || [])
      .filter((alt) => alt.modelId !== routing.modelId)
      .map((alt) => {
        const altModel = MODELS.find((m) => m.id === alt.modelId);
        return {
          ...alt,
          modelName: alt.modelName || (altModel ? altModel.name : alt.modelId),
          provider: alt.provider || (altModel ? altModel.provider : 'unknown'),
        };
      })
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 3);

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
      isManualSelection: isManual,
      alternateModels: resolvedAlternates,
      thinkingData: {
        routingDuration,
        thinkingDuration,
        totalDuration: (parseFloat(routingDuration) + parseFloat(thinkingDuration)).toFixed(1),
      },
    };
    dispatch(addMessage(assistantMsg));

    // Start streaming
    setFullResponseText(responseText);
    setShouldStream(true);
  };

  /**
   * Stop handler: kills all processing immediately and shows the send icon.
   */
  const handleStop = useCallback(() => {
    // Invalidate any in-flight async pipeline work
    requestIdRef.current++;

    // Clear every pending timeout (routing/thinking delays + onComplete cleanup)
    if (pipelineTimeoutRef.current) {
      clearTimeout(pipelineTimeoutRef.current);
      pipelineTimeoutRef.current = null;
    }
    if (completeTimeoutRef.current) {
      clearTimeout(completeTimeoutRef.current);
      completeTimeoutRef.current = null;
    }

    // Kill streaming (also nulls out onComplete so it can never fire)
    stopStreaming();

    // Reset all state so nothing can restart
    setShouldStream(false);
    setFullResponseText('');
    setPipelineStatus('idle');
    setRouteResult(null);
    setIsManualRequest(false);
    dispatch(setIsProcessing(false));
  }, [dispatch, stopStreaming]);

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
    // Kill any in-flight request
    requestIdRef.current++;
    if (pipelineTimeoutRef.current) {
      clearTimeout(pipelineTimeoutRef.current);
      pipelineTimeoutRef.current = null;
    }
    if (completeTimeoutRef.current) {
      clearTimeout(completeTimeoutRef.current);
      completeTimeoutRef.current = null;
    }
    stopStreaming();

    dispatch(createNewChat());
    dispatch(setInputValue(''));
    setActiveDropdown(null);
    setPipelineStatus('idle');
    setShouldStream(false);
    setFullResponseText('');
    setRouteResult(null);
    setLastPrompt('');
    setIsManualRequest(false);
  };

  /**
   * Retry handler: removes last assistant message and re-runs the pipeline.
   */
  const handleRetry = useCallback(
    async (userPrompt) => {
      if (isProcessing) return;

      // Remove the last assistant message
      dispatch(removeLastAssistantMessage());

      // New generation for this retry
      const myRequestId = ++requestIdRef.current;

      // Reset pipeline state
      setPipelineStatus('idle');
      setShouldStream(false);
      setFullResponseText('');
      setRouteResult(null);

      const manualModelId = selectedModelId;
      const isManual = !!manualModelId;
      setIsManualRequest(isManual);
      setLastPrompt(userPrompt);

      // Small delay for visual feedback before restarting
      await new Promise((resolve) => setTimeout(resolve, 150));
      if (requestIdRef.current !== myRequestId) return;

      // Re-run the pipeline
      dispatch(setIsProcessing(true));
      setPipelineStatus('routing');

      let routing;
      const retryRoutingStart = Date.now();

      if (isManual) {
        const model = MODELS.find((m) => m.id === manualModelId);
        try {
          const [adeResult] = await Promise.all([
            routePrompt(userPrompt, { preferModel: manualModelId }),
            pipelineDelay(300),
          ]);
          routing = {
            modelId: manualModelId,
            modelName: model ? model.name : manualModelId,
            provider: model ? model.provider : 'anthropic',
            score: null,
            reasoning: 'Selected by you',
            alternateModels: (adeResult.alternateModels || []).filter(
              (m) => m.modelId !== manualModelId
            ),
          };
        } catch {
          routing = {
            modelId: manualModelId,
            modelName: model ? model.name : manualModelId,
            provider: model ? model.provider : 'anthropic',
            score: null,
            reasoning: 'Selected by you',
            alternateModels: [],
          };
        }
      } else {
        try {
          const [result] = await Promise.all([
            routePrompt(userPrompt),
            pipelineDelay(600 + Math.random() * 400),
          ]);
          routing = result;
        } catch {
          routing = {
            modelId: 'claude-sonnet-4-5-20250929',
            modelName: 'Claude Sonnet 4.5',
            provider: 'anthropic',
            score: 0.88,
            reasoning: 'Fallback routing',
            alternateModels: [],
          };
        }
      }

      if (requestIdRef.current !== myRequestId) return;
      const retryRoutingDuration = ((Date.now() - retryRoutingStart) / 1000).toFixed(1);

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

      const retryThinkingStart = Date.now();
      const thinkingTime = isManual
        ? 600 + Math.min(responseText.length * 0.5, 1200) + Math.random() * 400
        : 800 + Math.min(responseText.length * 0.8, 2000) + Math.random() * 600;
      await pipelineDelay(thinkingTime);

      if (requestIdRef.current !== myRequestId) return;
      const retryThinkingDuration = ((Date.now() - retryThinkingStart) / 1000).toFixed(1);

      setPipelineStatus('writing');

      // Resolve alternate model names from registry
      const resolvedAlternates = (routing.alternateModels || [])
        .filter((alt) => alt.modelId !== routing.modelId)
        .map((alt) => {
          const altModel = MODELS.find((m) => m.id === alt.modelId);
          return {
            ...alt,
            modelName: alt.modelName || (altModel ? altModel.name : alt.modelId),
            provider: alt.provider || (altModel ? altModel.provider : 'unknown'),
          };
        })
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 3);

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
        isManualSelection: isManual,
        alternateModels: resolvedAlternates,
        thinkingData: {
          routingDuration: retryRoutingDuration,
          thinkingDuration: retryThinkingDuration,
          totalDuration: (
            parseFloat(retryRoutingDuration) + parseFloat(retryThinkingDuration)
          ).toFixed(1),
        },
      };
      dispatch(addMessage(assistantMsg));

      setFullResponseText(responseText);
      setShouldStream(true);
    },
    [dispatch, isProcessing, selectedModelId, pipelineDelay]
  );

  /**
   * Alternate model request handler: runs a new pipeline with a specific alternate model
   * for the given user prompt. Adds a NEW followup response (does not replace the previous one)
   * so the user can compare responses from different models side by side.
   */
  const handleAlternateModelRequest = useCallback(
    async (userPrompt, alternateModel) => {
      if (isProcessing) return;

      const myRequestId = ++requestIdRef.current;

      // Reset pipeline state (but do NOT remove the previous assistant message)
      setPipelineStatus('idle');
      setShouldStream(false);
      setFullResponseText('');
      setRouteResult(null);
      setIsManualRequest(true);
      setLastPrompt(userPrompt);

      await new Promise((resolve) => setTimeout(resolve, 150));
      if (requestIdRef.current !== myRequestId) return;

      dispatch(setIsProcessing(true));
      setPipelineStatus('routing');

      const altModelData = MODELS.find((m) => m.id === alternateModel.modelId);
      const altModelName =
        alternateModel.modelName || (altModelData ? altModelData.name : alternateModel.modelId);
      const altProvider =
        alternateModel.provider || (altModelData ? altModelData.provider : 'anthropic');

      // Skip ADE — the user already chose this model explicitly, no routing needed
      const altRoutingStart = Date.now();
      await pipelineDelay(300);

      if (requestIdRef.current !== myRequestId) return;
      const altRoutingDuration = ((Date.now() - altRoutingStart) / 1000).toFixed(1);

      setRouteResult({
        modelId: alternateModel.modelId,
        modelName: altModelName,
        provider: altProvider,
        score: alternateModel.score,
        reasoning: alternateModel.reasoning || 'Selected as alternate model',
      });

      setPipelineStatus('thinking');

      const responseText = generateMockResponse(
        userPrompt,
        altProvider,
        altModelName,
        alternateModel.score
      );

      const altThinkingStart = Date.now();
      const thinkingTime = 600 + Math.min(responseText.length * 0.5, 1200) + Math.random() * 400;
      await pipelineDelay(thinkingTime);

      if (requestIdRef.current !== myRequestId) return;
      const altThinkingDuration = ((Date.now() - altThinkingStart) / 1000).toFixed(1);

      setPipelineStatus('writing');

      const assistantMsg = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        modelId: alternateModel.modelId,
        modelName: altModelName,
        provider: altProvider,
        score: alternateModel.score,
        reasoning: alternateModel.reasoning || 'Selected as alternate model',
        isManualSelection: true,
        alternateModels: [],
        thinkingData: {
          routingDuration: altRoutingDuration,
          thinkingDuration: altThinkingDuration,
          totalDuration: (parseFloat(altRoutingDuration) + parseFloat(altThinkingDuration)).toFixed(
            1
          ),
        },
      };
      dispatch(addMessage(assistantMsg));

      setFullResponseText(responseText);
      setShouldStream(true);
    },
    [dispatch, isProcessing, pipelineDelay]
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
