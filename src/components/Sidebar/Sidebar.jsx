import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  selectSidebarCollapsed,
  toggleSidebar,
  setCollapsed,
  selectActiveItem,
  setActiveItem,
} from '../../store/slices/sidebarSlice';
import {
  createNewChat,
  setCurrentChat,
  setMessages,
  selectConversations,
  selectConversationsTotal,
  selectConversationsLoading,
  setConversations,
  appendConversations,
  setConversationsLoading,
  selectCurrentChatId,
} from '../../store/slices/chatSlice';
import { selectTheme, setTheme } from '../../store/slices/themeSlice';
import {
  fetchConversations,
  fetchConversationMessages,
  updateConversation,
  deleteConversation,
  fetchProjects as fetchProjectsApi,
} from '../../services/api';
import { useToast } from '../Toast/Toast';
import { selectProjects, setProjects } from '../../store/slices/projectsSlice';
import { getGeneratedImages } from '../../services/imageGeneration';
import {
  PlusIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChatIcon,
  UserIcon,
  SunIcon,
  MoonIcon,
  MonitorIcon,
  MenuIcon,
  CloseIcon,
  ModelsIcon,
  ImageGalleryIcon,
  ConversationsIcon,
  ProjectsIcon,
  MoreVerticalIcon,
  ShareIcon,
  EditIcon,
  ArchiveIcon,
  TrashIcon,
  LinkIcon,
  SettingsIcon,
  HelpCircleIcon,
  LogOutIcon,
  UpgradePlanIcon,
} from '../Icons';
import ProjectPickerModal from '../ProjectPickerModal';
import styles from './Sidebar.module.css';

function groupConversationsByTime(conversations) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOf7Days = new Date(startOfToday);
  startOf7Days.setDate(startOf7Days.getDate() - 7);
  const startOf30Days = new Date(startOfToday);
  startOf30Days.setDate(startOf30Days.getDate() - 30);

  const groups = [];
  const buckets = {
    Today: [],
    Yesterday: [],
    'Previous 7 Days': [],
    'Previous 30 Days': [],
    Older: [],
  };

  for (const chat of conversations) {
    const d = new Date(chat.updatedAt || chat.createdAt);
    if (d >= startOfToday) buckets.Today.push(chat);
    else if (d >= startOfYesterday) buckets.Yesterday.push(chat);
    else if (d >= startOf7Days) buckets['Previous 7 Days'].push(chat);
    else if (d >= startOf30Days) buckets['Previous 30 Days'].push(chat);
    else buckets.Older.push(chat);
  }

  for (const [label, items] of Object.entries(buckets)) {
    if (items.length > 0) groups.push({ label, items });
  }
  return groups;
}

function useDropdownPosition(menuOpenId) {
  const [dropdownStyle, setDropdownStyle] = useState({});
  const menuBtnRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpenId || !menuBtnRef.current) return;
    const btn = menuBtnRef.current;
    const rect = btn.getBoundingClientRect();
    const menuHeight = 220;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceBelow < menuHeight + 8 && spaceAbove > spaceBelow;

    // Use fixed positioning so the dropdown escapes overflow-y: auto containers
    const newStyle = {
      position: 'fixed',
      zIndex: 9000,
    };

    if (openUpward) {
      newStyle.bottom = `${window.innerHeight - rect.top + 4}px`;
      newStyle.top = 'auto';
    } else {
      newStyle.top = `${rect.bottom + 4}px`;
      newStyle.bottom = 'auto';
    }

    // Align to the right edge of the button
    newStyle.right = `${window.innerWidth - rect.right}px`;
    newStyle.left = 'auto';

    setDropdownStyle(newStyle);
  }, [menuOpenId]);

  return { dropdownStyle, menuBtnRef, menuRef };
}

