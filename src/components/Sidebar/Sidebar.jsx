import { useSelector, useDispatch } from 'react-redux'
import { useState, useEffect } from 'react'
import { selectSidebarCollapsed, selectActiveItem, toggleSidebar, setActiveItem, setCollapsed } from '../../store/slices/sidebarSlice'
import { selectRecentChats, createNewChat, setCurrentChat } from '../../store/slices/chatSlice'
import { selectTheme, setTheme } from '../../store/slices/themeSlice'
import {
  HomeIcon,
  ProjectsIcon,
  LibraryIcon,
  SettingsIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChatIcon,
  UserIcon,
  SunIcon,
  MoonIcon,
  MonitorIcon,
  MenuIcon,
} from '../Icons'
import styles from './Sidebar.module.css'

const navItems = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'projects', label: 'Projects', icon: ProjectsIcon },
  { id: 'library', label: 'Library', icon: LibraryIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

export default function Sidebar() {
  const dispatch = useDispatch()
  const collapsed = useSelector(selectSidebarCollapsed)
  const activeItem = useSelector(selectActiveItem)
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

  // On mobile, collapsed means hidden. On desktop, collapsed means narrow.
  // For rendering content, on mobile we always show full content when visible
  const showFullContent = isMobile || !collapsed

  const handleNewChat = () => {
    dispatch(createNewChat())
    dispatch(setActiveItem('home'))
  }

  const handleNavClick = (id) => {
    dispatch(setActiveItem(id))
    // Close sidebar on mobile after navigation
    if (isMobile) {
      dispatch(setCollapsed(true))
    }
  }

  const handleChatClick = (chatId) => {
    dispatch(setCurrentChat(chatId))
    // Close sidebar on mobile after selecting chat
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

  return (
    <>
      {/* Mobile menu button */}
      <button
        className={styles.mobileMenuBtn}
        onClick={() => dispatch(toggleSidebar())}
        aria-label="Open menu"
      >
        <MenuIcon />
      </button>

      {/* Overlay for mobile */}
      <div
        className={`${styles.overlay} ${!collapsed ? styles.overlayVisible : ''}`}
        onClick={handleOverlayClick}
      />

      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
        {/* Collapse button on the edge - desktop only */}
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
        </div>

        <button className={styles.newChatBtn} onClick={handleNewChat}>
          <PlusIcon />
          {showFullContent && <span>New Chat</span>}
        </button>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={`${styles.navItem} ${activeItem === item.id ? styles.active : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <Icon />
                {showFullContent && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {showFullContent && (
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

        {!showFullContent && (
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
