import { useSelector, useDispatch } from 'react-redux'
import { useState, useEffect } from 'react'
import { selectSidebarCollapsed, toggleSidebar, setCollapsed } from '../../store/slices/sidebarSlice'
import { selectRecentChats, createNewChat, setCurrentChat } from '../../store/slices/chatSlice'
import { selectTheme, setTheme } from '../../store/slices/themeSlice'
import {
  PlusIcon,
  ChevronLeftIcon,
  ChatIcon,
  UserIcon,
  SunIcon,
  MoonIcon,
  MonitorIcon,
  MenuIcon,
  CloseIcon,
} from '../Icons'
import styles from './Sidebar.module.css'

export default function Sidebar() {
  const dispatch = useDispatch()
  const collapsed = useSelector(selectSidebarCollapsed)
  const recentChats = useSelector(selectRecentChats)
  const themeMode = useSelector(selectTheme)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const showFullContent = isMobile || !collapsed

  const handleNewChat = () => {
    dispatch(createNewChat())
    if (isMobile) {
      dispatch(setCollapsed(true))
    }
  }

  const handleChatClick = (chatId) => {
    dispatch(setCurrentChat(chatId))
    if (isMobile) {
      dispatch(setCollapsed(true))
    }
  }

  const handleThemeChange = (mode) => {
    dispatch(setTheme(mode))
  }

  const handleOverlayClick = () => {
    dispatch(setCollapsed(true))
  }

  const handleCloseSidebar = () => {
    dispatch(setCollapsed(true))
  }

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
            <div className={styles.logoIcon}>A</div>
            {showFullContent && <span className={styles.logoText}>Araviel</span>}
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

        {showFullContent && recentChats.length > 0 && (
          <div className={styles.recents}>
            <span className={styles.recentsLabel}>RECENTS</span>
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
          </div>
        )}

        {!showFullContent && recentChats.length > 0 && (
          <div className={styles.recentsCollapsed}>
            {recentChats.map((chat) => (
              <button
                key={chat.id}
                className={styles.recentItemCollapsed}
                onClick={() => handleChatClick(chat.id)}
                title={chat.title}
              >
                <ChatIcon />
              </button>
            ))}
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
  )
}