export default function Sidebar() {
  const dispatch = useDispatch();
  const { showError, showSuccess } = useToast();
  const collapsed = useSelector(selectSidebarCollapsed);
  const conversations = useSelector(selectConversations);
  const conversationsTotal = useSelector(selectConversationsTotal);
  const conversationsLoading = useSelector(selectConversationsLoading);
  const currentChatId = useSelector(selectCurrentChatId);
  const themeMode = useSelector(selectTheme);
  const activeItem = useSelector(selectActiveItem);
  const projects = useSelector(selectProjects);
  const [isMobile, setIsMobile] = useState(false);
  const [projectPickerFor, setProjectPickerFor] = useState(null); // chatId to assign to project
  const [recentsExpanded, setRecentsExpanded] = useState(true);
  const [sidebarView, setSidebarView] = useState('recents'); // 'recents' | 'archived'
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [shareLinkConfirm, setShareLinkConfirm] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const renameInputRef = useRef(null);

  const { dropdownStyle, menuBtnRef, menuRef } = useDropdownPosition(menuOpenId);

  const filteredConversations = useMemo(
    () =>
      sidebarView === 'archived'
        ? conversations.filter((c) => c.isArchived)
        : conversations.filter((c) => !c.isArchived),
    [conversations, sidebarView]
  );

  const groupedConversations = useMemo(
    () => groupConversationsByTime(filteredConversations),
    [filteredConversations]
  );

  // Load conversations on mount
  const loadConversations = useCallback(
    async (offset = 0) => {
      dispatch(setConversationsLoading(true));
      try {
        const data = await fetchConversations(15, offset);
        if (offset === 0) {
          dispatch(setConversations(data));
        } else {
          dispatch(appendConversations(data));
        }
      } catch {
        showError("Couldn't load your conversations. Check your connection.", {
          onRetry: () => loadConversations(offset),
        });
      } finally {
        dispatch(setConversationsLoading(false));
      }
    },
    [dispatch, showError]
  );

  useEffect(() => {
    loadConversations(0);
  }, [loadConversations]);

  // Ensure projects are loaded for project picker
  useEffect(() => {
    if (projects.length === 0) {
      fetchProjectsApi()
        .then((data) => dispatch(setProjects(data.projects || [])))
        .catch(() => showError("Couldn't load projects."));
    }
  }, [projects.length, dispatch, showError]);

  // Refresh conversations when currentChatId changes (new conversation created)
  useEffect(() => {
    if (currentChatId) {
      loadConversations(0);
    }
  }, [currentChatId, loadConversations]);

  // Listen for conversation-updated events from chat stream (covers creation + title updates)
  useEffect(() => {
    const handleConversationUpdated = () => loadConversations(0);
    window.addEventListener('araviel-conversation-updated', handleConversationUpdated);
    return () =>
      window.removeEventListener('araviel-conversation-updated', handleConversationUpdated);
  }, [loadConversations]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const showFullContent = isMobile || !collapsed;

  const handleNewChat = () => {
    dispatch(createNewChat());
    dispatch(setActiveItem('home'));
    if (isMobile) {
      dispatch(setCollapsed(true));
    }
  };

  const handleChatClick = async (chatId) => {
    dispatch(setCurrentChat(chatId));
    dispatch(setActiveItem('home'));
    if (isMobile) {
      dispatch(setCollapsed(true));
    }
    // Load messages for this conversation
    try {
      const data = await fetchConversationMessages(chatId);
      // Get locally stored generated images to re-attach to messages
      const storedImages = getGeneratedImages();
      // Map backend messages to the shape the frontend expects
      const mappedMessages = (data.messages || []).map((msg) => {
        const base = {
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.createdAt).getTime(),
        };
        if (msg.role === 'assistant') {
          // Restore generatedImages from backend or localStorage
          let generatedImages = msg.generatedImages || [];
          if (generatedImages.length === 0) {
            // Primary: match by messageId (deterministic)
            let matched = storedImages.filter((img) => img.messageId && img.messageId === msg.id);
            // Fallback: timestamp proximity
            if (matched.length === 0) {
              const msgTime = new Date(msg.createdAt).getTime();
              matched = storedImages.filter((img) => Math.abs(img.createdAt - msgTime) < 30000);
            }
            if (matched.length > 0) {
              generatedImages = matched.map((img) => ({
                url: img.url,
                prompt: img.prompt,
                model: img.model,
                provider: img.provider,
                id: img.id,
              }));
            }
          }
          // Last resort: extract images from message content markdown
          if (generatedImages.length === 0 && msg.content) {
            const imgRe = /!\[Generated image[^\]]*\]\(([^)]+)\)/g;
            let m;
            while ((m = imgRe.exec(msg.content)) !== null) {
              generatedImages.push({
                url: m[1],
                prompt: msg.content.match(/!\[Generated image:?\s*([^\]]*)\]/)?.[1] || '',
                model: msg.model?.name || 'unknown',
                provider: msg.model?.provider || 'unknown',
                id: `content-${msg.id}-${generatedImages.length}`,
              });
            }
          }
          Object.assign(base, {
            modelId: msg.model?.id,
            modelName: msg.model?.name,
            provider: msg.model?.provider,
            score: msg.model?.score,
            reasoning: msg.model?.reasoning,
            alternateModels: (msg.alternateModels || []).map((m) => ({
              modelId: m.id,
              modelName: m.name,
              provider: m.provider,
              score: m.score,
              reasoning: m.reasoning,
            })),
            thinkingContent: msg.thinkingContent,
            citations: msg.citations,
            usage: msg.usage,
            costUsd: msg.costUsd,
            latencyMs: msg.latencyMs,
            adeLatencyMs: msg.adeLatencyMs,
            ...(generatedImages.length > 0 && { generatedImages }),
          });
        }
        return base;
      });
      dispatch(setMessages(mappedMessages));
    } catch {
      // Fail silently — conversation will appear empty
    }
  };

  const handleLoadMore = () => {
    if (!conversationsLoading && conversations.length < conversationsTotal) {
      loadConversations(conversations.length);
    }
  };

  const handleConversationsClick = () => {
    dispatch(setActiveItem(activeItem === 'conversations' ? 'home' : 'conversations'));
    if (isMobile) {
      dispatch(setCollapsed(true));
    }
  };

  const handleProjectsClick = () => {
    dispatch(setActiveItem(activeItem === 'projects' ? 'home' : 'projects'));
    if (isMobile) {
      dispatch(setCollapsed(true));
    }
  };

  const handleModelsClick = () => {
    dispatch(setActiveItem(activeItem === 'models' ? 'home' : 'models'));
    if (isMobile) {
      dispatch(setCollapsed(true));
    }
  };

  const handleGalleryClick = () => {
    dispatch(setActiveItem(activeItem === 'gallery' ? 'home' : 'gallery'));
    if (isMobile) {
      dispatch(setCollapsed(true));
    }
  };

  const handleThemeChange = (mode) => {
    dispatch(setTheme(mode));
  };

  const handleOverlayClick = () => {
    dispatch(setCollapsed(true));
  };

  const handleCloseSidebar = () => {
    dispatch(setCollapsed(true));
  };

  const toggleRecents = () => {
    setRecentsExpanded(!recentsExpanded);
  };

  // Close menu on outside click or Escape
  useEffect(() => {
    if (!menuOpenId) return;
    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        menuBtnRef.current &&
        !menuBtnRef.current.contains(e.target)
      ) {
        setMenuOpenId(null);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setMenuOpenId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpenId, menuBtnRef, menuRef]);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [userMenuOpen]);

  // Focus rename input when renaming starts
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const closeMenu = () => {
    setMenuOpenId(null);
  };

  const handleMenuToggle = (e, chatId) => {
    e.stopPropagation();
    setMenuOpenId((prev) => (prev === chatId ? null : chatId));
  };

  const handleRename = (chat) => {
    closeMenu();
    setRenamingId(chat.id);
    setRenameValue(chat.title || '');
  };

  const handleRenameSubmit = (chatId) => {
    const trimmed = renameValue.trim();
    if (trimmed) {
      dispatch(
        setConversations({
          conversations: conversations.map((c) => (c.id === chatId ? { ...c, title: trimmed } : c)),
          total: conversationsTotal,
        })
      );
      // Persist to backend
      updateConversation(chatId, { title: trimmed }).catch(() => {
        // Revert optimistic update
        dispatch(
          setConversations({
            conversations: conversations.map((c) =>
              c.id === chatId ? { ...c, title: c.title } : c
            ),
            total: conversationsTotal,
          })
        );
        showError("Couldn't rename this conversation. Try again.");
      });
    }
    setRenamingId(null);
    setRenameValue('');
  };

  const handleRenameKeyDown = (e, chatId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRenameSubmit(chatId);
    } else if (e.key === 'Escape') {
      setRenamingId(null);
      setRenameValue('');
    }
  };

  const handleShareLink = (chatId) => {
    closeMenu();
    setShareLinkConfirm(chatId);
  };

  const confirmShareLink = () => {
    const url = `${window.location.origin}/chat/${shareLinkConfirm}`;
    navigator.clipboard?.writeText(url);
    setLinkCopied(true);
    setTimeout(() => {
      setShareLinkConfirm(null);
      setLinkCopied(false);
    }, 1500);
  };

  const handleArchive = (chatId) => {
    closeMenu();
    const conv = conversations.find((c) => c.id === chatId);
    const newValue = !conv?.isArchived;
    // Optimistic update
    dispatch(
      setConversations({
        conversations: conversations.map((c) =>
          c.id === chatId ? { ...c, isArchived: newValue } : c
        ),
        total: conversationsTotal,
      })
    );
    updateConversation(chatId, { is_archived: newValue }).catch(() => {
      // Revert
      dispatch(
        setConversations({
          conversations: conversations.map((c) =>
            c.id === chatId ? { ...c, isArchived: !newValue } : c
          ),
          total: conversationsTotal,
        })
      );
      showError("Couldn't archive this conversation. Try again.");
    });
  };

  const handleDeleteRequest = (chatId) => {
    closeMenu();
    setDeleteConfirm(chatId);
  };

  const confirmDelete = () => {
    const chatId = deleteConfirm;
    const prevConversations = conversations;
    const prevTotal = conversationsTotal;
    // Optimistic update
    dispatch(
      setConversations({
        conversations: conversations.filter((c) => c.id !== chatId),
        total: Math.max(0, conversationsTotal - 1),
      })
    );
    // If the deleted chat is currently open, clear it
    if (currentChatId === chatId) {
      dispatch(createNewChat());
    }
    // Persist to backend
    deleteConversation(chatId).catch(() => {
      // Revert
      dispatch(setConversations({ conversations: prevConversations, total: prevTotal }));
      showError("Couldn't delete this conversation. Try again.");
    });
    setDeleteConfirm(null);
  };

  const handleAddToProject = (chatId) => {
    closeMenu();
    setProjectPickerFor(chatId);
  };

  const handleAssignProject = async (projectId) => {
    if (!projectPickerFor) return;
    const chatId = projectPickerFor;
    const prevProjectId = conversations.find((c) => c.id === chatId)?.projectId;
    // Optimistic update
    dispatch(
      setConversations({
        conversations: conversations.map((c) => (c.id === chatId ? { ...c, projectId } : c)),
        total: conversationsTotal,
      })
    );
    setProjectPickerFor(null);
    try {
      await updateConversation(chatId, { project_id: projectId });
      showSuccess('Conversation added to project.');
    } catch {
      // Revert
      dispatch(
        setConversations({
          conversations: conversations.map((c) =>
            c.id === chatId ? { ...c, projectId: prevProjectId } : c
          ),
          total: conversationsTotal,
        })
      );
      showError("Couldn't move this conversation to the project.");
    }
  };

  const handleRemoveFromProject = async (chatId) => {
    closeMenu();
    const prevProjectId = conversations.find((c) => c.id === chatId)?.projectId;
    // Optimistic update
    dispatch(
      setConversations({
        conversations: conversations.map((c) => (c.id === chatId ? { ...c, projectId: null } : c)),
        total: conversationsTotal,
      })
    );
    try {
      await updateConversation(chatId, { project_id: null });
    } catch {
      // Revert
      dispatch(
        setConversations({
          conversations: conversations.map((c) =>
            c.id === chatId ? { ...c, projectId: prevProjectId } : c
          ),
          total: conversationsTotal,
        })
      );
      showError("Couldn't remove conversation from project.");
    }
  };

  return (
    <>
      <button
        className={styles.mobileMenuBtn}
        onClick={() => dispatch(toggleSidebar())}
        aria-label="Open menu"
        style={{ display: isMobile && collapsed ? 'flex' : 'none' }}
      >
        <MenuIcon />
      </button>

      <div
        className={`${styles.overlay} ${!collapsed ? styles.overlayVisible : ''}`}
        onClick={handleOverlayClick}
      />

      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
        <button
          className={styles.collapseBtn}
          onClick={() => dispatch(toggleSidebar())}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeftIcon />
        </button>

        <div className={styles.header}>
          <div className={styles.logo}>
            {showFullContent ? (
              <>
                <div className={styles.logoIcon}>A</div>
                <span className={styles.logoText}>Araviel</span>
              </>
            ) : (
              <button
                className={styles.logoExpandBtn}
                onClick={() => dispatch(toggleSidebar())}
                aria-label="Expand sidebar"
              >
                <ChevronLeftIcon />
              </button>
            )}
          </div>
          {isMobile && (
            <button
              className={styles.mobileCloseBtn}
              onClick={handleCloseSidebar}
              aria-label="Close menu"
            >
              <CloseIcon />
            </button>
          )}
        </div>

        <button className={styles.newChatBtn} onClick={handleNewChat} title="New chat">
          <PlusIcon />
          {showFullContent && <span>New chat</span>}
        </button>

        <nav className={styles.nav}>
          <button
            className={`${styles.navItem} ${activeItem === 'conversations' ? styles.active : ''}`}
            onClick={handleConversationsClick}
            title="Conversations"
            aria-label="Conversations"
          >
            <ConversationsIcon />
            {showFullContent && <span>Conversations</span>}
          </button>
          <button
            className={`${styles.navItem} ${activeItem === 'projects' ? styles.active : ''}`}
            onClick={handleProjectsClick}
            title="Projects"
            aria-label="Projects"
          >
            <ProjectsIcon />
            {showFullContent && <span>Projects</span>}
          </button>
          <button
            className={`${styles.navItem} ${activeItem === 'gallery' ? styles.active : ''}`}
            onClick={handleGalleryClick}
            title="Image Gallery"
            aria-label="Image Gallery"
          >
            <ImageGalleryIcon />
            {showFullContent && <span>Images</span>}
          </button>
          <button
            className={`${styles.navItem} ${activeItem === 'models' ? styles.active : ''}`}
            onClick={handleModelsClick}
            title="Models"
            aria-label="Models"
          >
            <ModelsIcon />
            {showFullContent && <span>Models</span>}
          </button>
        </nav>

        {showFullContent && <div className={styles.navDivider} />}

        {showFullContent && (
          <div className={styles.recents}>
            <div className={styles.recentsHeaderRow}>
              <div className={styles.recentsToggle}>
                <button
                  className={`${styles.recentsToggleBtn} ${
                    sidebarView === 'recents' ? styles.recentsToggleBtnActive : ''
                  }`}
                  onClick={() => setSidebarView('recents')}
                >
                  Recents
                </button>
                <button
                  className={`${styles.recentsToggleBtn} ${
                    sidebarView === 'archived' ? styles.recentsToggleBtnActive : ''
                  }`}
                  onClick={() => setSidebarView('archived')}
                >
                  Archived
                </button>
              </div>
              <button
                className={styles.recentsCollapseBtn}
                onClick={toggleRecents}
                aria-expanded={recentsExpanded}
              >
                <span
                  className={`${styles.recentsChevron} ${recentsExpanded ? styles.expanded : ''}`}
                >
                  <ChevronDownIcon />
                </span>
              </button>
            </div>
            <div
              className={`${styles.recentsContent} ${recentsExpanded ? styles.recentsOpen : ''}`}
            >
              {conversationsLoading && conversations.length === 0 ? (
                <div className={styles.recentsSkeleton}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={styles.skeletonItem} />
                  ))}
                </div>
              ) : groupedConversations.length > 0 ? (
                <>
                  {groupedConversations.map((group) => (
                    <div key={group.label} className={styles.timeGroup}>
                      <div className={styles.timeGroupLabel}>{group.label}</div>
                      <ul className={styles.recentsList}>
                        {group.items.map((chat) => (
                          <li key={chat.id} className={styles.recentItemWrapper}>
                            {renamingId === chat.id ? (
                              <div className={styles.renameWrapper}>
                                <input
                                  ref={renameInputRef}
                                  className={styles.renameInput}
                                  value={renameValue}
                                  onChange={(e) => setRenameValue(e.target.value)}
                                  onKeyDown={(e) => handleRenameKeyDown(e, chat.id)}
                                  onBlur={() => handleRenameSubmit(chat.id)}
                                />
                              </div>
                            ) : (
                              <button
                                className={`${styles.recentItem} ${
                                  currentChatId === chat.id ? styles.recentItemActive : ''
                                }`}
                                onClick={() => handleChatClick(chat.id)}
                              >
                                {chat.isReported && (
                                  <span className={styles.reportedDot} title="Reported" />
                                )}
                                <span>{chat.title}</span>
                              </button>
                            )}
                            <button
                              ref={menuOpenId === chat.id ? menuBtnRef : null}
                              className={`${styles.recentItemMenu} ${
                                menuOpenId === chat.id ? styles.recentItemMenuVisible : ''
                              }`}
                              onClick={(e) => handleMenuToggle(e, chat.id)}
                              aria-label="Chat options"
                            >
                              <MoreVerticalIcon />
                            </button>
                            {menuOpenId === chat.id && (
                              <div
                                ref={menuRef}
                                className={styles.chatDropdown}
                                style={dropdownStyle}
                              >
                                <button
                                  className={styles.chatDropdownItem}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleShareLink(chat.id);
                                  }}
                                >
                                  <ShareIcon />
                                  <span>Share</span>
                                </button>
                                <button
                                  className={styles.chatDropdownItem}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRename(chat);
                                  }}
                                >
                                  <EditIcon />
                                  <span>Rename</span>
                                </button>
                                <button
                                  className={styles.chatDropdownItem}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleArchive(chat.id);
                                  }}
                                >
                                  <ArchiveIcon />
                                  <span>{chat.isArchived ? 'Move to Chats' : 'Archive'}</span>
                                </button>
                                {chat.projectId ? (
                                  <button
                                    className={styles.chatDropdownItem}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveFromProject(chat.id);
                                    }}
                                  >
                                    <ProjectsIcon />
                                    <span>Remove from project</span>
                                  </button>
                                ) : (
                                  <button
                                    className={styles.chatDropdownItem}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddToProject(chat.id);
                                    }}
                                  >
                                    <ProjectsIcon />
                                    <span>Add to project</span>
                                  </button>
                                )}
                                <div className={styles.chatDropdownDivider} />
                                <button
                                  className={`${styles.chatDropdownItem} ${styles.chatDropdownItemDanger}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteRequest(chat.id);
                                  }}
                                >
                                  <TrashIcon />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {conversations.length < conversationsTotal &&
                    filteredConversations.length > 1 && (
                      <button
                        className={styles.loadMoreBtn}
                        onClick={handleLoadMore}
                        disabled={conversationsLoading}
                      >
                        {conversationsLoading ? 'Loading...' : 'Load more'}
                      </button>
                    )}
                </>
              ) : (
                <p className={styles.recentsEmpty}>
                  {sidebarView === 'archived' ? 'No archived chats' : 'No recent chats'}
                </p>
              )}
            </div>
          </div>
        )}

        {!showFullContent && (
          <div className={styles.recentsCollapsed}>
            <div className={styles.recentsCollapsedIcon} title="Recents">
              <ChatIcon />
            </div>
          </div>
        )}

        <div className={styles.footer}>
          <div className={styles.userMenuWrapper} ref={userMenuRef}>
            <button
              className={`${styles.userSection} ${userMenuOpen ? styles.userSectionOpen : ''}`}
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div className={styles.userAvatar}>
                <UserIcon />
              </div>
              {showFullContent && (
                <>
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>User</span>
                    <span className={styles.userPlan}>Pro plan</span>
                  </div>
                  <span
                    className={`${styles.userChevron} ${
                      userMenuOpen ? styles.userChevronOpen : ''
                    }`}
                  >
                    <ChevronUpIcon />
                  </span>
                </>
              )}
            </button>

            {userMenuOpen && (
              <div
                className={`${styles.userDropdown} ${
                  !showFullContent ? styles.userDropdownCollapsed : ''
                }`}
              >
                <button
                  className={styles.userDropdownItem}
                  onClick={() => {
                    setUserMenuOpen(false);
                    dispatch(setActiveItem('settings'));
                  }}
                >
                  <SettingsIcon />
                  <span>Settings</span>
                </button>
                <button className={styles.userDropdownItem} onClick={() => setUserMenuOpen(false)}>
                  <UpgradePlanIcon />
                  <span>Upgrade plan</span>
                </button>
                <button className={styles.userDropdownItem} onClick={() => setUserMenuOpen(false)}>
                  <HelpCircleIcon />
                  <span>Help</span>
                </button>
                <div className={styles.userDropdownDivider} />
                <button className={styles.userDropdownItem} onClick={() => setUserMenuOpen(false)}>
                  <LogOutIcon />
                  <span>Login / Signup</span>
                </button>
              </div>
            )}
          </div>
          <div className={styles.themeToggle}>
            <button
              className={`${styles.themeBtn} ${themeMode === 'system' ? styles.activeTheme : ''}`}
              onClick={() => handleThemeChange('system')}
              title="System theme"
            >
              <MonitorIcon />
            </button>
            <button
              className={`${styles.themeBtn} ${themeMode === 'light' ? styles.activeTheme : ''}`}
              onClick={() => handleThemeChange('light')}
              title="Light theme"
            >
              <SunIcon />
            </button>
            <button
              className={`${styles.themeBtn} ${themeMode === 'dark' ? styles.activeTheme : ''}`}
              onClick={() => handleThemeChange('dark')}
              title="Dark theme"
            >
              <MoonIcon />
            </button>
          </div>
        </div>
      </aside>

      {/* Share Link confirmation dialog */}
      {shareLinkConfirm && (
        <div className={styles.confirmOverlay} onClick={() => setShareLinkConfirm(null)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmIconShare}>
              <LinkIcon />
            </div>
            <h3 className={styles.confirmTitle}>Share this conversation?</h3>
            <p className={styles.confirmDesc}>
              A shareable link will be copied to your clipboard. Anyone with this link will be able
              to view the conversation.
            </p>
            <div className={styles.confirmActions}>
              <button className={styles.confirmCancelBtn} onClick={() => setShareLinkConfirm(null)}>
                Cancel
              </button>
              <button className={styles.confirmShareBtn} onClick={confirmShareLink}>
                {linkCopied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div className={styles.confirmOverlay} onClick={() => setDeleteConfirm(null)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmIconDanger}>
              <TrashIcon />
            </div>
            <h3 className={styles.confirmTitle}>Delete this chat?</h3>
            <p className={styles.confirmDesc}>
              This action is permanent and cannot be undone. All messages in this conversation will
              be lost.
            </p>
            <div className={styles.confirmActions}>
              <button className={styles.confirmCancelBtn} onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button className={styles.confirmDeleteBtn} onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project picker dialog */}
      {projectPickerFor && (
        <ProjectPickerModal
          onSelect={handleAssignProject}
          onClose={() => setProjectPickerFor(null)}
          onError={showError}
        />
      )}
    </>
  );
}
