import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  selectSidebarCollapsed,
  toggleSidebar,
  setCollapsed,
} from '../../store/slices/sidebarSlice';
import {
  createNewChat,
  selectConversations,
  selectConversationsTotal,
  selectConversationsLoading,
  setConversations,
  appendConversations,
  setConversationsLoading,
  selectCurrentChatId,
} from '../../store/slices/chatSlice';
import { selectTheme, setTheme } from '../../store/slices/themeSlice';
import { selectAuthUser, selectIsAuthenticated, signOut } from '../../store/slices/authSlice';
import {
  fetchConversations,
  updateConversation,
  deleteConversation,
  fetchProjects as fetchProjectsApi,
} from '../../services/api';
import { useToast } from '../Toast/Toast';
import { selectProjects, setProjects } from '../../store/slices/projectsSlice';
import { selectCurrentTier } from '../../store/slices/subscriptionSlice';
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
  ZapIcon,
  HelpCircleIcon,
  LogOutIcon,
  UpgradePlanIcon,
  CreditCardIcon,
  SearchIcon,
} from '../Icons';
import ProjectPickerModal from '../ProjectPickerModal';
import SearchModal from '../SearchModal/SearchModal';
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

  useLayoutEffect(() => {
    if (!menuOpenId || !menuBtnRef.current) return;
    const btn = menuBtnRef.current;
    const rect = btn.getBoundingClientRect();
    const menuHeight = 220;
    const menuWidth = 180;
    const pad = 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceBelow < menuHeight + pad && spaceAbove > spaceBelow;

    const newStyle = {
      position: 'fixed',
      zIndex: 9000,
    };

    // Vertical positioning with viewport clamping
    if (openUpward) {
      const bottom = window.innerHeight - rect.top + 4;
      newStyle.bottom = `${Math.max(pad, bottom)}px`;
      newStyle.top = 'auto';
    } else {
      const top = rect.bottom + 4;
      newStyle.top = `${Math.min(top, window.innerHeight - menuHeight - pad)}px`;
      newStyle.bottom = 'auto';
    }

    // Horizontal: align to right edge of button, but clamp so menu stays in viewport
    let left = rect.right - menuWidth;
    // Ensure menu doesn't go off the left edge
    if (left < pad) {
      left = pad;
    }
    // Ensure menu doesn't go off the right edge
    if (left + menuWidth > window.innerWidth - pad) {
      left = window.innerWidth - menuWidth - pad;
    }
    newStyle.left = `${left}px`;
    newStyle.right = 'auto';

    setDropdownStyle(newStyle);
  }, [menuOpenId]);

  return { dropdownStyle, menuBtnRef, menuRef };
}

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { showError, showSuccess } = useToast();
  const collapsed = useSelector(selectSidebarCollapsed);
  const conversations = useSelector(selectConversations);
  const conversationsTotal = useSelector(selectConversationsTotal);
  const conversationsLoading = useSelector(selectConversationsLoading);
  const currentChatId = useSelector(selectCurrentChatId);
  const themeMode = useSelector(selectTheme);
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
  const userTier = useSelector(selectCurrentTier);
  const [searchOpen, setSearchOpen] = useState(false);
  const userMenuRef = useRef(null);
  const renameInputRef = useRef(null);

  const authUser = useSelector(selectAuthUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // userTier is now read from Redux selectCurrentTier

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

  // Only fetch conversations and projects for authenticated (non-guest) users
  useEffect(() => {
    if (isAuthenticated) {
      loadConversations(0);
    }
  }, [loadConversations, isAuthenticated]);

  // Ensure projects are loaded for project picker (authenticated users only)
  useEffect(() => {
    if (isAuthenticated && projects.length === 0) {
      fetchProjectsApi()
        .then((data) => dispatch(setProjects(data.projects || [])))
        .catch(() => showError("Couldn't load projects."));
    }
  }, [projects.length, dispatch, showError, isAuthenticated]);

  // Refresh conversations when currentChatId changes (new conversation created)
  useEffect(() => {
    if (isAuthenticated && currentChatId) {
      loadConversations(0);
    }
  }, [currentChatId, loadConversations, isAuthenticated]);

  // Listen for conversation-updated events from chat stream (covers creation + title updates)
  useEffect(() => {
    if (!isAuthenticated) return;
    const handleConversationUpdated = () => loadConversations(0);
    window.addEventListener('araviel-conversation-updated', handleConversationUpdated);
    return () =>
      window.removeEventListener('araviel-conversation-updated', handleConversationUpdated);
  }, [loadConversations, isAuthenticated]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Global Cmd/Ctrl+K shortcut for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);
  const showFullContent = isMobile || !collapsed;

  const handleNewChat = () => {
    dispatch(createNewChat());
    navigate('/');
    if (isMobile) {
      dispatch(setCollapsed(true));
    }
  };

  const handleChatClick = (chatId) => {
    navigate(`/conversations/${chatId}`);
    if (isMobile) {
      dispatch(setCollapsed(true));
    }
  };

  const handleLoadMore = () => {
    if (!conversationsLoading && conversations.length < conversationsTotal) {
      loadConversations(conversations.length);
    }
  };

  const handleConversationsClick = () => {
    navigate(location.pathname === '/conversations' ? '/' : '/conversations');
    if (isMobile) {
      dispatch(setCollapsed(true));
    }
  };

  const handleSearchClick = () => {
    navigate('/search');
    if (isMobile) {
      dispatch(setCollapsed(true));
    }
  };

  const handleProjectsClick = () => {
    navigate(location.pathname.startsWith('/projects') ? '/' : '/projects');
    if (isMobile) {
      dispatch(setCollapsed(true));
    }
  };

  const handleModelsClick = () => {
    navigate(location.pathname === '/models' ? '/' : '/models');
    if (isMobile) {
      dispatch(setCollapsed(true));
    }
  };

  const handleGalleryClick = () => {
    navigate(location.pathname.startsWith('/images') ? '/' : '/images');
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
          {isMobile ? (
            <button
              className={styles.mobileCloseBtn}
              onClick={handleCloseSidebar}
              aria-label="Close menu"
            >
              <CloseIcon />
            </button>
          ) : (
            showFullContent && (
              <button
                className={styles.collapseChevron}
                onClick={() => dispatch(toggleSidebar())}
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
              >
                <ChevronLeftIcon />
              </button>
            )
          )}
        </div>

        <button className={styles.newChatBtn} onClick={handleNewChat} title="New chat">
          <PlusIcon />
          {showFullContent && <span>New chat</span>}
        </button>

        <button
          className={`${styles.searchBtn} ${location.pathname === '/search' ? styles.active : ''}`}
          onClick={handleSearchClick}
          title="Search"
          aria-label="Search"
        >
          <SearchIcon />
          {showFullContent && (
            <>
              <span>Search</span>
              <kbd className={styles.searchKbd}>{isMac ? '\u2318' : 'Ctrl+'}K</kbd>
            </>
          )}
        </button>

        {showFullContent && (
          <h2 className={styles.sectionLabel} id="sidebarMenuLabel">
            Menu
          </h2>
        )}

        <nav className={styles.nav} aria-labelledby="sidebarMenuLabel">
          <button
            className={`${styles.navItem} ${
              location.pathname.startsWith('/projects') ? styles.active : ''
            }`}
            onClick={handleProjectsClick}
            title="Projects"
            aria-label="Projects"
          >
            <ProjectsIcon />
            {showFullContent && <span>Projects</span>}
          </button>
          <button
            className={`${styles.navItem} ${
              location.pathname.startsWith('/images') ? styles.active : ''
            }`}
            onClick={handleGalleryClick}
            title="Image Gallery"
            aria-label="Image Gallery"
          >
            <ImageGalleryIcon />
            {showFullContent && <span>Images</span>}
          </button>
          <button
            className={`${styles.navItem} ${
              location.pathname === '/conversations' ? styles.active : ''
            }`}
            onClick={handleConversationsClick}
            title="Conversation History"
            aria-label="Conversation History"
          >
            <ConversationsIcon />
            {showFullContent && <span>Conversations</span>}
          </button>
          <button
            className={`${styles.navItem} ${location.pathname === '/models' ? styles.active : ''}`}
            onClick={handleModelsClick}
            title="Models"
            aria-label="Models"
          >
            <ModelsIcon />
            {showFullContent && <span>Models</span>}
          </button>
        </nav>

        {showFullContent && (
          <h2 className={styles.sectionLabel} id="sidebarRecentsLabel">
            Recents
          </h2>
        )}

        {showFullContent && (
          <div className={styles.recents} aria-labelledby="sidebarRecentsLabel">
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
              {!isAuthenticated ? (
                <p className={styles.recentsEmpty}>Sign in to see your chats</p>
              ) : conversationsLoading && conversations.length === 0 ? (
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
                            <div className={styles.recentItemRow}>
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
                            </div>
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
          {!showFullContent && isAuthenticated && (
            <span
              className={`${styles.tierBadge} ${
                userTier && userTier !== 'free' ? styles.tierBadgePaid : ''
              }`}
              title={`${userTier.charAt(0).toUpperCase() + userTier.slice(1)} plan`}
              aria-label={`${userTier} plan`}
            >
              {userTier.slice(0, 3)}
            </span>
          )}
          <div className={styles.userCard} ref={userMenuRef}>
            <button
              className={`${styles.userSection} ${userMenuOpen ? styles.userSectionOpen : ''}`}
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div className={styles.userAvatar}>
                {authUser?.avatarUrl ? (
                  <img
                    src={authUser.avatarUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = '';
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                  />
                ) : null}
                <span style={{ display: authUser?.avatarUrl ? 'none' : '' }}>
                  <UserIcon />
                </span>
              </div>
              {showFullContent && (
                <>
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>
                      {isAuthenticated
                        ? authUser?.fullName || authUser?.email?.split('@')[0] || 'User'
                        : 'Guest'}
                    </span>
                    <span className={styles.userPlan}>
                      {isAuthenticated
                        ? `${userTier.charAt(0).toUpperCase() + userTier.slice(1)} plan`
                        : 'Sign in to save'}
                    </span>
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
                    if (!isAuthenticated) {
                      navigate('/login', {
                        state: { from: location.pathname + location.search },
                      });
                    } else {
                      navigate('/settings');
                    }
                  }}
                >
                  <SettingsIcon />
                  <span>Settings</span>
                </button>
                <button
                  className={styles.userDropdownItem}
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/plans');
                  }}
                >
                  <UpgradePlanIcon />
                  <span>Upgrade Plan</span>
                </button>
                {isAuthenticated && (
                  <button
                    className={styles.userDropdownItem}
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/subscription');
                    }}
                  >
                    <CreditCardIcon />
                    <span>My Subscription</span>
                  </button>
                )}
                <button
                  className={styles.userDropdownItem}
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/settings/usage');
                  }}
                >
                  <ZapIcon />
                  <span>Usage & Credits</span>
                </button>
                <button
                  className={styles.userDropdownItem}
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/settings/personalisation');
                  }}
                >
                  <EditIcon />
                  <span>Personalisation</span>
                </button>
                <button className={styles.userDropdownItem} onClick={() => setUserMenuOpen(false)}>
                  <HelpCircleIcon />
                  <span>Help</span>
                </button>
                <div className={styles.userDropdownDivider} />
                {isAuthenticated ? (
                  <button
                    className={styles.userDropdownItem}
                    onClick={() => {
                      setUserMenuOpen(false);
                      dispatch(signOut());
                    }}
                  >
                    <LogOutIcon />
                    <span>Sign out</span>
                  </button>
                ) : (
                  <button
                    className={styles.userDropdownItem}
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/login', {
                        state: { from: location.pathname + location.search },
                      });
                    }}
                  >
                    <LogOutIcon />
                    <span>Sign in / Sign up</span>
                  </button>
                )}
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

      {/* Search modal */}
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}
