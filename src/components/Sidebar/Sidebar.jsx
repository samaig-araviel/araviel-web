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
import { fetchConversations, fetchConversationMessages } from '../../services/api';
import { getGeneratedImages } from '../../services/imageGeneration';
import {
  PlusIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
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
} from '../Icons';
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
    const menuHeight = 170;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceBelow < menuHeight + 8 && spaceAbove > spaceBelow;

    const newStyle = {};
    if (openUpward) {
      newStyle.bottom = '100%';
      newStyle.top = 'auto';
      newStyle.marginBottom = '4px';
    } else {
      newStyle.top = '100%';
      newStyle.bottom = 'auto';
      newStyle.marginTop = '4px';
    }

    newStyle.right = '0';
    newStyle.left = 'auto';

    setDropdownStyle(newStyle);
  }, [menuOpenId]);

  return { dropdownStyle, menuBtnRef, menuRef };
}

export default function Sidebar() {
  const dispatch = useDispatch();
  const collapsed = useSelector(selectSidebarCollapsed);
  const conversations = useSelector(selectConversations);
  const conversationsTotal = useSelector(selectConversationsTotal);
  const conversationsLoading = useSelector(selectConversationsLoading);
  const currentChatId = useSelector(selectCurrentChatId);
  const themeMode = useSelector(selectTheme);
  const activeItem = useSelector(selectActiveItem);
  const [isMobile, setIsMobile] = useState(false);
  const [recentsExpanded, setRecentsExpanded] = useState(true);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [shareLinkConfirm, setShareLinkConfirm] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [archivedIds, setArchivedIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('araviel-archived-chats') || '[]'));
    } catch {
      return new Set();
    }
  });
  const renameInputRef = useRef(null);

  const { dropdownStyle, menuBtnRef, menuRef } = useDropdownPosition(menuOpenId);

  const groupedConversations = useMemo(
    () => groupConversationsByTime(conversations),
    [conversations]
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
        // Silently fail — sidebar will show empty state
      } finally {
        dispatch(setConversationsLoading(false));
      }
    },
    [dispatch]
  );

  useEffect(() => {
    loadConversations(0);
  }, [loadConversations]);

  // Refresh conversations when currentChatId changes (new conversation created)
  useEffect(() => {
    if (currentChatId) {
      loadConversations(0);
    }
  }, [currentChatId, loadConversations]);

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
            const msgTime = new Date(msg.createdAt).getTime();
            const matched = storedImages.filter((img) => Math.abs(img.createdAt - msgTime) < 30000);
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
    try {
      const next = new Set(archivedIds);
      if (next.has(chatId)) {
        next.delete(chatId);
      } else {
        next.add(chatId);
      }
      setArchivedIds(next);
      localStorage.setItem('araviel-archived-chats', JSON.stringify([...next]));
    } catch {
      // Silently fail
    }
  };

  const handleDeleteRequest = (chatId) => {
    closeMenu();
    setDeleteConfirm(chatId);
  };

  const confirmDelete = () => {
    const chatId = deleteConfirm;
    dispatch(
      setConversations({
        conversations: conversations.filter((c) => c.id !== chatId),
        total: Math.max(0, conversationsTotal - 1),
      })
    );
    try {
      const starred = new Set(JSON.parse(localStorage.getItem('araviel-starred-chats') || '[]'));
      const archived = new Set(JSON.parse(localStorage.getItem('araviel-archived-chats') || '[]'));
      starred.delete(chatId);
      archived.delete(chatId);
      localStorage.setItem('araviel-starred-chats', JSON.stringify([...starred]));
      localStorage.setItem('araviel-archived-chats', JSON.stringify([...archived]));
    } catch {
      // Silently fail
    }
    setDeleteConfirm(null);
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
            <button
              className={styles.recentsHeader}
              onClick={toggleRecents}
              aria-expanded={recentsExpanded}
            >
              <span className={styles.recentsLabel}>Recents</span>
              <span
                className={`${styles.recentsChevron} ${recentsExpanded ? styles.expanded : ''}`}
              >
                <ChevronDownIcon />
              </span>
            </button>
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
                                  <span>
                                    {archivedIds.has(chat.id) ? 'Move to Chats' : 'Archive'}
                                  </span>
                                </button>
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
                  {conversations.length < conversationsTotal && (
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
                <p className={styles.recentsEmpty}>No recent chats</p>
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
          <div className={styles.userSection}>
            <UserIcon />
            {showFullContent && <span>Pro User</span>}
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
    </>
  );
}
