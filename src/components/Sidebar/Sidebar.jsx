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
  AnalyticsIcon,
  ImageGalleryIcon,
  ConversationsIcon,
  MoreVerticalIcon,
  ShareIcon,
  EditIcon,
  ArchiveIcon,
  TrashIcon,
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
  const menuRef = useRef(null);
  const menuBtnRef = useRef(null);
  const renameInputRef = useRef(null);

  const groupedConversations = useMemo(
    () => groupConversationsByTime(conversations),
    [conversations]
  );

  // Load conversations on mount
  const loadConversations = useCallback(
    async (offset = 0) => {
      dispatch(setConversationsLoading(true));
      try {
        const data = await fetchConversations(20, offset);
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
            // Match images from localStorage by checking if image was created
            // near this message's timestamp (within 30s window)
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

  const handleModelsClick = () => {
    dispatch(setActiveItem(activeItem === 'models' ? 'home' : 'models'));
    if (isMobile) {
      dispatch(setCollapsed(true));
    }
  };

  const handleAnalyticsClick = () => {
    dispatch(setActiveItem(activeItem === 'analytics' ? 'home' : 'analytics'));
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
  }, [menuOpenId]);

  // Focus rename input when renaming starts
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const handleMenuToggle = (e, chatId) => {
    e.stopPropagation();
    setMenuOpenId((prev) => (prev === chatId ? null : chatId));
  };

  const handleRename = (chat) => {
    setMenuOpenId(null);
    setRenamingId(chat.id);
    setRenameValue(chat.title || '');
  };

  const handleRenameSubmit = (chatId) => {
    const trimmed = renameValue.trim();
    if (trimmed) {
      // Update title locally in Redux store
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

  const handleShare = (chatId) => {
    setMenuOpenId(null);
    const url = `${window.location.origin}/chat/${chatId}`;
    navigator.clipboard?.writeText(url);
  };

  const handleArchive = (chatId) => {
    setMenuOpenId(null);
    try {
      const archived = new Set(JSON.parse(localStorage.getItem('araviel-archived-chats') || '[]'));
      if (archived.has(chatId)) {
        archived.delete(chatId);
      } else {
        archived.add(chatId);
      }
      localStorage.setItem('araviel-archived-chats', JSON.stringify([...archived]));
    } catch {
      // Silently fail
    }
  };

  const handleDelete = (chatId) => {
    setMenuOpenId(null);
    // Remove from conversations list
    dispatch(
      setConversations({
        conversations: conversations.filter((c) => c.id !== chatId),
        total: Math.max(0, conversationsTotal - 1),
      })
    );
    // Clean up from starred/archived
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
          <button
            className={`${styles.navItem} ${activeItem === 'analytics' ? styles.active : ''}`}
            onClick={handleAnalyticsClick}
            title="Analytics"
            aria-label="Analytics"
          >
            <AnalyticsIcon />
            {showFullContent && <span>Analytics</span>}
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
                              <div ref={menuRef} className={styles.chatDropdown}>
                                <button
                                  className={styles.chatDropdownItem}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleShare(chat.id);
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
                                  <span>Archive</span>
                                </button>
                                <div className={styles.chatDropdownDivider} />
                                <button
                                  className={`${styles.chatDropdownItem} ${styles.chatDropdownItemDanger}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(chat.id);
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
    </>
  );
}
