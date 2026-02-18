import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect } from 'react';
import {
  selectSidebarCollapsed,
  toggleSidebar,
  setCollapsed,
  selectActiveItem,
  setActiveItem,
} from '../../store/slices/sidebarSlice';
import { selectRecentChats, createNewChat, setCurrentChat } from '../../store/slices/chatSlice';
import { selectTheme, setTheme } from '../../store/slices/themeSlice';
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
} from '../Icons';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const dispatch = useDispatch();
  const collapsed = useSelector(selectSidebarCollapsed);
  const recentChats = useSelector(selectRecentChats);
  const themeMode = useSelector(selectTheme);
  const activeItem = useSelector(selectActiveItem);
  const [isMobile, setIsMobile] = useState(false);
  const [recentsExpanded, setRecentsExpanded] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
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

  const handleChatClick = (chatId) => {
    dispatch(setCurrentChat(chatId));
    dispatch(setActiveItem('home'));
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
              {recentChats.length > 0 ? (
                <ul className={styles.recentsList}>
                  {recentChats.map((chat) => (
                    <li key={chat.id}>
                      <button
                        className={styles.recentItem}
                        onClick={() => handleChatClick(chat.id)}
                      >
                        <ChatIcon />
                        <span>{chat.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
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
