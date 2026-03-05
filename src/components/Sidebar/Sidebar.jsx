import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect, useCallback } from 'react';
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
  UserIcon,
  SunIcon,
  MoonIcon,
  MonitorIcon,
  MenuIcon,
  CloseIcon,
  ModelsIcon,
  AnalyticsIcon,
  ImageGalleryIcon,
} from '../Icons';
import styles from './Sidebar.module.css';

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

        <button className={styles.newChatBtn} onClick={handleNewChat}>
          <PlusIcon />
          {showFullContent && <span>New Chat</span>}
        </button>

        <nav className={styles.nav}>
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
          <button
            className={`${styles.navItem} ${activeItem === 'gallery' ? styles.active : ''}`}
            onClick={handleGalleryClick}
            title="Image Gallery"
            aria-label="Image Gallery"
          >
            <ImageGalleryIcon />
            {showFullContent && <span>Images</span>}
          </button>
        </nav>

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
              ) : conversations.length > 0 ? (
                <>
                  <ul className={styles.recentsList}>
                    {conversations.map((chat) => (
                      <li key={chat.id}>
                        <button
                          className={`${styles.recentItem} ${
                            currentChatId === chat.id ? styles.recentItemActive : ''
                          }`}
                          onClick={() => handleChatClick(chat.id)}
                        >
                          <span>{chat.title}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
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
